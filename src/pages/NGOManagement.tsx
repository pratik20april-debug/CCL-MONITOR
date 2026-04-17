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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">NGO PARTNERS</h2>
          <p className="text-muted-foreground font-medium">Verify and manage NGO partners for CSR projects</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="rounded-2xl font-black gap-2 shadow-xl px-6 h-12" />}>
            <Plus size={20} />
            ADD NGO
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] border-none shadow-2xl rounded-[2.5rem] p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black tracking-tighter">Propose New NGO Partner</DialogTitle>
              <DialogDescription>Submit NGO details for internal verification and rating</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddNGO} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">NGO Name</Label>
                  <Input 
                    placeholder="Enter official name..." 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Reg. Number</Label>
                  <Input 
                    placeholder="80G/12A Reg..." 
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Focus Area</Label>
                <Select value={formData.focusArea} onValueChange={(val) => setFormData({...formData, focusArea: val})}>
                  <SelectTrigger className="bg-slate-50 border-none h-11 rounded-xl">
                    <SelectValue placeholder="Select operational sector..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Empowerment">Women Empowerment</SelectItem>
                    <SelectItem value="Livelihood">Rural Livelihood</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Website URL</Label>
                <Input 
                  placeholder="https://ngo-site.org" 
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="bg-slate-50 border-none h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Initial Rating (1-5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star.toString()})}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        parseInt(formData.rating) >= star ? "text-yellow-500 bg-yellow-50" : "text-slate-300 bg-slate-50"
                      )}
                    >
                      <Star size={20} fill={parseInt(formData.rating) >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 rounded-2xl font-black text-lg">
                  SUBMIT FOR APPROVAL
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-primary/5 rounded-[2rem]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none">Total NGOs</p>
              <p className="text-2xl font-black mt-1">{ngos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-green-500/5 rounded-[2rem]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 leading-none">Verified</p>
              <p className="text-2xl font-black mt-1">{ngos.filter(n => n.approvalStatus === 'APPROVED').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black tracking-tighter uppercase">NGO Directory & Vetting</CardTitle>
            <CardDescription className="font-medium">Manage partnerships and verified credentials</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search NGOs..." 
              className="pl-10 rounded-xl bg-slate-50 border-none h-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">NGO Identity</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reg. Number</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rating</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Approval</TableHead>
                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">Synchronizing NGO Data...</TableCell></TableRow>
              ) : filteredNgos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-slate-400 font-medium">No NGOs found in directory.</TableCell></TableRow>
              ) : (
                filteredNgos.map((ngo) => (
                  <TableRow key={ngo.id} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                    <TableCell className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">{ngo.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                            {ngo.focusArea} • <ExternalLink size={10} /> {ngo.website || 'No website'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{ngo.registrationNumber}</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} className={cn(ngo.rating >= s ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        ngo.approvalStatus === 'APPROVED' ? "bg-green-500" : 
                        ngo.approvalStatus === 'REJECTED' ? "bg-red-500" : "bg-yellow-500 text-yellow-950"
                      )}>
                        {ngo.approvalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      {ngo.approvalStatus === 'PENDING' && isUserAdmin ? (
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(ngo.id)}>
                            <Check size={16} />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(ngo.id)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ) : ngo.approvalStatus === 'PENDING' ? (
                        <span className="text-[10px] font-black text-yellow-600 uppercase italic">Awaiting Vetting</span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">Vetted</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
