import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Plus, Search, ChevronRight, CheckCircle2, Upload, FileText, Eye } from 'lucide-react';
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
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isViewMode, setIsViewMode] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<{ url: string, name: string } | null>(null);

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

  const handleRemoveDoc = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        documentUrl: null,
        documentName: null,
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

    // In a real app, we would upload to Firebase Storage
    // For this demo, we'll simulate the upload and store a mock URL
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Uploading ${file.name}...`,
        success: async () => {
          const mockUrl = URL.createObjectURL(file);
          await updateDoc(doc(db, 'projects', projectId), {
            documentUrl: mockUrl,
            documentName: file.name,
            updatedAt: Date.now()
          });
          return "Document uploaded successfully!";
        },
        error: "Upload failed",
      }
    );
  };

  React.useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
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
      await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        status: 'PENDING',
        isGenerated: false,
        monitoringStatus: 'WARNING',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: auth.currentUser?.uid,
        sections: {
          projectName: newProjectName
        }
      });
      setNewProjectName('');
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
      await deleteDoc(doc(db, 'projects', projectToDelete));
      toast.success("Project deleted successfully");
      setProjectToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectToDelete}`);
    }
  };

  const handleUpdateSections = async () => {
    if (!selectedProject) return;
    
    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        sections: selectedProject.sections,
        updatedAt: Date.now()
      });
      toast.success("Project sections saved!");
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
        status: 'ACTIVE',
        updatedAt: Date.now()
      });
      toast.success("Project Generated Successfully! It is now active.");
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
        className="fixed inset-0 z-50 bg-slate-50 flex flex-col"
      >
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedProject(null)}
              className="rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedProject.name}</h2>
              <p className="text-xs text-slate-500">
                {isViewMode ? "Full project details and impact assessment" : "Complete all 17 sections as per CSR guidelines."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isViewMode && (
              <Button onClick={exportToDoc} className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-md">
                <Download size={18} />
                Convert to MS DOC
              </Button>
            )}
            {!isViewMode && (
              <>
                <Button variant="outline" onClick={handleUpdateSections} className="gap-2">
                  <Save size={18} />
                  Save Draft
                </Button>
                {!selectedProject.isGenerated && (
                  <Button onClick={handleGenerateProject} className="bg-green-600 hover:bg-green-700 gap-2 shadow-md">
                    <Send size={18} />
                    Generate Project
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" onClick={() => setSelectedProject(null)}>Close</Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            {!isViewMode && (
              <div className="mb-10 bg-white p-6 rounded-2xl border shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Form Completion Progress</span>
                  <span className="text-lg font-bold text-primary">{Math.round((Object.keys(selectedProject?.sections || {}).length / 17) * 100)}%</span>
                </div>
                <Progress value={(Object.keys(selectedProject?.sections || {}).length / 17) * 100} className="h-3 rounded-full" />
                <p className="text-xs text-slate-400 mt-3">All 17 sections must be completed to generate the final project report.</p>
              </div>
            )}

            <div className={cn(
              "grid gap-8 pb-20",
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
                    <div key={index} className="bg-white p-10 rounded-3xl border shadow-sm space-y-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-primary/60 font-mono text-sm uppercase tracking-widest">
                          <span className="bg-primary/5 px-3 py-1 rounded-full">Section {index + 1}</span>
                        </div>
                        {value && <CheckCircle2 size={20} className="text-green-500" />}
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-4">{label}</h4>
                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap pt-2 text-lg">
                        {value || <span className="italic text-muted-foreground">No data provided for this section.</span>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className={cn(
                    "space-y-4 p-8 rounded-2xl border bg-white shadow-sm transition-all duration-300",
                    value ? "border-green-200 bg-green-50/5" : "hover:border-primary/40 hover:shadow-md"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                          value ? "bg-green-500 text-white rotate-3 shadow-green-200 shadow-lg" : "bg-primary/10 text-primary"
                        )}>
                          {index + 1}
                        </div>
                        <Label className="text-lg font-bold text-slate-800">{label}</Label>
                      </div>
                      {value && <CheckCircle2 size={20} className="text-green-500" />}
                    </div>
                    
                    {index === 0 ? (
                      <Input 
                        value={selectedProject?.sections?.projectName || ''} 
                        onChange={(e) => setSelectedProject({
                          ...selectedProject,
                          sections: { ...selectedProject.sections, projectName: e.target.value }
                        })}
                        className="bg-slate-50 border-slate-200 focus:bg-white h-12 text-base"
                      />
                    ) : index === 1 ? (
                      <Select 
                        value={selectedProject?.sections?.applicableSection || ''}
                        onValueChange={(val) => setSelectedProject({
                          ...selectedProject,
                          sections: { ...selectedProject.sections, applicableSection: val }
                        })}
                      >
                        <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white h-12 text-base">
                          <SelectValue placeholder="Select Schedule VII Section" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHEDULE_VII_SECTIONS.map((sec, i) => (
                            <SelectItem key={i} value={sec}>{sec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : index === 6 ? (
                      <Input 
                        type="number"
                        placeholder="Enter number of beneficiaries..."
                        value={selectedProject?.sections?.noOfBeneficiaries || ''}
                        onChange={(e) => setSelectedProject({
                          ...selectedProject,
                          sections: { ...selectedProject.sections, noOfBeneficiaries: e.target.value }
                        })}
                        className="bg-slate-50 border-slate-200 focus:bg-white h-12 text-base"
                      />
                    ) : (
                      <Textarea 
                        placeholder={`Enter details for ${label.toLowerCase()}...`}
                        className="min-h-[160px] bg-slate-50 border-slate-200 focus:bg-white transition-all text-base leading-relaxed"
                        value={value}
                        onChange={(e) => setSelectedProject({
                          ...selectedProject,
                          sections: { ...selectedProject.sections, [sectionKey]: e.target.value }
                        })}
                      />
                    )}
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
                INITIATE PROJECT
              </Button>
            }
          />
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Create New Project</DialogTitle>
              <DialogDescription className="font-medium">
                Enter the project name to initialize a new CSR project mission.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Label htmlFor="projectName" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Mission Name</Label>
              <Input 
                id="projectName" 
                value={newProjectName} 
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Solar Power for Rural Schools"
                className="mt-3 h-12 rounded-xl bg-muted/50 border-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleAddProject} className="rounded-xl font-black px-8 h-12 shadow-xl shadow-primary/20">Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <Card key={project.id} className={cn(
            "group relative overflow-hidden transition-all duration-500 border border-border/50 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-primary/10 hover:scale-[1.02]",
            project.isGenerated ? "hover:border-green-500/30" : "hover:border-yellow-500/30"
          )}>
            <div className={cn(
              "absolute top-0 left-0 w-full h-1.5 opacity-50",
              project.isGenerated ? "bg-green-500" : "bg-yellow-500"
            )} />
            
            <CardHeader className="pb-4 p-8">
              <div className="flex justify-between items-start mb-4">
                <Badge className={cn(
                  "font-mono text-[10px] tracking-widest px-3 py-1 rounded-full border-none",
                  project.isGenerated ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {project.isGenerated ? "MISSION ACTIVE" : "DRAFT MODE"}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setProjectToDelete(project.id)}
                >
                  <Plus className="rotate-45" size={18} />
                </Button>
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-primary transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono uppercase tracking-widest mt-2">
                ID: {project.id.slice(0, 8)}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Monitoring</span>
                <Badge className={cn(
                  "font-mono text-[10px] px-3 py-1 rounded-full border-none",
                  project.monitoringStatus === 'SECURE' ? "bg-green-500/10 text-green-500" :
                  project.monitoringStatus === 'WARNING' ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-red-500/10 text-red-500"
                )}>
                  {project.monitoringStatus || 'PENDING'}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl gap-2 font-bold text-xs border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsViewMode(false);
                    }}
                  >
                    <FileText size={16} />
                    EDIT SECTIONS
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
                      className="w-full h-12 rounded-xl gap-2 font-bold text-xs bg-muted/50 hover:bg-muted border border-border/50 transition-all"
                      onClick={() => document.getElementById(`file-${project.id}`)?.click()}
                    >
                      <Upload size={16} />
                      UPLOAD DOC
                    </Button>
                  </div>
                </div>

                {project.documentUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText size={16} />
                        </div>
                        <span className="text-xs font-bold truncate text-foreground">{project.documentName || 'Project Document'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full text-primary hover:bg-primary/10"
                          onClick={() => setPreviewDoc({ url: project.documentUrl, name: project.documentName })}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveDoc(project.id)}
                        >
                          <Plus className="rotate-45" size={14} />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      className="w-full h-12 rounded-xl gap-2 text-primary font-black text-xs hover:bg-primary/5 transition-all"
                      onClick={() => setPreviewDoc({ url: project.documentUrl, name: project.documentName })}
                    >
                      <Eye size={16} />
                      IN-APP PREVIEW
                    </Button>
                  </div>
                )}

                {project.isGenerated && (
                  <Button 
                    className="w-full h-14 rounded-2xl mt-2 font-black text-sm tracking-tight shadow-xl shadow-primary/10"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsViewMode(true);
                    }}
                  >
                    VIEW MISSION DETAILS
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and all associated reports will be orphaned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="p-6 bg-card border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight">{previewDoc?.name}</DialogTitle>
                  <DialogDescription className="text-xs font-mono uppercase tracking-widest">Document Preview Mode</DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(previewDoc?.url, '_blank')} className="rounded-xl">
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-muted/30 relative">
            {previewDoc?.url ? (
              <iframe 
                src={previewDoc.url} 
                className="w-full h-full border-none"
                title="Document Preview"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium">
                Loading preview...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
