import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { HelpCircle, MessageSquare, Send, Search, User } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

export default function NGOQueriesSupport() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Queries & Support</h2>
          <p className="text-slate-500 font-medium">Communication channel for NGO assistance and issue resolution</p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <MessageSquare size={18} />
          New Query
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b border-slate-50 pb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="text-slate-400" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Query #Q8891</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">Open • Assigned to System</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold">Details</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic mb-4">
                "Request clarity on the disbursement cycle for Q3 health project in Korba. The physical progress is 85%."
              </p>
              <div className="flex gap-2">
                <Input placeholder="Type a response..." className="rounded-xl border-slate-200" />
                <Button size="icon" className="rounded-xl">
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle size={20} /> Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                <p className="text-sm font-bold">How to mark boundaries?</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                <p className="text-sm font-bold">Uploading audit reports</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                <p className="text-sm font-bold">Contacting CSR Manager</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
