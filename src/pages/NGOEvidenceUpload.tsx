import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Camera, Image as ImageIcon, Upload, ShieldCheck } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export default function NGOEvidenceUpload() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Evidence Upload</h2>
          <p className="text-slate-500 font-medium">Verified field evidence and geotagged documentation</p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <Upload size={18} />
          Bulk Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera className="text-primary" size={32} />
            </div>
            <p className="font-black text-slate-900 uppercase tracking-widest">Upload Field Images</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Automatic extraction of EXIF and Geotag data</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-slate-200 hover:border-primary/20 transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="text-slate-400" size={32} />
            </div>
            <p className="font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Video Testimonials</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Upload impact stories and site videos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Verification Queue
            </CardTitle>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase">Live Processing</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Camera size={48} className="mb-4 opacity-10" />
            <p className="font-bold tracking-widest uppercase text-[10px]">Awaiting Field Evidence Submissions...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
