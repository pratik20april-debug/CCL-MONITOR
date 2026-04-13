import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Search, CheckCircle2, FileText, Eye, Download } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
} from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { PROJECT_SECTIONS_LABELS } from '@/src/constants';

export default function CompletedProjects() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [previewDoc, setPreviewDoc] = React.useState<{ url: string, name: string } | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'projects'), 
      where('status', '==', 'COMPLETED'),
      where('isEliminated', '==', false),
      orderBy('updatedAt', 'desc')
    );
    
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

  const exportToDoc = async (project: any) => {
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
            text: "COMPLETED CSR PROJECT REPORT",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Project Name: ${project.name}`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
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
            const value = project?.sections?.[sectionKey] || 'Not Provided';

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
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${project.name.replace(/\s+/g, '_')}_Final_Report.docx`);
    });
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12">Loading completed projects...</div>;
  }

  return (
    <div className="space-y-8 neo-blur">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 backdrop-blur-xl focus:ring-primary/20" 
            placeholder="Search completed projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl">
          <CheckCircle2 className="text-green-500" size={20} />
          <span className="text-sm font-black text-green-600 uppercase tracking-widest">{projects.length} Projects Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="group relative overflow-hidden transition-all duration-500 border border-border/50 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-green-500/10 hover:scale-[1.02] border-green-500/20">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500 opacity-50" />
            
            <CardHeader className="pb-4 p-8">
              <div className="flex justify-between items-start mb-4">
                <Badge className="font-mono text-[10px] tracking-widest px-3 py-1 rounded-full border-none bg-green-500/10 text-green-500">
                  COMPLETED MISSION
                </Badge>
                <CheckCircle2 className="text-green-500" size={20} />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-green-600 transition-colors">
                {project.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono uppercase tracking-widest mt-2">
                ID: {project.id.slice(0, 8)}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-6">
              <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Completion Date</span>
                  <span className="text-green-600">{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Monitoring Status</span>
                  <span className="text-green-600">FINALIZED</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl gap-2 font-bold text-xs border-green-200 hover:bg-green-50 hover:border-green-300 transition-all"
                  onClick={() => exportToDoc(project)}
                >
                  <Download size={16} />
                  DOWNLOAD FINAL REPORT
                </Button>

                {project.documentUrl && (
                  <Button 
                    variant="secondary"
                    className="w-full h-12 rounded-xl gap-2 font-bold text-xs bg-muted/50 hover:bg-muted border border-border/50 transition-all"
                    onClick={() => setPreviewDoc({ url: project.documentUrl, name: project.documentName })}
                  >
                    <Eye size={16} />
                    VIEW ATTACHED DOCS
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="p-6 bg-card border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                  <FileText size={20} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight">{previewDoc?.name}</DialogTitle>
                  <DialogDescription className="text-xs font-mono uppercase tracking-widest">Completed Project Archive</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-muted/30 relative">
            <iframe 
              src={previewDoc?.url} 
              className="w-full h-full border-none"
              title="Document Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
