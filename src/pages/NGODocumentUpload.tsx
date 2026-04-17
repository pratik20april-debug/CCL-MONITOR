import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { FileText, Download, Filter, Search, FileUp } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

export default function NGODocumentUpload() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Document Repository</h2>
          <p className="text-slate-500 font-medium">Compliance and regulatory documentation management</p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <FileUp size={18} />
          Upload Document
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Search documents, certificates, reports..." className="pl-10 h-12 rounded-xl border-none shadow-lg" />
        </div>
        <Button variant="outline" className="h-12 w-12 rounded-xl border-none shadow-lg bg-white">
          <Filter size={18} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Registration_Certificate.pdf', 'Audit_Report_2024.pdf', 'Work_Order_Signed.pdf'].map((doc, i) => (
          <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="text-primary" size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-sm truncate">{doc}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black">2.4 MB • Oct 24, 2024</p>
                </div>
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary" /> Compliance History
          </CardTitle>
          <CardDescription>Comprehensive audit log of NGO document submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText size={48} className="mb-4 opacity-10" />
            <p className="font-bold tracking-widest uppercase text-[10px]">No compliance issues detected...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
