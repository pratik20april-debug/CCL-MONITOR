import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Progress } from '@/src/components/ui/progress';
import { Download, Upload, FileText, MapPin, Camera, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { cn } from '@/src/lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, addDoc, collectionGroup, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table as DocTable, TableRow as DocTableRow, TableCell as DocTableCell, WidthType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

export default function ProgressReport() {
  const [reports, setReports] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    projectId: '',
    area: '',
    progressText: '',
    impactAssessment: '',
    physicalProgress: 0,
    financialProgress: 0
  });
  const [tempPhotos, setTempPhotos] = React.useState<any[]>([]);
  const [isStatsOpen, setIsStatsOpen] = React.useState(false);
  const [statsProject, setStatsProject] = React.useState<any>(null);
  const [selectedDetailedReport, setSelectedDetailedReport] = React.useState<any>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let location: { lat: number, lng: number } | null = null;
    try {
      location = await new Promise((resolve) => {
        if (!navigator.geolocation) resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
    } catch (err) {
      console.error("Geolocation error:", err);
    }

    const newPhotos = Array.from(files).map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      lat: location?.lat,
      lng: location?.lng,
      timestamp: Date.now()
    }));
    
    setTempPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`${files.length} photos added with geotags`);
  };

  React.useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch projects for dropdown
    const qProjects = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData.filter((p: any) => !p.isEliminated));
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

  const handleExportWord = async (report: any) => {
    const project = projects.find(p => p.id === report.projectId);
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "CENTRAL COALFIELDS LIMITED",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "DETAILED CSR PROGRESS REPORT",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Project Name: ", bold: true }),
              new TextRun(project?.name || 'N/A'),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Sector: ", bold: true }),
              new TextRun(project?.sector || 'N/A'),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Current Status: ", bold: true }),
              new TextRun(project?.status || 'N/A'),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "MOU DETAILS",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "MOU Cost: ", bold: true }),
              new TextRun(`₹${project?.mouDetails?.cost?.toLocaleString() || '0'}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Duration: ", bold: true }),
              new TextRun(project?.mouDetails?.duration || 'N/A'),
            ],
          }),
          new Paragraph({
            text: "PROGRESS SUMMARY",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Physical Progress: ", bold: true }),
              new TextRun(`${report.physicalProgress}%`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Financial Progress: ", bold: true }),
              new TextRun(`${report.financialProgress}%`),
            ],
          }),
          new Paragraph({
            text: "REPORT DETAILS",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Location: ", bold: true }),
              new TextRun(report.area),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Work Description: ", bold: true }),
              new TextRun(report.progressText),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Impact Assessment: ", bold: true }),
              new TextRun(report.impactAssessment),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `CSR_Detailed_Report_${project?.name || 'Project'}.docx`);
    toast.success("Detailed report exported to Word");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.area || !formData.progressText) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const project = projects.find(p => p.id === formData.projectId);
      const reportData = {
        ...formData,
        projectName: project?.name || 'Unknown Project',
        date: Date.now(),
        status: 'PENDING',
        submittedBy: auth.currentUser?.uid,
        geotaggedPhotos: tempPhotos
      };

      await addDoc(collection(db, 'projects', formData.projectId, 'reports'), reportData);
      
      // Update project progress in the project document as well for quick access
      await updateDoc(doc(db, 'projects', formData.projectId), {
        physicalProgress: formData.physicalProgress,
        financialProgress: formData.financialProgress,
        monitoringStatus: tempPhotos.length > 0 ? 'SECURE' : 'WARNING',
        updatedAt: Date.now()
      });

      toast.success("Progress report submitted for verification!");
      setFormData({ projectId: '', area: '', progressText: '', impactAssessment: '', physicalProgress: 0, financialProgress: 0 });
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Physical Progress (%)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    className="bg-slate-50" 
                    value={formData.physicalProgress}
                    onChange={(e) => setFormData({ ...formData, physicalProgress: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Financial Progress (%)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    className="bg-slate-50" 
                    value={formData.financialProgress}
                    onChange={(e) => setFormData({ ...formData, financialProgress: Number(e.target.value) })}
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
                  Please upload geotagged photos with your report to ensure the project monitoring status remains secure.
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
                  <TableHead>Physical %</TableHead>
                  <TableHead>Financial %</TableHead>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{report.physicalProgress || 0}%</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${report.physicalProgress || 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{report.financialProgress || 0}%</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${report.financialProgress || 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          hasGeotags ? "text-green-600 border-green-200 bg-green-50" : "text-yellow-600 border-yellow-200 bg-yellow-50"
                        )}>
                          {hasGeotags ? "SECURE" : "WARNING"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-3">
                          {report.geotaggedPhotos?.map((p: any, i: number) => (
                            <div key={i} className="relative group">
                              <div className="w-10 h-10 rounded-full border-4 border-card overflow-hidden shadow-lg">
                                <img 
                                  src={typeof p === 'string' ? p : p.url} 
                                  className="w-full h-full object-cover" 
                                  alt="Geotag"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                {p.lat ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : 'No Geotag'}
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
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:bg-primary/10"
                            onClick={() => {
                              setStatsProject(projects.find(p => p.id === report.projectId));
                              setIsStatsOpen(true);
                            }}
                          >
                            <BarChart3 size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:bg-primary/10"
                            onClick={() => setSelectedDetailedReport(report)}
                          >
                            View
                          </Button>
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

      {/* Statistical Analysis Dialog */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="max-w-4xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Statistical Progress Analysis</DialogTitle>
            <DialogDescription>In-depth physical and financial progress tracking for {statsProject?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-8">
            <div className="h-[300px] w-full">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Physical vs Financial Progress Trend</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reports.filter(r => r.projectId === statsProject?.id).reverse()}>
                  <defs>
                    <linearGradient id="colorPhys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.15 240)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.55 0.15 240)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString()} 
                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                  />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  <Area type="monotone" dataKey="physicalProgress" name="Physical %" stroke="oklch(0.55 0.15 240)" fillOpacity={1} fill="url(#colorPhys)" strokeWidth={3} />
                  <Area type="monotone" dataKey="financialProgress" name="Financial %" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFin)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Current Physical Status</p>
                <p className="text-3xl font-black">{statsProject?.physicalProgress || 0}%</p>
                <Progress value={statsProject?.physicalProgress || 0} className="h-2 mt-3" />
              </div>
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Current Financial Status</p>
                <p className="text-3xl font-black">{statsProject?.financialProgress || 0}%</p>
                <Progress value={statsProject?.financialProgress || 0} className="h-2 mt-3 bg-blue-100" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsStatsOpen(false)} className="rounded-xl font-bold">Close Analysis</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Report View Dialog */}
      <Dialog open={!!selectedDetailedReport} onOpenChange={() => setSelectedDetailedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] print:shadow-none print:border-none">
          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Detailed Progress Report</DialogTitle>
                <DialogDescription>Comprehensive analysis of project status and MOU compliance</DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                  <Download size={16} /> Print PDF
                </Button>
                <Button variant="default" size="sm" className="gap-2" onClick={() => handleExportWord(selectedDetailedReport)}>
                  <FileText size={16} /> Export Word
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedDetailedReport && (
            <div id="printable-report" className="py-6 space-y-8 print:p-0">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-black tracking-tighter text-primary">CENTRAL COALFIELDS LIMITED</h2>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em]">CSR Monitoring & Impact Assessment</p>
                <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Project Overview</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground font-medium">Project Name</span>
                        <span className="text-sm font-bold">{projects.find(p => p.id === selectedDetailedReport.projectId)?.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground font-medium">Sector</span>
                        <span className="text-sm font-bold">{projects.find(p => p.id === selectedDetailedReport.projectId)?.sector || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-muted-foreground font-medium">Current Status</span>
                        <Badge className="font-bold">{projects.find(p => p.id === selectedDetailedReport.projectId)?.status}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">MOU Compliance</h4>
                    <div className="p-4 rounded-2xl bg-muted/50 border space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">MOU Cost</span>
                        <span className="font-bold">₹{projects.find(p => p.id === selectedDetailedReport.projectId)?.mouDetails?.cost?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-bold">{projects.find(p => p.id === selectedDetailedReport.projectId)?.mouDetails?.duration || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Commencement</span>
                        <span className="font-bold">{projects.find(p => p.id === selectedDetailedReport.projectId)?.mouDetails?.dateOfCommencement ? new Date(projects.find(p => p.id === selectedDetailedReport.projectId).mouDetails.dateOfCommencement).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Progress Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Physical</p>
                        <p className="text-xl font-black">{selectedDetailedReport.physicalProgress}%</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-1">Financial</p>
                        <p className="text-xl font-black">{selectedDetailedReport.financialProgress}%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Work Description</h4>
                    <p className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-2xl border italic">
                      "{selectedDetailedReport.progressText}"
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Geotagged Evidence</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedDetailedReport.geotaggedPhotos?.map((p: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md">
                        <img 
                          src={typeof p === 'string' ? p : p.url} 
                          className="w-full h-full object-cover" 
                          alt="Evidence"
                        />
                      </div>
                      {p.lat && (
                        <p className="text-[8px] font-mono text-muted-foreground text-center">
                          LAT: {p.lat.toFixed(6)} | LNG: {p.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>Report ID: {selectedDetailedReport.id}</span>
                <span>Generated on: {new Date().toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
