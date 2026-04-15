import React from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, PlayCircle, Search } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';

export default function ProjectStatus() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'projects'), 
      where('isEliminated', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (projectId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: Date.now()
      };
      
      // If completed, ensure it's marked as generated too
      if (newStatus === 'COMPLETED') {
        updateData.isGenerated = true;
      }

      await updateDoc(doc(db, 'projects', projectId), updateData);
      toast.success(`Project status updated to ${newStatus.toLowerCase()}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12">Loading project status list...</div>;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'bg-green-500', icon: CheckCircle2, label: 'Complete', bg: 'bg-green-50', text: 'text-green-600' };
      case 'ONGOING':
      case 'ACTIVE':
        return { color: 'bg-blue-500', icon: PlayCircle, label: 'Ongoing', bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'DELAYED':
        return { color: 'bg-red-500', icon: AlertCircle, label: 'Delayed', bg: 'bg-red-50', text: 'text-red-600' };
      case 'INCOMPLETE':
      case 'PENDING':
      default:
        return { color: 'bg-slate-400', icon: Clock, label: 'Incomplete', bg: 'bg-slate-50', text: 'text-slate-600' };
    }
  };

  const isStatusActive = (projectStatus: string, buttonId: string) => {
    if (projectStatus === buttonId) return true;
    if (buttonId === 'ONGOING' && projectStatus === 'ACTIVE') return true;
    if (buttonId === 'INCOMPLETE' && projectStatus === 'PENDING') return true;
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-12 h-12 rounded-2xl bg-card/50 border-border/50 backdrop-blur-xl focus:ring-primary/20" 
            placeholder="Search projects by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => {
          const config = getStatusConfig(project.status);
          return (
            <Card key={project.id} className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-xl rounded-[2rem] shadow-2xl hover:shadow-primary/5 transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row items-center justify-between p-8 gap-8">
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner shrink-0",
                      config.bg, config.text
                    )}>
                      <config.icon size={32} />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-xl font-black text-slate-900 truncate">{project.name}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("font-mono text-[10px] tracking-widest px-3 py-1 rounded-full border-none", config.color, "text-white")}>
                          {config.label.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-tighter">
                          ID: {project.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Last Update: {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                    {[
                      { id: 'INCOMPLETE', label: 'Incomplete', color: 'bg-slate-100 hover:bg-slate-200 text-slate-600', active: 'bg-slate-500 text-white' },
                      { id: 'ONGOING', label: 'Ongoing', color: 'bg-blue-100 hover:bg-blue-200 text-blue-600', active: 'bg-blue-500 text-white' },
                      { id: 'DELAYED', label: 'Delayed', color: 'bg-red-100 hover:bg-red-200 text-red-600', active: 'bg-red-500 text-white' },
                      { id: 'COMPLETED', label: 'Complete', color: 'bg-green-100 hover:bg-green-200 text-green-600', active: 'bg-green-500 text-white' }
                    ].map((opt) => (
                      <Button
                        key={opt.id}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                          isStatusActive(project.status, opt.id) ? opt.active : opt.color
                        )}
                        onClick={() => handleStatusUpdate(project.id, opt.id)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="text-center py-32 bg-card/30 rounded-[3rem] border-4 border-dashed border-border/50">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
