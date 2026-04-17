import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Wallet, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { Progress } from '@/src/components/ui/progress';

export default function NGOFundStatus() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Fund Status</h2>
          <p className="text-slate-500 font-medium">NGO-specific financial tracking and disbursement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IndianRupee className="text-primary" size={20} />
              </div>
              <span className="flex items-center text-green-500 text-xs font-bold">
                <ArrowUpRight size={14} /> +12%
              </span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Disbursed</p>
            <h3 className="text-2xl font-black mt-1">₹ 4.2 Cr</h3>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Wallet className="text-yellow-600" size={20} />
              </div>
              <span className="flex items-center text-slate-400 text-xs font-bold">
                Stability
              </span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Utilized Funds</p>
            <h3 className="text-2xl font-black mt-1">₹ 2.8 Cr</h3>
            <Progress value={66} className="h-1.5 mt-4" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ArrowDownRight className="text-red-500" size={20} />
              </div>
              <span className="flex items-center text-red-500 text-xs font-bold">
                Due Soon
              </span>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Audit</p>
            <h3 className="text-2xl font-black mt-1">₹ 1.4 Cr</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="text-primary" /> Disbursement Ledger
          </CardTitle>
          <CardDescription>Track payments and utilization certificates from partner NGOs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Wallet size={48} className="mb-4 opacity-10" />
            <p className="font-bold tracking-widest uppercase text-[10px]">No recent disbursements found...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
