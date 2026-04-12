import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Check, X, Clock, ShieldCheck } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

export default function ProjectApproval() {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
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
      await updateDoc(doc(db, 'projects', projectId), {
        approvalStatus: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Project ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading approval list...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {projects.length > 0 ? projects.map((project) => (
          <Card key={project.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                    project.approvalStatus === 'APPROVED' ? "bg-green-100 text-green-600" :
                    project.approvalStatus === 'REJECTED' ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-600"
                  )}>
                    {project.approvalStatus === 'APPROVED' ? <ShieldCheck size={24} /> :
                     project.approvalStatus === 'REJECTED' ? <X size={24} /> :
                     <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={project.approvalStatus === 'APPROVED' ? 'default' : 'outline'}
                    className={cn(
                      "gap-2 h-10 px-4 transition-all",
                      project.approvalStatus === 'APPROVED' ? "bg-green-600 hover:bg-green-700" : "hover:border-green-500 hover:text-green-600"
                    )}
                    onClick={() => handleStatusUpdate(project.id, 'APPROVED')}
                  >
                    <Check size={18} />
                    {project.approvalStatus === 'APPROVED' ? 'Approved' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant={project.approvalStatus === 'REJECTED' ? 'destructive' : 'outline'}
                    className={cn(
                      "gap-2 h-10 px-4 transition-all",
                      project.approvalStatus === 'REJECTED' ? "" : "hover:border-red-500 hover:text-red-600"
                    )}
                    onClick={() => handleStatusUpdate(project.id, 'REJECTED')}
                  >
                    <X size={18} />
                    {project.approvalStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No projects found for approval.</p>
          </div>
        )}
      </div>
    </div>
  );
}
