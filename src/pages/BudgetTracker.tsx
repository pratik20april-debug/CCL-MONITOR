import React from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDocs, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { Plus, Eye, DollarSign, Wallet, TrendingUp, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function BudgetTracker() {
  const [activeProjects, setActiveProjects] = React.useState<any[]>([]);
  const [budgetRecords, setBudgetRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = React.useState('');
  const [allocatedFund, setAllocatedFund] = React.useState('');
  const [expenditure, setExpenditure] = React.useState('');

  React.useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Active Projects
    const projectsQuery = query(collection(db, 'projects'), where('status', 'in', ['ACTIVE', 'ONGOING']));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      setActiveProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Budget Records
    const budgetQuery = query(collection(db, 'budget_tracking'));
    const unsubscribeBudget = onSnapshot(budgetQuery, (snapshot) => {
      setBudgetRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'budget_tracking');
    });

    return () => {
      unsubscribeProjects();
      unsubscribeBudget();
    };
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !allocatedFund || !expenditure) {
      toast.error("Please fill all fields");
      return;
    }

    const project = activeProjects.find(p => p.id === selectedProjectId);
    if (!project) return;

    try {
      await addDoc(collection(db, 'budget_tracking'), {
        projectId: selectedProjectId,
        projectName: project.name,
        allocatedFund: parseFloat(allocatedFund),
        expenditure: parseFloat(expenditure),
        lastUpdated: Date.now()
      });
      
      toast.success("Budget record generated successfully");
      setIsCreateOpen(false);
      setSelectedProjectId('');
      setAllocatedFund('');
      setExpenditure('');
    } catch (error) {
      handleFirestoreError(error as any, OperationType.CREATE, 'budget_tracking');
    }
  };

  const totalAllocated = budgetRecords.reduce((acc, curr) => acc + curr.allocatedFund, 0);
  const totalSpent = budgetRecords.reduce((acc, curr) => acc + curr.expenditure, 0);
  const utilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none text-xs font-black tracking-[0.2em] px-2 py-0.5 uppercase mb-2">Money Management</Badge>
          <h2 className="text-5xl font-black tracking-tighter text-foreground font-heading uppercase leading-none">PROJECT BUDGETS</h2>
          <p className="text-lg text-muted-foreground font-medium italic">Track project budget and spending easily.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button className="h-14 px-10 rounded-[1.5rem] bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-widest gap-3 shadow-2xl transition-all hover:scale-[1.05]">
              <Plus size={20} className="text-primary" />
              Initialize Allotment
            </Button>
          } />
          <DialogContent className="sm:max-w-[550px] border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden bg-white">
            <div className="bg-slate-900 p-10 text-white">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tighter font-heading uppercase leading-none">NEW BUDGET RECORD</DialogTitle>
                <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Fund Allocation</p>
              </DialogHeader>
            </div>
            <form onSubmit={handleCreateRecord} className="p-10 space-y-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Mission Node</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-slate-50 border-border/40 h-14 rounded-2xl focus:ring-4 ring-primary/10 text-lg font-bold font-heading">
                    <SelectValue placeholder="Identify active mission..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] p-2">
                    {activeProjects.map(p => (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl py-4 font-bold tracking-tight">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Sanctioned Fund (₹)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={allocatedFund}
                      onChange={(e) => setAllocatedFund(e.target.value)}
                      className="bg-slate-50 border-border/40 h-14 rounded-2xl pl-12 focus:ring-4 ring-primary/10 text-xl font-mono font-black"
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Utilized Capital (₹)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={expenditure}
                      onChange={(e) => setExpenditure(e.target.value)}
                      className="bg-slate-50 border-border/40 h-14 rounded-2xl pl-12 focus:ring-4 ring-orange-500/10 text-xl font-mono font-black text-orange-600"
                    />
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full h-16 rounded-[1.5rem] font-black tracking-[0.2em] text-xs uppercase shadow-2xl shadow-primary/20 bg-primary text-white hover:bg-primary/90 transition-all hover:scale-[1.02]">
                  COMMENCE ALLOTMENT
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          <CardContent className="p-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-900 border border-white/10 flex items-center justify-center text-primary shadow-xl">
              <DollarSign size={36} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-1">AGGREGATE Allotment</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter font-heading">₹{(totalAllocated / 10000000).toFixed(2)}</span>
                <span className="text-lg font-black text-primary uppercase">Cr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
          <CardContent className="p-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-orange-500 border border-white/10 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
              <Wallet size={36} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-1">TOTAL EXPENDITURE</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter font-heading">₹{(totalSpent / 10000000).toFixed(2)}</span>
                <span className="text-lg font-black text-orange-500 uppercase">Cr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
          <CardContent className="p-10 flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 border border-white/10 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <TrendingUp size={36} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-1">SYSTEM UTILIZATION</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter font-heading">{utilization.toFixed(1)}</span>
                <span className="text-xl font-black text-emerald-500 uppercase">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[3.5rem] overflow-hidden">
        <CardHeader className="p-10 px-12 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter font-heading uppercase leading-none">MISSION LEDGER</CardTitle>
            <p className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">Granular Financial Deployment Tracking</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input placeholder="Locate voucher..." className="pl-12 h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-sm font-bold placeholder:text-slate-300" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="py-8 px-12 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Mission Node</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sanctioned Allotment</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Current Burn</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Efficacy Rate</TableHead>
                  <TableHead className="text-right px-12 text-xs font-black uppercase tracking-[0.3em] text-slate-400">Terminal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Synchronizing Data Nodes...</TableCell>
                  </TableRow>
                ) : budgetRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center">
                      <div className="space-y-4">
                        <p className="text-slate-300 font-black uppercase tracking-widest">No Allotments Recorded</p>
                        <Button variant="outline" className="rounded-xl border-dashed">Initiate Ledger</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  budgetRecords.map((record) => {
                    const rate = (record.expenditure / record.allocatedFund) * 100;
                    return (
                      <TableRow key={record.id} className="group hover:bg-slate-50/80 transition-all duration-300 border-slate-50">
                        <TableCell className="py-8 px-12">
                          <div className="flex flex-col gap-1">
                            <p className="font-black text-slate-900 leading-none text-lg uppercase tracking-tight group-hover:text-primary transition-colors">{record.projectName}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors" />
                              <p className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest">{record.id.slice(0, 16)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-300 font-black uppercase mb-1">Sanctioned</span>
                            <span className="font-black text-slate-900 text-lg tabular-nums tracking-tighter">₹{record.allocatedFund.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-300 font-black uppercase mb-1">Expended</span>
                            <span className="font-black text-orange-600 text-lg tabular-nums tracking-tighter">₹{record.expenditure.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-12">
                              <span className="text-xs text-slate-400 font-black tracking-widest uppercase">Flux</span>
                              <span className={cn(
                                "text-sm font-black tabular-nums font-heading",
                                rate > 90 ? "text-rose-500" : rate > 50 ? "text-primary" : "text-emerald-500"
                              )}>{rate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full max-w-[160px] bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(rate, 100)}%` }}
                                className={cn(
                                  "h-full rounded-full shadow-sm transition-all",
                                  rate > 90 ? "bg-rose-500" : rate > 50 ? "bg-primary" : "bg-emerald-500"
                                )}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-12">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm border border-border/20"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye size={20} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[750px] border-none shadow-2xl rounded-[4rem] p-0 overflow-hidden bg-white">
          {selectedRecord && (
            <div className="flex flex-col">
              <div className="bg-slate-900 p-16 text-white space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl -mr-32 -mt-32 rounded-full" />
                <div className="relative space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 font-black text-xs uppercase tracking-[0.3em]">Fiscal Document</Badge>
                    <p className="text-white/40 font-mono text-[11px] font-bold uppercase tracking-widest">{new Date(selectedRecord.lastUpdated).toLocaleString()}</p>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter leading-none font-heading uppercase">{selectedRecord.projectName}</h2>
                  <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-black text-[11px] uppercase tracking-widest">Active Allotment</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-16 space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-10 rounded-[2.5rem] shadow-inner border border-slate-100">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Sanctioned Capital</p>
                    <p className="text-4xl font-black text-slate-900 font-heading tracking-tighter leading-none">₹{selectedRecord.allocatedFund.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-50/50 p-10 rounded-[2.5rem] shadow-inner border border-orange-500/10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600 mb-3">Burn Expenditure</p>
                    <p className="text-4xl font-black text-orange-600 font-heading tracking-tighter leading-none">₹{selectedRecord.expenditure.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 leading-none">Mission Consumption</p>
                      <p className="text-sm font-bold text-slate-400">Total fund utilization percentage</p>
                    </div>
                    <p className="text-4xl font-black text-primary font-heading tracking-tighter uppercase leading-none">
                      {((selectedRecord.expenditure / selectedRecord.allocatedFund) * 100).toFixed(1)}<span className="text-lg opacity-30">%</span>
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden p-1.5 shadow-inner border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedRecord.expenditure / selectedRecord.allocatedFund) * 100}%` }}
                      className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 relative"
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mb-24 blur-3xl group-hover:bg-primary/20 transition-colors" />
                  <div className="relative space-y-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={20} className="text-primary" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Impact Intelligence Summary</h4>
                    </div>
                    <p className="text-white/60 text-lg leading-relaxed font-medium italic">
                      The mission "{selectedRecord.projectName}" has successfully deployed ₹{selectedRecord.expenditure.toLocaleString()} from the initial sanctioned allotment of ₹{selectedRecord.allocatedFund.toLocaleString()}. 
                      Current system liquidity supports further operations with a residual balance of ₹{(selectedRecord.allocatedFund - selectedRecord.expenditure).toLocaleString()}.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <Button 
                    variant="ghost" 
                    className="rounded-2xl font-black text-xs uppercase tracking-[0.3em] h-14 px-12 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200" 
                    onClick={() => setIsViewOpen(false)}
                  >
                    Close Protocol Node
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MapPin = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    stroke="none"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);
