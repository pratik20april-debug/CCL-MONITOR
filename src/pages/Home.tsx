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
import { db, auth, handleFirestoreError, OperationType } from '@/src/firebase';
import { collection, onSnapshot, collectionGroup, query, orderBy, limit } from 'firebase/firestore';
import { AppContext } from '../App';
import { Languages, Globe } from 'lucide-react';

const translations = {
  en: {
    welcome: "Central Coalfields Limited",
    vision: "Our Vision",
    mission: "Our Mission",
    philosophy: "CSR Philosophy",
    visionText: "To emerge as a world-class, socially responsible energy company, committed to sustainable development and excellence in mining.",
    missionText: "To produce and market the planned quantity of coal and coal products efficiently and economically in an eco-friendly manner with due regard to safety, conservation and quality.",
    philosophyText: "CCL's CSR initiatives are focused on the socio-economic development of the community, particularly in the coal mining areas of Jharkhand.",
    explore: "EXPLORE CSR PORTAL",
    website: "COAL INDIA WEBSITE",
    activeProjects: "Active Projects",
    completed: "Completed",
    reports: "Reports Filed",
    beneficiaries: "Beneficiaries",
    distribution: "Project Distribution",
    growth: "Impact Growth",
    operations: "Recent Field Operations",
    searchPlaceholder: "Search for projects, reports, or guidance...",
    helpTitle: "Help & Support",
    helpDesc: "Need assistance? Explore our guides or contact support.",
    guide: "User Guide",
    faq: "FAQs",
    contact: "Contact Support"
  },
  hi: {
    welcome: "सेंट्रल कोलफील्ड्स लिमिटेड",
    vision: "हमारा दृष्टिकोण",
    mission: "हमारा लक्ष्य",
    philosophy: "सीएसआर दर्शन",
    visionText: "एक विश्व स्तरीय, सामाजिक रूप से जिम्मेदार ऊर्जा कंपनी के रूप में उभरना, जो खनन में सतत विकास और उत्कृष्टता के लिए प्रतिबद्ध है।",
    missionText: "नियोजित मात्रा में कोयले और कोयला उत्पादों का कुशलतापूर्वक और आर्थिक रूप से पर्यावरण के अनुकूल तरीके से उत्पादन और विपणन करना।",
    philosophyText: "सीसीएल की सीएसआर पहल समुदाय के सामाजिक-आर्थिक विकास पर केंद्रित है, विशेष रूप से झारखंड के कोयला खनन क्षेत्रों में।",
    explore: "सीएसआर पोर्टल खोजें",
    website: "कोल इंडिया वेबसाइट",
    activeProjects: "सक्रिय परियोजनाएं",
    completed: "पूरा हुआ",
    reports: "दायर रिपोर्ट",
    beneficiaries: "लाभार्थी",
    distribution: "परियोजना वितरण",
    growth: "प्रभाव वृद्धि",
    operations: "हाल के क्षेत्र संचालन",
    searchPlaceholder: "परियोजनाओं, रिपोर्टों या मार्गदर्शन के लिए खोजें...",
    helpTitle: "सहायता और समर्थन",
    helpDesc: "सहायता चाहिए? हमारे गाइड देखें या समर्थन से संपर्क करें।",
    guide: "उपयोगकर्ता गाइड",
    faq: "सामान्य प्रश्न",
    contact: "सहायता से संपर्क करें"
  }
};

const chartData = [
  { name: 'Jan', projects: 4, impact: 2400 },
  { name: 'Feb', projects: 7, impact: 3200 },
  { name: 'Mar', projects: 12, impact: 4800 },
  { name: 'Apr', projects: 15, impact: 5100 },
  { name: 'May', projects: 18, impact: 6200 },
  { name: 'Jun', projects: 24, impact: 7800 },
];

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 group relative">
    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardContent className="p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70">{title}</p>
          <h3 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">{value}</h3>
          {trend !== undefined && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider",
              trend > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              <TrendingUp size={12} className={cn(trend < 0 && "rotate-180")} />
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner group-hover:shadow-xl group-hover:shadow-primary/20">
          <Icon size={32} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Home() {
  const { language, setLanguage } = React.useContext(AppContext);
  const t = translations[language];
  const [stats, setStats] = React.useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalReports: 0,
    totalBeneficiaries: 0
  });
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projects = snapshot.docs.map(doc => doc.data()).filter(p => !p.isEliminated);
      const active = projects.filter(p => p.status === 'ONGOING' || p.status === 'ACTIVE');
      
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
      const reports = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        type: 'REPORT',
        timestamp: doc.data().date,
        ...doc.data() 
      }));
      setRecentActivities(prev => {
        const combined = [...reports, ...prev.filter(a => a.type === 'STATUS_UPDATE')]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 8);
        return combined;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const unsubRecentProjects = onSnapshot(query(collection(db, 'projects'), orderBy('updatedAt', 'desc'), limit(5)), (snapshot) => {
      const updates = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        type: 'STATUS_UPDATE',
        timestamp: doc.data().updatedAt || doc.data().createdAt || Date.now(),
        ...doc.data() 
      }));
      setRecentActivities(prev => {
        const combined = [...updates, ...prev.filter(a => a.type === 'REPORT')]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 8);
        return combined;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => {
      unsubProjects();
      unsubReportsCount();
      unsubRecentReports();
      unsubRecentProjects();
    };
  }, []);

  return (
    <div className="space-y-10 pb-20 neo-blur">
      {/* Top Bar: Language */}
      <div className="flex justify-end">
        <div className="flex bg-card/50 backdrop-blur-xl p-1.5 rounded-2xl border border-border/50 shadow-lg">
          <button 
            onClick={() => setLanguage('en')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              language === 'en' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Globe size={16} /> ENGLISH
          </button>
          <button 
            onClick={() => setLanguage('hi')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all",
              language === 'hi' ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Languages size={16} /> हिन्दी
          </button>
        </div>
      </div>

      {/* Hero Section: Vision, Mission & CSR */}
      <Card className="border border-border/50 shadow-2xl bg-primary text-primary-foreground overflow-hidden relative min-h-[500px] flex items-center">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full -mr-64 -mt-64 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/20 rounded-full -ml-64 -mb-64 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        <CardContent className="p-10 lg:p-20 relative w-full">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-none px-4 py-1.5 text-[12px] font-black tracking-[0.3em] uppercase mb-4">Miniratna Category-I Company</Badge>
              <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                {t.welcome}
              </h1>
              <p className="text-xl lg:text-2xl font-medium text-white/80 max-w-2xl mx-auto leading-relaxed">
                {t.philosophyText}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              <div className="space-y-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 text-left group">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:bg-white group-hover:text-primary transition-colors">
                  <Activity size={20} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                  {t.vision}
                </h4>
                <p className="text-lg font-bold leading-tight italic text-white/90">
                  "{t.visionText}"
                </p>
              </div>
              <div className="space-y-4 p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500 text-left group">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:bg-white group-hover:text-primary transition-colors">
                  <TrendingUp size={20} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                  {t.mission}
                </h4>
                <p className="text-base font-medium leading-relaxed text-white/80">
                  {t.missionText}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button 
                className="h-16 px-10 bg-white text-primary hover:bg-white/90 font-black text-base tracking-tight rounded-2xl shadow-2xl group"
                onClick={() => window.open('https://www.coalindia.in/csr/', '_blank')}
              >
                {t.explore}
                <Briefcase size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="h-16 px-10 border-white/20 text-white hover:bg-white/10 font-black text-base tracking-tight rounded-2xl backdrop-blur-md"
                onClick={() => window.open('https://www.coalindia.in/', '_blank')}
              >
                {t.website}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title={t.activeProjects} value={stats.activeProjects.toString()} icon={Briefcase} trend={12} />
        <StatCard title={t.completed} value={stats.completedProjects.toString()} icon={CheckCircle2} trend={5} />
        <StatCard title={t.reports} value={stats.totalReports.toString()} icon={FileText} trend={18} />
        <StatCard title={t.beneficiaries} value={stats.totalBeneficiaries.toLocaleString()} icon={Users} trend={24} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="shadow-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {t.distribution}
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
                {t.growth}
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

      <div className="grid grid-cols-1 gap-10">
        <Card className="border border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              {t.operations}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-6 p-8 hover:bg-primary/[0.02] transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner">
                    {activity.type === 'REPORT' ? <FileText size={28} /> : <Activity size={28} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <p className="font-black text-foreground text-xl tracking-tight group-hover:text-primary transition-colors">
                        {activity.type === 'REPORT' 
                          ? `Progress update for ${activity.area}` 
                          : `Status change for ${activity.title || activity.sections?.projectTitle || 'Project'}`}
                      </p>
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-muted/50">
                        {new Date(activity.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 font-medium leading-relaxed max-w-3xl">
                      {activity.type === 'REPORT' 
                        ? activity.progressText 
                        : `Current Status: ${activity.status}`}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge className={cn(
                      "font-black text-[10px] px-4 py-1.5 rounded-full border-none shadow-sm",
                      activity.status === 'VERIFIED' || activity.status === 'ONGOING' || activity.status === 'COMPLETED' 
                        ? "bg-green-500 text-white" 
                        : "bg-yellow-500 text-white"
                    )}>
                      {activity.status}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-tighter">Ref: {activity.id.slice(0, 8)}</span>
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
