import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Download, Upload, FileText, MapPin, Camera, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { cn } from '@/src/lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, addDoc, collectionGroup, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function ProgressReport() {
  const [reports, setReports] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    projectId: '',
    area: '',
    progressText: '',
    impactAssessment: ''
  });
  const [tempPhotos, setTempPhotos] = React.useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
    setTempPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`${files.length} photos added to report`);
  };

  React.useEffect(() => {
    // Fetch projects for dropdown
    const qProjects = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    // Fetch all reports using collectionGroup
    const qReports = query(collectionGroup(db, 'reports'), orderBy('date', 'desc'));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => {
      unsubProjects();
      unsubReports();
    };
  }, []);

  const [reportToDelete, setReportToDelete] = React.useState<{projectId: string, reportId: string} | null>(null);

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    const { projectId, reportId } = reportToDelete;
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'reports', reportId));
      toast.success("Report deleted");
      setReportToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}/reports/${reportId}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Project', 'Area', 'Status', 'Monitoring'];
    const csvContent = [
      headers.join(','),
      ...reports.map(r => {
        const projectName = projects.find(p => p.id === r.projectId)?.name || 'Unknown';
        const monitoring = r.geotaggedPhotos?.length > 0 ? 'SECURE' : 'WARNING';
        return `${r.id},${projectName},${r.area},${r.status},${monitoring}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `csr_progress_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Report exported to CSV");
  };

  const handleRemovePhoto = async (projectId: string, reportId: string, photoIndex: number) => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      const newPhotos = report.geotaggedPhotos.filter((_: any, i: number) => i !== photoIndex);
      await updateDoc(doc(db, 'projects', projectId, 'reports', reportId), {
        geotaggedPhotos: newPhotos
      });

      // Update project monitoring status if no photos left
      if (newPhotos.length === 0) {
        await updateDoc(doc(db, 'projects', projectId), {
          monitoringStatus: 'WARNING',
          updatedAt: Date.now()
        });
      }

      toast.success("Photo removed from report");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}/reports/${reportId}`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.area || !formData.progressText) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const reportData = {
        ...formData,
        date: Date.now(),
        status: 'PENDING',
        submittedBy: auth.currentUser?.uid,
        geotaggedPhotos: tempPhotos
      };

      await addDoc(collection(db, 'projects', formData.projectId, 'reports'), reportData);
      
      // Update project monitoring status
      await updateDoc(doc(db, 'projects', formData.projectId), {
        monitoringStatus: tempPhotos.length > 0 ? 'SECURE' : 'WARNING',
        updatedAt: Date.now()
      });

      toast.success("Progress report submitted for verification!");
      setFormData({ projectId: '', area: '', progressText: '', impactAssessment: '' });
      setTempPhotos([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${formData.projectId}/reports`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading reports...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Form */}
        <Card className="lg:col-span-1 h-fit shadow-md border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Submit New Report
            </CardTitle>
            <CardDescription>Update progress for an active project</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReport} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Project</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Choose project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Area/Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    className="pl-10 bg-slate-50" 
                    placeholder="e.g. Block A, Ranchi" 
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Progress Details</Label>
                <Textarea 
                  placeholder="Describe the work completed..." 
                  className="min-h-[100px] bg-slate-50" 
                  value={formData.progressText}
                  onChange={(e) => setFormData({ ...formData, progressText: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Impact Assessment (Short)</Label>
                <Textarea 
                  placeholder="Briefly describe the impact..." 
                  className="bg-slate-50"
                  value={formData.impactAssessment}
                  onChange={(e) => setFormData({ ...formData, impactAssessment: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Upload Geotagged Images</Label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="file" 
                    id="photo-upload" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-20 border-dashed border-2 flex flex-col gap-1"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Camera size={20} className="text-muted-foreground" />
                    <span className="text-[10px]">Add Photos</span>
                  </Button>
                  {tempPhotos.map((photo, i) => (
                    <div key={i} className="relative h-20 rounded-lg overflow-hidden border">
                      <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button"
                        onClick={() => setTempPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <Plus size={12} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100 space-y-3">
                <div className="flex items-center gap-2 text-yellow-800 text-xs font-bold uppercase tracking-wider">
                  <Camera size={14} />
                  Geotagging Required
                </div>
                <p className="text-xs text-yellow-700">
                  Please upload geotagged photos in the GPS Tracking section to secure the monitoring status.
                </p>
              </div>

              <Button type="submit" className="w-full shadow-lg">Submit Report</Button>
            </form>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>History of submitted progress updates</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
              <Download size={16} />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Monitoring</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const hasGeotags = report.geotaggedPhotos?.length > 0;
                  return (
                    <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium pl-6">
                        {projects.find(p => p.id === report.projectId)?.name || 'Unknown Project'}
                      </TableCell>
                      <TableCell>{report.area}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          hasGeotags ? "text-green-600 border-green-200 bg-green-50" : "text-yellow-600 border-yellow-200 bg-yellow-50"
                        )}>
                          {hasGeotags ? "SECURE" : "WARNING"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-3">
                          {report.geotaggedPhotos?.map((p: string, i: number) => (
                            <div key={i} className="relative group">
                              <div className="w-10 h-10 rounded-full border-4 border-card overflow-hidden shadow-lg">
                                <img 
                                  src={p} 
                                  className="w-full h-full object-cover" 
                                  alt="Geotag"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <button 
                                onClick={() => handleRemovePhoto(report.projectId, report.id, i)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              >
                                <Plus size={10} className="rotate-45" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          report.status === 'VERIFIED' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        )}>
                          {report.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setReportToDelete({ projectId: report.projectId, reportId: report.id })}
                          >
                            <Plus className="rotate-45" size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Progress Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReportToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteReport}>Delete Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
