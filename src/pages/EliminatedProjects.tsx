import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Search, RotateCcw, Trash2, AlertCircle, CheckSquare, Square, Trash, RefreshCw } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function EliminatedProjects() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [projectToRestore, setProjectToRestore] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isBulkRestoreOpen, setIsBulkRestoreOpen] = React.useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);

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
      setSelectedIds(prev => prev.filter(id => id !== projectToDelete));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectToDelete}`);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      const ref = doc(db, 'projects', id);
      batch.update(ref, {
        isEliminated: false,
        restoredAt: Date.now(),
        updatedAt: Date.now()
      });
    });

    try {
      await batch.commit();
      toast.success(`${selectedIds.length} projects restored successfully!`);
      setSelectedIds([]);
      setIsBulkRestoreOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'bulk-restore');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      const ref = doc(db, 'projects', id);
      batch.delete(ref);
    });

    try {
      await batch.commit();
      toast.success(`${selectedIds.length} projects permanently deleted`);
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'bulk-delete');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProjects.map(p => p.id));
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12">Loading eliminated projects...</div>;
  }

  return (
    <div className="space-y-12 neo-blur">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <Badge className="bg-rose-500/10 text-rose-500 border-none text-[9px] font-black tracking-[0.2em] px-3 py-1 uppercase mb-2 animate-pulse">Deleted Projects</Badge>
          <h2 className="text-5xl font-black tracking-tighter text-foreground font-heading uppercase leading-none">RECYCLE BIN</h2>
          <p className="text-lg text-muted-foreground font-medium italic">"Review projects here before they are permanently removed."</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-12 h-14 rounded-2xl bg-white border-border/50 shadow-xl focus:ring-primary/20 font-medium" 
              placeholder="Locate eliminated mission..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredProjects.length > 0 && (
            <Button 
              variant="outline" 
              className={cn(
                "h-14 px-6 rounded-2xl border-border/50 transition-all font-black text-[10px] uppercase tracking-widest gap-2",
                selectedIds.length === filteredProjects.length ? "bg-primary text-primary-foreground border-primary" : "bg-white shadow-xl hover:bg-slate-50"
              )}
              onClick={toggleSelectAll}
            >
              {selectedIds.length === filteredProjects.length ? <CheckSquare size={18} /> : <Square size={18} />}
              {selectedIds.length === filteredProjects.length ? "Deselect All" : "Select All Nodes"}
            </Button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white/50 backdrop-blur-xl rounded-[4rem] border border-dashed border-border/60">
          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
            <Trash2 size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-tighter font-heading uppercase">Protocol Archive Clear</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">No eliminated missions detected in the registry. System integrity optimal.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={project.id}
              >
                <Card 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-500 border bg-white rounded-[3rem] shadow-xl hover:shadow-2xl cursor-pointer",
                    selectedIds.includes(project.id) ? "border-primary ring-4 ring-primary/10" : "border-border/40"
                  )}
                  onClick={() => toggleSelection(project.id)}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-6 right-6 z-10">
                    <div className={cn(
                      "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm",
                      selectedIds.includes(project.id) ? "bg-primary border-primary text-white" : "bg-slate-50 border-border/60"
                    )}>
                      {selectedIds.includes(project.id) && <CheckSquare size={18} />}
                    </div>
                  </div>

                  <CardHeader className="pb-4 p-10">
                    <div className="flex justify-between items-start mb-6">
                      <Badge className="font-black text-[9px] tracking-[0.2em] px-3 py-1.5 rounded-lg border-none bg-rose-500/10 text-rose-600 uppercase">
                        Archive Locked
                      </Badge>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-md">
                        {project.eliminatedAt ? new Date(project.eliminatedAt).toLocaleDateString() : 'ELM:UNK'}
                      </span>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tighter leading-[1.1] text-foreground font-heading uppercase group-hover:text-rose-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-4">
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Registry ID</span>
                      <div className="h-px w-8 bg-slate-100" />
                      <span className="font-mono text-[11px] font-bold text-slate-400">{project.id.slice(0, 12)}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-10 pt-0 space-y-10">
                    <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-500/10 shadow-inner group-hover:bg-rose-50 transition-colors">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 leading-none">Security Flag</p>
                      <p className="text-[11px] font-bold italic text-rose-900/60 leading-relaxed">Mission status terminated. Review required before terminal deletion protocol initiate.</p>
                    </div>
                    
                    <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-14 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest border-border/60 hover:bg-emerald-50 hover:border-emerald-500/40 hover:text-emerald-600 transition-all shadow-sm"
                        onClick={() => setProjectToRestore(project.id)}
                      >
                        <RotateCcw size={18} />
                        Restore Node
                      </Button>
                      <Button 
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl gap-2 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        onClick={() => setProjectToDelete(project.id)}
                      >
                        <Trash2 size={18} />
                        Purge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
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

      {/* Bulk Restore Dialog */}
      <Dialog open={isBulkRestoreOpen} onOpenChange={setIsBulkRestoreOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Restore</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore {selectedIds.length} selected projects? They will be moved back to the active Projects list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBulkRestoreOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleBulkRestore}>Restore {selectedIds.length} Projects</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Bulk Permanent Deletion</DialogTitle>
            <DialogDescription>
              WARNING: This will permanently delete {selectedIds.length} selected projects. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete {selectedIds.length} Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
              <div className="bg-slate-900/90 text-white rounded-[2.5rem] p-5 shadow-2xl border border-white/10 flex items-center justify-between gap-8 backdrop-blur-2xl">
                <div className="flex items-center gap-6 pl-6">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
                    {selectedIds.length}
                  </div>
                  <div>
                    <p className="font-black text-base tracking-tighter uppercase font-heading">Nodes Selected</p>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Bulk Protocol Active</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pr-2">
                  <Button 
                    variant="ghost" 
                    className="text-white/60 hover:text-white hover:bg-white/10 gap-2 font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl px-6"
                    onClick={() => setSelectedIds([])}
                  >
                    Deselect
                  </Button>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 gap-3 font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl px-8 shadow-xl shadow-emerald-500/20"
                    onClick={() => setIsBulkRestoreOpen(true)}
                  >
                    <RefreshCw size={18} />
                    Restore All
                  </Button>
                  <Button 
                    variant="destructive"
                    className="gap-3 font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl px-8 shadow-xl shadow-rose-500/20"
                    onClick={() => setIsBulkDeleteOpen(true)}
                  >
                    <Trash size={18} />
                    Purge All
                  </Button>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
