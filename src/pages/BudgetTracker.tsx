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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">CSR BUDGET TRACKER</h2>
          <p className="text-muted-foreground font-medium">Monitor project allotments and financial utilization</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={<Button className="rounded-2xl font-black gap-2 shadow-xl hover:shadow-primary/20 transition-all px-6 h-12" />}>
              <Plus size={20} />
              CREATE LIST
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black tracking-tighter">Generate Budget Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRecord} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="bg-slate-50 border-none h-12 rounded-2xl focus:ring-2 ring-primary/20">
                    <SelectValue placeholder="Identify active project..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {activeProjects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Allocated Fund (₹)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Enter sanctioned amount..."
                  value={allocatedFund}
                  onChange={(e) => setAllocatedFund(e.target.value)}
                  className="bg-slate-50 border-none h-12 rounded-2xl focus:ring-2 ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Expenditure (₹)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="Enter amount spent..."
                  value={expenditure}
                  onChange={(e) => setExpenditure(e.target.value)}
                  className="bg-slate-50 border-none h-12 rounded-2xl focus:ring-2 ring-primary/20"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 rounded-2xl font-black tracking-tight text-lg shadow-lg">
                  GENERATE RECORD
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-primary/5 rounded-[2.5rem]">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center text-white">
              <DollarSign size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Total Allotted</p>
              <p className="text-3xl font-black tracking-tighter">₹{(totalAllocated / 10000000).toFixed(2)} Cr</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-orange-500/5 rounded-[2.5rem]">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-white">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60">Total Spent</p>
              <p className="text-3xl font-black tracking-tighter">₹{(totalSpent / 10000000).toFixed(2)} Cr</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-green-500/5 rounded-[2.5rem]">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-green-500 flex items-center justify-center text-white">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60">Utilization</p>
              <p className="text-3xl font-black tracking-tighter">{utilization.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black tracking-tighter">Budget Utilization List</CardTitle>
            <CardDescription className="font-medium">Project-wise financial breakdowns</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Search records..." className="pl-10 rounded-xl bg-slate-50 border-none" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Project Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Allocated Fund</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expenditure</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Utilization Rate</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">Loading records...</TableCell>
                </TableRow>
              ) : budgetRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">No budget records found.</TableCell>
                </TableRow>
              ) : (
                budgetRecords.map((record) => {
                  const rate = (record.expenditure / record.allocatedFund) * 100;
                  return (
                    <TableRow key={record.id} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                      <TableCell className="py-6 px-8">
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">{record.projectName}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{record.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-700">₹{record.allocatedFund.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-orange-600">₹{record.expenditure.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[100px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(rate, 100)}%` }}
                              className={`h-full ${rate > 90 ? 'bg-red-500' : rate > 50 ? 'bg-primary' : 'bg-green-500'}`}
                            />
                          </div>
                          <span className="text-xs font-black">{rate.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-[3rem] p-0 overflow-hidden bg-slate-50">
          {selectedRecord && (
            <div className="flex flex-col">
              <div className="bg-primary p-12 text-white space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-white/20 text-white border-none px-4 py-1 font-black text-[10px] uppercase tracking-widest">Financial Voucher</Badge>
                  <p className="text-primary-foreground/60 font-mono text-xs">{new Date(selectedRecord.lastUpdated).toLocaleDateString()}</p>
                </div>
                <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedRecord.projectName}</h2>
                <div className="flex gap-4">
                  <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <MapPin size={16} />
                    <span className="font-bold text-sm">CCL Operational Area</span>
                  </div>
                </div>
              </div>

              <div className="p-12 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fund Allocated</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">₹{selectedRecord.allocatedFund.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Expenditure</p>
                    <p className="text-2xl font-black text-orange-600 leading-none">₹{selectedRecord.expenditure.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget Utilization Status</p>
                    <p className="text-xl font-black text-primary leading-none">
                      {((selectedRecord.expenditure / selectedRecord.allocatedFund) * 100).toFixed(1)}% Consumed
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden p-1 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(selectedRecord.expenditure / selectedRecord.allocatedFund) * 100}%` }}
                      className="h-full bg-primary rounded-full shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                  <div className="relative space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-widest">Financial Summary</h4>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      The project "{selectedRecord.projectName}" has utilized approximately ₹{selectedRecord.expenditure.toLocaleString()} from the initial sanctioned amount of ₹{selectedRecord.allocatedFund.toLocaleString()}. 
                      Remaining balance available for future requirements is ₹{(selectedRecord.allocatedFund - selectedRecord.expenditure).toLocaleString()}.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button variant="outline" className="rounded-2xl border-2 font-black tracking-tight h-12 px-8" onClick={() => setIsViewOpen(false)}>
                    CLOSE VOUCHER
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
