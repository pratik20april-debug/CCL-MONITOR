import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Search, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, deleteDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function EliminatedProjects() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [projectToRestore, setProjectToRestore] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Only show eliminated projects
      setProjects(projectsData.filter((p: any) => p.isEliminated));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  const handleRestoreProject = async () => {
    if (!projectToRestore) return;
    
    try {
      await updateDoc(doc(db, 'projects', projectToRestore), {
        isEliminated: false,
        restoredAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success("Project restored successfully!");
      setProjectToRestore(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectToRestore}`);
    }
  };

  const handlePermanentDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete));
      toast.success("Project permanently deleted");
      setProjectToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectToDelete}`);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12">Loading eliminated projects...</div>;
  }

  return (
    <div className="space-y-8 neo-blur">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 backdrop-blur-xl focus:ring-primary/20" 
            placeholder="Search eliminated projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
          <AlertCircle size={18} className="text-yellow-600" />
          <span className="text-xs font-black text-yellow-700 uppercase tracking-widest">Recycle Bin Mode</span>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
            <Trash2 size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tight">Recycle Bin is Empty</h3>
            <p className="text-muted-foreground font-medium">Eliminated projects will appear here for 30 days before automatic cleanup.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group relative overflow-hidden transition-all duration-500 border border-border/50 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-destructive/10">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive/50 opacity-50" />
              
              <CardHeader className="pb-4 p-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="font-mono text-[10px] tracking-widest px-3 py-1 rounded-full border-none bg-destructive/10 text-destructive">
                    ELIMINATED
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {project.eliminatedAt ? new Date(project.eliminatedAt).toLocaleDateString() : 'Unknown Date'}
                  </span>
                </div>
                <CardTitle className="text-2xl font-black tracking-tighter leading-tight group-hover:text-destructive transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-xs font-mono uppercase tracking-widest mt-2">
                  ID: {project.id.slice(0, 8)}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-6">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Elimination Reason</p>
                  <p className="text-sm font-medium italic text-foreground/70">Project moved to recycle bin for review or deletion.</p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl gap-2 font-bold text-xs border-border/50 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-600 transition-all"
                    onClick={() => setProjectToRestore(project.id)}
                  >
                    <RotateCcw size={16} />
                    RESTORE
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 h-12 rounded-xl gap-2 font-bold text-xs shadow-xl shadow-destructive/20"
                    onClick={() => setProjectToDelete(project.id)}
                  >
                    <Trash2 size={16} />
                    DELETE FOREVER
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!projectToRestore} onOpenChange={() => setProjectToRestore(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this project? It will be moved back to the active Projects list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectToRestore(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleRestoreProject}>Restore Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanent Deletion</DialogTitle>
            <DialogDescription>
              WARNING: This action is permanent and cannot be undone. All project data and associated reports will be permanently removed from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProjectToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handlePermanentDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
