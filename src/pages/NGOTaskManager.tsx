import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function NGOTaskManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Task Manager</h2>
          <p className="text-slate-500 font-medium">Coordinate and track NGO operational tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Clock size={16} /> Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">12</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-yellow-600 flex items-center gap-2">
              <AlertCircle size={16} /> In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">05</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
              <CheckCircle2 size={16} /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">48</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="text-primary" /> Active Assignments
          </CardTitle>
          <CardDescription>Real-time task synchronization for NGO partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ListTodo size={48} className="mb-4 opacity-20" />
            <p className="font-bold tracking-widest uppercase text-xs">Awaiting Task Distribution...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
