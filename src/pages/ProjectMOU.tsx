import React from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { FileText, Download, Plus, Edit, Search, Save } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/src/lib/utils';

export default function ProjectMOU() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [mouData, setMouData] = React.useState({
    duration: '',
    cost: 0,
    dateOfMOU: '',
    dateOfCommencement: '',
    extensionDate: '',
    reasonOfExtension: '',
    financialYear: ''
  });

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'projects'), where('isEliminated', '==', false), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });
    return () => unsubscribe();
  }, []);

  const handleEditMOU = (project: any) => {
    setSelectedProject(project);
    setMouData({
      duration: project.mouDetails?.duration || '',
      cost: project.mouDetails?.cost || 0,
      dateOfMOU: project.mouDetails?.dateOfMOU ? new Date(project.mouDetails.dateOfMOU).toISOString().split('T')[0] : '',
      dateOfCommencement: project.mouDetails?.dateOfCommencement ? new Date(project.mouDetails.dateOfCommencement).toISOString().split('T')[0] : '',
      extensionDate: project.mouDetails?.extensionDate ? new Date(project.mouDetails.extensionDate).toISOString().split('T')[0] : '',
      reasonOfExtension: project.mouDetails?.reasonOfExtension || '',
      financialYear: project.mouDetails?.financialYear || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveMOU = async () => {
    if (!selectedProject) return;

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        mouDetails: {
          ...mouData,
          dateOfMOU: mouData.dateOfMOU ? new Date(mouData.dateOfMOU).getTime() : null,
          dateOfCommencement: mouData.dateOfCommencement ? new Date(mouData.dateOfCommencement).getTime() : null,
          extensionDate: mouData.extensionDate ? new Date(mouData.extensionDate).getTime() : null,
        },
        updatedAt: Date.now()
      });
      toast.success("MOU details updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProject.id}`);
    }
  };

  const downloadExcel = (project: any) => {
    const data = [
      {
        "Project Name": project.name,
        "Duration": project.mouDetails?.duration || 'N/A',
        "Cost": project.mouDetails?.cost || 0,
        "Date of MOU": project.mouDetails?.dateOfMOU ? new Date(project.mouDetails.dateOfMOU).toLocaleDateString() : 'N/A',
        "Date of Commencement": project.mouDetails?.dateOfCommencement ? new Date(project.mouDetails.dateOfCommencement).toLocaleDateString() : 'N/A',
        "Extension Date": project.mouDetails?.extensionDate ? new Date(project.mouDetails.extensionDate).toLocaleDateString() : 'N/A',
        "Reason of Extension": project.mouDetails?.reasonOfExtension || 'N/A',
        "Financial Year": project.mouDetails?.financialYear || 'N/A'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MOU Slip");
    XLSX.writeFile(wb, `${project.name}_MOU_Slip.xlsx`);
    toast.success("MOU Slip downloaded in Excel format");
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12">Loading MOU details...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 backdrop-blur-xl focus:ring-primary/20" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group relative overflow-hidden transition-all duration-500 border border-border/50 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-primary/10">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="font-mono text-[10px] tracking-widest px-3 py-1 rounded-full border-primary/20 text-primary">
                  MOU ACTIVE
                </Badge>
                <FileText className="text-primary/40" size={20} />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono uppercase tracking-widest mt-2">
                FY: {project.mouDetails?.financialYear || 'TBD'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-sm font-bold">{project.mouDetails?.duration || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cost</p>
                  <p className="text-sm font-bold">₹{project.mouDetails?.cost?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl gap-2 font-bold text-xs border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                  onClick={() => handleEditMOU(project)}
                >
                  <Edit size={16} />
                  EDIT MOU
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl gap-2 font-bold text-xs shadow-xl shadow-primary/20"
                  onClick={() => downloadExcel(project)}
                >
                  <Download size={16} />
                  MOU SLIP
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Edit MOU Details</DialogTitle>
            <DialogDescription>Update the Memorandum of Undertaking for {selectedProject?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Project Name</Label>
              <Input value={selectedProject?.name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Financial Year</Label>
              <Input 
                value={mouData.financialYear} 
                onChange={(e) => setMouData({...mouData, financialYear: e.target.value})}
                placeholder="e.g. 2023-24"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Duration</Label>
              <Input 
                value={mouData.duration} 
                onChange={(e) => setMouData({...mouData, duration: e.target.value})}
                placeholder="e.g. 12 Months"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Project Cost (₹)</Label>
              <Input 
                type="number"
                value={mouData.cost} 
                onChange={(e) => setMouData({...mouData, cost: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Date of MOU</Label>
              <Input 
                type="date"
                value={mouData.dateOfMOU} 
                onChange={(e) => setMouData({...mouData, dateOfMOU: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Date of Commencement</Label>
              <Input 
                type="date"
                value={mouData.dateOfCommencement} 
                onChange={(e) => setMouData({...mouData, dateOfCommencement: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest">Extension Date (If any)</Label>
              <Input 
                type="date"
                value={mouData.extensionDate} 
                onChange={(e) => setMouData({...mouData, extensionDate: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-black uppercase tracking-widest">Reason of Extension</Label>
              <Input 
                value={mouData.reasonOfExtension} 
                onChange={(e) => setMouData({...mouData, reasonOfExtension: e.target.value})}
                placeholder="Provide reason if extension was granted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={handleSaveMOU}>
              <Save size={16} />
              Save MOU Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
