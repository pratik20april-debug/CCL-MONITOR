import React from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/src/components/ui/dialog';
import { Badge } from '@/src/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Check, X, Star, ExternalLink, ShieldCheck, Building2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function NGOManagement() {
  const [ngos, setNgos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const [userRole, setUserRole] = React.useState<string>('NGO');
  const adminEmails = ['prat@ccl.gov.in', 'john@ccl.gov.in', 'admin@ccl.gov.in', 'pratik.20april@gmail.com'];
  const isUserAdmin = adminEmails.includes(auth.currentUser?.email || '');

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    website: '',
    focusArea: '',
    registrationNumber: '',
    rating: '5'
  });

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'ngos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNgos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ngos');
    });

    return () => unsubscribe();
  }, []);

  const handleAddNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.registrationNumber) {
      toast.error("Name and Registration Number are mandatory");
      return;
    }

    try {
      await addDoc(collection(db, 'ngos'), {
        ...formData,
        rating: parseInt(formData.rating),
        approvalStatus: 'PENDING',
        status: 'ACTIVE',
        createdAt: Date.now(),
        submittedBy: auth.currentUser?.email
      });
      toast.success("NGO proposal submitted for verification");
      setIsAddOpen(false);
      setFormData({ name: '', website: '', focusArea: '', registrationNumber: '', rating: '5' });
    } catch (error) {
      handleFirestoreError(error as any, OperationType.CREATE, 'ngos');
    }
  };

  const handleApprove = async (ngoId: string) => {
    try {
      await updateDoc(doc(db, 'ngos', ngoId), {
        approvalStatus: 'APPROVED',
        verifiedAt: Date.now(),
        verifiedBy: auth.currentUser?.email
      });
      toast.success("NGO Verified and Approved");
    } catch (error) {
      handleFirestoreError(error as any, OperationType.UPDATE, 'ngos');
    }
  };

  const handleReject = async (ngoId: string) => {
    try {
      await updateDoc(doc(db, 'ngos', ngoId), {
        approvalStatus: 'REJECTED'
      });
      toast.error("NGO Application Rejected");
    } catch (error) {
      handleFirestoreError(error as any, OperationType.UPDATE, 'ngos');
    }
  };

  const filteredNgos = ngos.filter(ngo => 
    ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ngo.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 neo-blur">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none text-[11px] font-black tracking-[0.2em] px-3 py-1 uppercase mb-2">Partner List</Badge>
          <h2 className="text-5xl font-black tracking-tighter text-foreground font-heading uppercase leading-none">NGO PARTNERS</h2>
          <p className="text-lg text-muted-foreground font-medium italic">"Every partner helps us reach more people."</p>
        </div>

        <div className="flex gap-4">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="h-14 px-8 rounded-2xl font-black text-sm tracking-tight shadow-2xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
                <Plus className="mr-2" size={20} />
                ADD NEW NGO
              </Button>
            } />
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-[3rem] p-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
              <DialogHeader className="mb-8 relative">
                <DialogTitle className="text-3xl font-black tracking-tighter font-heading uppercase leading-tight">Propose New NGO Partner</DialogTitle>
                <DialogDescription className="text-base font-medium">Submit NGO credentials for internal multi-layer vetting and classification.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddNGO} className="space-y-6 relative">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Official NGO Name</Label>
                    <Input 
                      placeholder="e.g. Vision Foundation" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-50 border-border/50 h-12 rounded-xl focus:ring-primary shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Registration Index</Label>
                    <Input 
                      placeholder="80G/12A/CSR1..." 
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      className="bg-slate-50 border-border/50 h-12 rounded-xl focus:ring-primary shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Primary Operation Sector</Label>
                  <Select value={formData.focusArea} onValueChange={(val) => setFormData({...formData, focusArea: val})}>
                    <SelectTrigger className="bg-slate-50 border-border/50 h-12 rounded-xl focus:ring-primary shadow-inner transition-all">
                      <SelectValue placeholder="Selection mandatory..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                      <SelectItem value="Education">Educational Excellence</SelectItem>
                      <SelectItem value="Healthcare">Healthcare Awareness</SelectItem>
                      <SelectItem value="Environment">Ecological Resilience</SelectItem>
                      <SelectItem value="Empowerment">Women Socio-Empowerment</SelectItem>
                      <SelectItem value="Livelihood">Sustainable Rural Livelihood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Official Web Portal</Label>
                  <div className="relative">
                    <Input 
                      placeholder="https://identity-verified.org" 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="bg-slate-50 border-border/50 h-12 pl-10 rounded-xl focus:ring-primary shadow-inner"
                    />
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Internal Protocol Rating (1-5)</Label>
                  <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-dashed border-border/60">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star.toString()})}
                        className={cn(
                          "w-12 h-12 rounded-xl transition-all flex items-center justify-center shadow-sm",
                          parseInt(formData.rating) >= star ? "text-amber-500 bg-amber-500/10 scale-110" : "text-slate-300 bg-white"
                        )}
                      >
                        <Star size={24} fill={parseInt(formData.rating) >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" className="w-full h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.01] transition-transform">
                    Deploy Partnership Proposal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-border/50 shadow-xl flex items-center gap-6 group hover:border-primary/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <Building2 size={32} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none mb-2">Total Directory</p>
            <p className="text-4xl font-black text-foreground font-heading leading-none tracking-tighter">{ngos.length}</p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-border/50 shadow-xl flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none mb-2">Fully Vetted</p>
            <p className="text-4xl font-black text-foreground font-heading leading-none tracking-tighter">{ngos.filter(n => n.approvalStatus === 'APPROVED').length}</p>
          </div>
        </div>
      </div>

      <Card className="border border-border/50 shadow-2xl bg-white/60 backdrop-blur-xl rounded-[3rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-border/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <CardTitle className="text-2xl font-black tracking-tighter font-heading uppercase">NGO Master Registry</CardTitle>
            <CardDescription className="font-bold text-xs uppercase tracking-[0.1em] mt-1 text-muted-foreground/60">Operational Status & Compliance Vetting</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
            <Input 
              placeholder="Search by name or reg. ID..." 
              className="pl-12 rounded-2xl bg-slate-100/50 border-none h-14 font-medium" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 backdrop-blur-md">
                <TableRow className="border-none">
                  <TableHead className="py-8 px-10 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Partner Identity</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Compliance ID</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Rating Protocol</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Approval Arc</TableHead>
                  <TableHead className="text-right px-10 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Terminal Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-24 text-center text-muted-foreground/50 font-black uppercase tracking-widest text-xs">Accessing Directory...</TableCell></TableRow>
                ) : filteredNgos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-24 text-center text-muted-foreground/50 font-black uppercase tracking-widest text-xs">Registry is Empty</TableCell></TableRow>
                ) : (
                  filteredNgos.map((ngo) => (
                    <TableRow key={ngo.id} className="group hover:bg-slate-50/50 transition-all border-border/20">
                      <TableCell className="py-8 px-10">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                            ngo.approvalStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <Building2 size={24} />
                          </div>
                          <div>
                            <p className="font-black text-foreground font-heading text-lg leading-[1.1] mb-1 uppercase tracking-tight">{ngo.name}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">{ngo.focusArea}</span>
                              <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                              <a 
                                href={ngo.website} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1.5 hover:text-primary transition-colors underline-offset-4 hover:underline"
                              >
                                {ngo.website ? "Launch Site" : "Portal Offline"} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-[11px] font-black text-slate-500 tracking-tighter">{ngo.registrationNumber}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-1">Verified Index</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={16} 
                              className={cn(ngo.rating >= s ? "text-amber-500 fill-amber-500 shadow-amber-200" : "text-slate-200")} 
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all",
                          ngo.approvalStatus === 'APPROVED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm" : 
                          ngo.approvalStatus === 'REJECTED' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                            ngo.approvalStatus === 'APPROVED' ? "bg-emerald-500" : 
                            ngo.approvalStatus === 'REJECTED' ? "bg-rose-500" : "bg-amber-500"
                          )} />
                          {ngo.approvalStatus}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        {ngo.approvalStatus === 'PENDING' && isUserAdmin ? (
                          <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 shadow-sm" onClick={() => handleApprove(ngo.id)}>
                              <Check size={20} />
                            </Button>
                            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 shadow-sm" onClick={() => handleReject(ngo.id)}>
                              <Plus className="rotate-45" size={20} />
                            </Button>
                          </div>
                        ) : ngo.approvalStatus === 'PENDING' ? (
                          <span className="text-[9px] font-black text-amber-600 uppercase italic tracking-widest bg-amber-50 px-3 py-1 rounded-lg">Vetting Cycle</span>
                        ) : (
                          <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Protocol Finalized</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
