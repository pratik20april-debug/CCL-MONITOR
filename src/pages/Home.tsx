import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { db, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, onSnapshot, collectionGroup, query, orderBy, limit } from 'firebase/firestore';

const chartData = [
  { name: 'Jan', projects: 4, impact: 2400 },
  { name: 'Feb', projects: 7, impact: 3200 },
  { name: 'Mar', projects: 12, impact: 4800 },
  { name: 'Apr', projects: 15, impact: 5100 },
  { name: 'May', projects: 18, impact: 6200 },
  { name: 'Jun', projects: 24, impact: 7800 },
];

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
    <CardContent className="p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <h3 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{value}</h3>
          {trend !== undefined && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
              trend > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              <TrendingUp size={10} />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 rotate-3 group-hover:rotate-0 shadow-inner">
          <Icon size={28} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Home() {
  const [stats, setStats] = React.useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalReports: 0,
    totalBeneficiaries: 0
  });
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projects = snapshot.docs.map(doc => doc.data());
      const active = projects.filter(p => p.status === 'ACTIVE');
      
      const beneficiaries = active.reduce((acc, p) => {
        const count = parseInt(p.sections?.noOfBeneficiaries || '0');
        return acc + (isNaN(count) ? 0 : count);
      }, 0);

      setStats(prev => ({
        ...prev,
        totalProjects: projects.length,
        activeProjects: active.length,
        completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
        totalBeneficiaries: beneficiaries
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const unsubReportsCount = onSnapshot(collectionGroup(db, 'reports'), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalReports: snapshot.docs.length
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const unsubRecentReports = onSnapshot(query(collectionGroup(db, 'reports'), orderBy('date', 'desc'), limit(5)), (snapshot) => {
      setRecentActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    return () => {
      unsubProjects();
      unsubReportsCount();
      unsubRecentReports();
    };
  }, []);

  return (
    <div className="space-y-10 pb-20 neo-blur">
      {/* Hero Section: Vision, Mission & CSR */}
      <Card className="border border-border/50 shadow-2xl bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-64 -mt-64 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full -ml-64 -mb-64 blur-[100px]" />
        
        <CardContent className="p-10 lg:p-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-2xl flex items-center justify-center overflow-hidden rotate-3 hover:rotate-0 transition-transform duration-500">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5f/Central_Coalfields_Limited_Logo.svg/512px-Central_Coalfields_Limited_Logo.svg.png" 
                    alt="CCL Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://www.coalindia.in/media/images/ccl.png';
                    }}
                  />
                </div>
                <div>
                  <Badge className="bg-white/20 text-white border-none mb-2 px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase">Miniratna Category-I</Badge>
                  <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none">
                    Central Coalfields <br />
                    <span className="text-white/70">Limited</span>
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    Our Vision
                  </h4>
                  <p className="text-lg font-bold leading-tight italic">
                    "To emerge as a world-class, socially responsible energy company, committed to sustainable development and excellence in mining."
                  </p>
                </div>
                <div className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    Our Mission
                  </h4>
                  <p className="text-sm font-medium leading-relaxed">
                    To produce and market the planned quantity of coal and coal products efficiently and economically in an eco-friendly manner with due regard to safety, conservation and quality.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  CSR Philosophy
                </h4>
                <p className="text-lg font-medium leading-relaxed text-white/90">
                  CCL's CSR initiatives are focused on the socio-economic development of the community, 
                  particularly in the coal mining areas of Jharkhand. We strive to improve the quality 
                  of life through strategic interventions in education, healthcare, and infrastructure.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  className="h-14 px-8 bg-white text-primary hover:bg-white/90 font-black text-sm tracking-tight rounded-2xl shadow-2xl group"
                  onClick={() => window.open('https://www.coalindia.in/csr/', '_blank')}
                >
                  EXPLORE CSR PORTAL
                  <TrendingUp size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 px-8 border-white/20 text-white hover:bg-white/10 font-black text-sm tracking-tight rounded-2xl backdrop-blur-md"
                  onClick={() => window.open('https://www.coalindia.in/', '_blank')}
                >
                  COAL INDIA WEBSITE
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-transparent z-10 rounded-[3rem]" />
                <img 
                  src="https://picsum.photos/seed/mining/800/1000" 
                  alt="Mining Operations" 
                  className="rounded-[3rem] shadow-2xl object-cover h-[600px] w-full grayscale hover:grayscale-0 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-8 left-8 z-20 space-y-2">
                  <p className="text-6xl font-black tracking-tighter">50+</p>
                  <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Years of Excellence</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Active Projects" value={stats.activeProjects.toString()} icon={Briefcase} trend={12} />
        <StatCard title="Completed" value={stats.completedProjects.toString()} icon={CheckCircle2} trend={5} />
        <StatCard title="Reports Filed" value={stats.totalReports.toString()} icon={FileText} trend={18} />
        <StatCard title="Beneficiaries" value={stats.totalBeneficiaries.toLocaleString()} icon={Users} trend={24} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="shadow-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Project Distribution
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">REAL-TIME DATA</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="projects" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Impact Growth
              </CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">MONTHLY TREND</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="impact" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: 'hsl(var(--card))' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="lg:col-span-2 border border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Recent Field Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-6 p-6 hover:bg-primary/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-foreground text-lg tracking-tight">Progress update for {activity.area}</p>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-md">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-medium">
                      {activity.progressText}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={cn(
                      "font-mono text-[10px] px-3 py-1 rounded-full",
                      activity.status === 'VERIFIED' ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                    )}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-muted-foreground font-medium italic">
                  No recent field operations recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
