import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Plus, Search, ChevronRight, CheckCircle2, Upload, FileText, Eye, ExternalLink } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/src/components/ui/dialog';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { Progress } from '@/src/components/ui/progress';
import { PROJECT_SECTIONS_LABELS, SCHEDULE_VII_SECTIONS } from '@/src/constants';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Send, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function Projects() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectSector, setNewProjectSector] = React.useState('OTHERS');
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isViewMode, setIsViewMode] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);

  const exportToDoc = async () => {
    if (!selectedProject) return;

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
            text: "CSR PROJECT REPORT",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Project Name: ${selectedProject.name}`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Project ID: ${selectedProject.id}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...PROJECT_SECTIONS_LABELS.flatMap((label, index) => {
            const sectionKeys = [
              'projectName', 'applicableSection', 'timeline', 'costAndScope', 
              'location', 'primaryBeneficiaries', 'noOfBeneficiaries', 'background',
              'objectives', 'baselineAssessment', 'implementationPlan', 'outcome',
              'monitoringMechanism', 'sustainability', 'impactAssessmentPlan', 
              'otherInfo', 'benefitsToCompany'
            ];
            const sectionKey = sectionKeys[index] || `section_${index}`;
            const value = selectedProject?.sections?.[sectionKey] || 'Not Provided';

            return [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${index + 1}. ${label}`,
                    bold: true,
                    size: 24,
                    underline: {},
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                    size: 22,
                  }),
                ],
                spacing: { after: 200 },
              }),
            ];
          }),
          new Paragraph({
            text: `Report Generated on: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 800 },
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${selectedProject.name.replace(/\s+/g, '_')}_CSR_Report.docx`);
      toast.success("MS Word document generated and downloaded!");
    });
  };

  const handleRemoveDoc = async (projectId: string, docIndex: number) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const newDocs = (project.documents || []).filter((_: any, i: number) => i !== docIndex);
      
      await updateDoc(doc(db, 'projects', projectId), {
        documents: newDocs,
        updatedAt: Date.now()
      });
      toast.success("Document removed successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Uploading ${file.name}...`,
        success: async () => {
          const mockUrl = URL.createObjectURL(file);
          const project = projects.find(p => p.id === projectId);
          const currentDocs = project?.documents || [];
          
          await updateDoc(doc(db, 'projects', projectId), {
            documents: [
              ...currentDocs,
              { url: mockUrl, name: file.name, uploadedAt: Date.now() }
            ],
            updatedAt: Date.now()
          });
          return "Document uploaded successfully!";
        },
        error: "Upload failed",
      }
    );
  };

  React.useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filter out eliminated and completed projects
      setProjects(projectsData.filter((p: any) => !p.isEliminated && p.status !== 'COMPLETED'));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    
    try {
      // Simulate geocoding for Ranchi area
      const mockLat = 23.3441 + (Math.random() - 0.5) * 0.1;
      const mockLng = 85.3096 + (Math.random() - 0.5) * 0.1;

      await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        sector: newProjectSector,
        status: 'INCOMPLETE',
        isGenerated: false,
        monitoringStatus: 'PENDING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: auth.currentUser?.uid,
        isEliminated: false,
        location: {
          address: 'Ranchi, Jharkhand',
          lat: mockLat,
          lng: mockLng
        },
        sections: {
          projectName: newProjectName
        }
      });
      setNewProjectName('');
      setNewProjectSector('OTHERS');
      setIsAddDialogOpen(false);
      toast.success("Project initialized successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await updateDoc(doc(db, 'projects', projectToDelete), {
        isEliminated: true,
        eliminatedAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success("Project moved to Eliminated Projects (Recycle Bin)");
      setProjectToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectToDelete}`);
    }
  };

  const handleUpdateSections = async () => {
    if (!selectedProject) return;
    
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        name: selectedProject.name,
        sections: selectedProject.sections,
        updatedAt: Date.now()
      });
      toast.success("Project details saved!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProject.id}`);
    }
  };

  const handleGenerateProject = async () => {
    if (!selectedProject) return;
    
    // Check if all 17/18 sections have content
    const sections = selectedProject.sections || {};
    const filledCount = Object.values(sections).filter(val => typeof val === 'string' && val.trim().length > 0).length;
    
    if (filledCount < 17) {
      toast.error(`Please fill at least 17 sections. Currently filled: ${filledCount}`);
      return;
    }

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        isGenerated: true,
        status: 'ONGOING',
        monitoringStatus: 'SECURE',
        updatedAt: Date.now()
      });
      toast.success("Project Generated Successfully! It is now ongoing.");
      setIsViewMode(true);
      setSelectedProject({ ...selectedProject, isGenerated: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${selectedProject.id}`);
    }
  };

  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12">Loading projects...</div>;
  }

  if (selectedProject) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans"
      >
        <header className="bg-white/80 backdrop-blur-md border-b px-10 py-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedProject(null)}
              className="rounded-2xl w-12 h-12 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                  isViewMode ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {isViewMode ? "Operational Terminal" : "Build Phase"}
                </Badge>
                <h2 className="text-2xl font-black text-foreground font-heading uppercase tracking-tighter leading-none">{selectedProject.name}</h2>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                {isViewMode ? "Finalized Mission Architecture" : "Configuration Protocol Active"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isViewMode && (
              <Button onClick={exportToDoc} className="h-12 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 gap-3 shadow-xl transition-all hover:scale-[1.02]">
                <Download size={20} />
                <span className="font-black text-[11px] uppercase tracking-widest">Protocol Export</span>
              </Button>
            )}
            {!isViewMode && (
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleUpdateSections} className="h-12 px-8 rounded-2xl border-slate-200 hover:bg-slate-50 gap-3 transition-all">
                  <Save size={20} />
                  <span className="font-black text-[11px] uppercase tracking-widest">Save Sync</span>
                </Button>
                {!selectedProject.isGenerated && (
                  <Button onClick={handleGenerateProject} className="h-12 px-8 rounded-2xl bg-primary text-white hover:bg-primary/90 gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                    <Send size={20} />
                    <span className="font-black text-[11px] uppercase tracking-widest">Deploy Mission</span>
                  </Button>
                )}
              </div>
            )}
            <div className="w-px h-8 bg-slate-200 mx-2" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedProject(null)}
              className="w-12 h-12 rounded-2xl hover:bg-rose-50 hover:text-rose-500 text-muted-foreground group"
            >
              <Plus size={24} className="rotate-45 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="max-w-6xl mx-auto p-12 pb-32">
            {!isViewMode && (
              <div className="mb-12 bg-white p-10 rounded-[3rem] border border-border/40 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl -mr-32 -mt-32 rounded-full group-hover:bg-primary/10 transition-colors" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Progress Score</span>
                      <p className="text-sm font-bold text-slate-400">Overall project health</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black text-primary font-heading tracking-tighter tabular-nums">
                        {Math.round((Object.keys(selectedProject?.sections || {}).length / 17) * 100)}<span className="text-xl opacity-30">%</span>
                      </span>
                    </div>
                  </div>
                  <Progress value={(Object.keys(selectedProject?.sections || {}).length / 17) * 100} className="h-3 rounded-full bg-slate-100" />
                  <div className="flex items-center gap-2 mt-6">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Complete all 17 sections to finish the project plan.</p>
                  </div>
                </div>
              </div>
            )}

            <div className={cn(
              "grid gap-12",
              isViewMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
            )}>
              {PROJECT_SECTIONS_LABELS.map((label, index) => {
                const sectionKeys = [
                  'projectName', 'applicableSection', 'timeline', 'costAndScope', 
                  'location', 'primaryBeneficiaries', 'noOfBeneficiaries', 'background',
                  'objectives', 'baselineAssessment', 'implementationPlan', 'outcome',
                  'monitoringMechanism', 'sustainability', 'impactAssessmentPlan', 
                  'otherInfo', 'benefitsToCompany'
                ];
                const sectionKey = sectionKeys[index] || `section_${index}`;
                const value = selectedProject?.sections?.[sectionKey] || '';
                
                if (isViewMode) {
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white p-12 rounded-[3rem] border border-border/40 shadow-2xl space-y-8 relative overflow-hidden group hover:shadow-primary/5 transition-all"
                    >
                      <div className="absolute top-0 left-0 w-2.5 h-full bg-slate-50 group-hover:bg-primary/20 transition-colors" />
                      <div className="flex items-center justify-between relative px-2">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-sm font-black border border-border/40 group-hover:border-primary/20 group-hover:text-primary transition-all">
                            {index + 1}
                          </div>
                          <div className="h-px w-8 bg-slate-100" />
                          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Module Index</span>
                        </div>
                        {value && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
                            <CheckCircle2 size={14} className="animate-in zoom-in duration-500" />
                            Validated
                          </div>
                        )}
                      </div>
                      <h4 className="text-3xl font-black text-foreground font-heading uppercase tracking-tighter leading-none border-b border-slate-50 pb-8">{label}</h4>
                      <div className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-xl italic pl-2">
                        {value || <span className="text-muted-foreground/30 font-black tracking-widest uppercase text-xs">Node initialization pending...</span>}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div key={index} className={cn(
                    "flex flex-col p-10 rounded-[2.5rem] border transition-all duration-500 bg-white group",
                    value ? "border-emerald-500/20 shadow-emerald-500/5 shadow-2xl" : "border-border/60 shadow-xl hover:border-primary/40"
                  )}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all shadow-lg",
                          value ? "bg-emerald-500 text-white scale-110 rotate-3 shadow-emerald-500/30" : "bg-primary/5 text-primary border border-primary/10 shadow-primary/10"
                        )}>
                          {index + 1}
                        </div>
                        <Label className="text-xl font-black text-foreground font-heading uppercase tracking-tighter">{label}</Label>
                      </div>
                      {value && <CheckCircle2 size={24} className="text-emerald-500" />}
                    </div>
                    
                    <div className="flex-1">
                      {index === 0 ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Registry Display Identity</Label>
                            <Input 
                              value={selectedProject.name} 
                              onChange={(e) => setSelectedProject({
                                ...selectedProject,
                                name: e.target.value
                              })}
                              className="bg-slate-50 border-border/40 focus:bg-white h-14 rounded-2xl text-lg font-black font-heading tracking-tight"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Protocol Header: Project Name</Label>
                            <Input 
                              value={selectedProject?.sections?.projectName || ''} 
                              onChange={(e) => setSelectedProject({
                                ...selectedProject,
                                sections: { ...selectedProject.sections, projectName: e.target.value }
                              })}
                              className="bg-slate-50 border-border/40 focus:bg-white h-14 rounded-2xl text-lg font-medium italic"
                            />
                          </div>
                        </div>
                      ) : index === 1 ? (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Legislative Alignment</Label>
                          <Select 
                            value={selectedProject?.sections?.applicableSection || ''}
                            onValueChange={(val) => setSelectedProject({
                              ...selectedProject,
                              sections: { ...selectedProject.sections, applicableSection: val }
                            })}
                          >
                            <SelectTrigger className="bg-slate-50 border-border/40 focus:bg-white h-14 rounded-2xl text-lg font-medium italic">
                              <SelectValue placeholder="Selection mandatory..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                              {SCHEDULE_VII_SECTIONS.map((sec, i) => (
                                <SelectItem key={i} value={sec} className="rounded-xl py-3 font-medium">{sec}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : index === 6 ? (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Beneficiary Quantum</Label>
                          <div className="relative">
                            <Input 
                              type="number"
                              placeholder="00"
                              value={selectedProject?.sections?.noOfBeneficiaries || ''}
                              onChange={(e) => setSelectedProject({
                                ...selectedProject,
                                sections: { ...selectedProject.sections, noOfBeneficiaries: e.target.value }
                              })}
                              className="bg-slate-50 border-border/40 focus:bg-white h-14 rounded-2xl text-lg font-mono font-black pl-14"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-black text-xs uppercase tracking-widest border-r border-border/60 pr-4">Qty</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Section Details</Label>
                          <Textarea 
                            placeholder={`Enter details for ${label.toLowerCase()}...`}
                            className="min-h-[200px] bg-slate-50 border-border/40 focus:bg-white transition-all rounded-[1.5rem] text-lg leading-relaxed font-medium italic p-6 resize-none shadow-inner"
                            value={value}
                            onChange={(e) => setSelectedProject({
                              ...selectedProject,
                              sections: { ...selectedProject.sections, [sectionKey]: e.target.value }
                            })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 neo-blur">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 backdrop-blur-xl focus:ring-primary/20" 
            placeholder="Search active projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger
            render={
              <Button className="h-12 px-8 rounded-2xl gap-3 font-black text-sm tracking-tight shadow-2xl shadow-primary/20">
                <Plus size={20} />
                ADD NEW PROJECT
              </Button>
            }
          />
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Create New Project</DialogTitle>
              <DialogDescription className="font-medium">
                Enter the project name to start a new project.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Name</Label>
                <Input 
                  id="projectName" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Solar Power for Rural Schools"
                  className="h-12 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Sector</Label>
                <Select value={newProjectSector} onValueChange={setNewProjectSector}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIVELIHOOD">Livelihood</SelectItem>
                    <SelectItem value="SKILL DEVELOPMENT">Skill Development</SelectItem>
                    <SelectItem value="EMPOWERMENT">Empowerment</SelectItem>
                    <SelectItem value="EDUCATION">Education</SelectItem>
                    <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                    <SelectItem value="ENVIRONMENT">Environment</SelectItem>
                    <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                    <SelectItem value="OTHERS">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleAddProject} className="rounded-xl font-black px-8 h-12 shadow-xl shadow-primary/20">Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={project.id}
            >
              <Card className={cn(
                "group relative overflow-hidden transition-all duration-500 border border-border/50 bg-white/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:shadow-primary/5 hover:scale-[1.02]",
                project.isGenerated ? "hover:border-emerald-500/30" : "hover:border-amber-500/30"
              )}>
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                  project.isGenerated ? "bg-emerald-500" : "bg-amber-500"
                )} />
                
                <CardHeader className="pb-4 p-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border-none shadow-sm",
                      project.isGenerated ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", project.isGenerated ? "bg-emerald-500" : "bg-amber-500")} />
                      <span className="font-black text-[9px] uppercase tracking-[0.2em]">{project.isGenerated ? "Mission Deployment" : "Internal Draft"}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-10 h-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      onClick={() => setProjectToDelete(project.id)}
                    >
                      <Plus className="rotate-45" size={20} />
                    </Button>
                  </div>
                  <CardTitle className="text-3xl font-black tracking-tighter leading-[1.1] text-foreground font-heading">
                    {project.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5 px-3 py-1 rounded-lg">
                      {project.sector || 'OTHERS'}
                    </Badge>
                  </div>
                </CardHeader>

            <CardContent className="p-10 pt-0 space-y-10">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-border/50 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Security Monitoring</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">Status Protocol</span>
                </div>
                <Badge className={cn(
                  "font-mono text-[9px] px-3 py-1.5 rounded-lg border-none shadow-sm",
                  project.monitoringStatus === 'SECURE' ? "bg-emerald-500 text-white" :
                  project.monitoringStatus === 'WARNING' ? "bg-amber-500 text-white" :
                  "bg-rose-500 text-white"
                )}>
                  {project.monitoringStatus || 'PENDING'}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all shadow-sm"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsViewMode(false);
                    }}
                  >
                    <FileText size={16} />
                    Edit Details
                  </Button>
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      id={`file-${project.id}`}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => handleFileUpload(e, project.id)}
                    />
                    <Button 
                      variant="secondary"
                      className="w-full h-14 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest bg-slate-100 hover:bg-slate-200 border border-transparent transition-all shadow-sm"
                      onClick={() => document.getElementById(`file-${project.id}`)?.click()}
                    >
                      <Upload size={16} />
                      Attach Doc
                    </Button>
                  </div>
                </div>

                {project.documents && project.documents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Validated Assets</span>
                      <span className="text-[10px] font-bold text-primary">{project.documents.length} Units</span>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                      {project.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-border/40 group/doc hover:bg-white hover:shadow-md transition-all">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/doc:bg-primary group-hover/doc:text-white transition-colors">
                              <FileText size={18} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[11px] font-black truncate text-foreground leading-none mb-1 uppercase tracking-tight">{doc.name}</span>
                              <span className="text-[9px] font-bold text-muted-foreground/60">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="w-10 h-10 rounded-xl text-primary hover:bg-primary/10"
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              <ExternalLink size={16} />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon"
                              className="w-10 h-10 rounded-xl text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveDoc(project.id, i)}
                            >
                              <Plus className="rotate-45" size={18} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {project.isGenerated && (
                  <Button 
                    className="w-full h-16 rounded-[1.5rem] mt-4 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsViewMode(true);
                    }}
                  >
                    Open Project Details
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Eliminated Projects</DialogTitle>
            <DialogDescription>
              Are you sure you want to eliminate this project? It will be moved to the Eliminated Projects section (Recycle Bin) where it can be restored or permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject}>Eliminate Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
