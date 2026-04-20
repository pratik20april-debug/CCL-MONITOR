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
  Activity,
  ExternalLink,
  ArrowRight,
  Play,
  Video,
  X as CloseIcon,
  Shield,
  Cpu,
  Heart,
  Globe2,
  Navigation,
  ExternalLink as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
import { collection, onSnapshot, collectionGroup, query, orderBy, limit, where } from 'firebase/firestore';
import { AppContext } from '../App';
import { Languages, Globe, Bot } from 'lucide-react';
import PresentationGuide from '../components/PresentationGuide';
import AIAssistant from '../components/AIAssistant';

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
    cclWebsite: "CCL RANCHI WEBSITE",
    activeProjects: "Active Projects",
    completed: "Completed",
    reports: "Reports Filed",
    beneficiaries: "Beneficiaries",
    ongoingCompletion: "Ongoing Project",
    operations: "Recent Field Operations",
    searchPlaceholder: "Search for projects, reports, or guidance...",
    helpTitle: "Help & Support",
    helpDesc: "Need assistance? Explore our guides or contact support.",
    guide: "User Guide",
    faq: "FAQs",
    contact: "Contact Support",
    videoGuide: "How to use this app",
    watchVideo: "Watch small video",
    voiceGuidance: "App voice guidance",
    close: "Close"
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
    cclWebsite: "सीसीएल रांची वेबसाइट",
    activeProjects: "सक्रिय परियोजनाएं",
    completed: "पूरा हुआ",
    reports: "दायर रिपोर्ट",
    beneficiaries: "लाभार्थी",
    ongoingCompletion: "चल रही परियोजना",
    operations: "हाल के क्षेत्र संचालन",
    searchPlaceholder: "परियोजनाओं, रिपोर्टों या मार्गदर्शन के लिए खोजें...",
    helpTitle: "सहायता और समर्थन",
    helpDesc: "सहायता चाहिए? हमारे गाइड देखें या समर्थन से संपर्क करें।",
    guide: "उपयोगकर्ता गाइड",
    faq: "सामान्य प्रश्न",
    contact: "सहायता से संपर्क करें",
    videoGuide: "सिस्टम ओवरव्यू गाइड",
    watchVideo: "एप्लिकेशन वॉकथ्रू देखें",
    voiceGuidance: "महिला आवाज सहायक मार्गदर्शन",
    close: "प्लेयर बंद करें"
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

const CSRPolicySection = ({ t }: { t: any }) => {
  const pillars = [
    { 
      id: 'healthcare', 
      title: 'Healthcare', 
      desc: 'Mobile medical vans and village clinics.', 
      icon: Heart, 
      color: 'bg-rose-500', 
      policy: 'Providing accessible healthcare to marginalized communities in mining areas.' 
    },
    { 
      id: 'education', 
      title: 'Education', 
      desc: 'Digital classrooms and scholarship programs.', 
      icon: Briefcase, 
      color: 'bg-indigo-500', 
      policy: 'Empowering children with quality education and vocational training skills.' 
    },
    { 
      id: 'sustainable', 
      title: 'Environment', 
      desc: 'Afforestation and water harvesting.', 
      icon: Globe2, 
      color: 'bg-emerald-500', 
      policy: 'Ensuring eco-friendly mining and restoring biodiversity in Jharkhand.' 
    },
    { 
      id: 'infrastructure', 
      title: 'Infra', 
      desc: 'Village roads and solar lighting.', 
      icon: Activity, 
      color: 'bg-orange-500', 
      policy: 'Developing robust infrastructure for last-mile connectivity and energy.' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
      {pillars.map((pillar, idx) => (
        <motion.div
          key={pillar.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          viewport={{ once: true }}
          className="group relative"
        >
          <div className="h-full p-8 rounded-[2.5rem] bg-white border border-border/50 shadow-xl shadow-secondary/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
            <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-2xl text-white mb-6 shadow-lg", pillar.color)}>
              <pillar.icon size={24} />
            </div>
            <h4 className="text-xl font-black tracking-tight text-slate-800 uppercase mb-2">{pillar.title}</h4>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6 italic">{pillar.desc}</p>
            
            <div className="pt-6 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2">Policy Statement</span>
               <p className="text-[11px] font-bold text-slate-400 uppercase leading-snug">{pillar.policy}</p>
            </div>

            {/* Decorative background number */}
            <span className="absolute -bottom-4 -right-2 text-8xl font-black text-slate-50 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              0{idx + 1}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <Card className="overflow-hidden border border-border/50 shadow-sm bg-card/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 group relative">
    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardContent className="p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <h3 className="text-4xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-500">{value}</h3>
          {trend !== undefined && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider",
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

export default function Home({ onNavigate }: { onNavigate: (tabId: string) => void }) {
  const { language, setLanguage, navMode } = React.useContext(AppContext);
  const t = translations[language];
  const [stats, setStats] = React.useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalReports: 0,
    totalBeneficiaries: 0
  });
  const [ongoingProjects, setOngoingProjects] = React.useState<any[]>([]);
  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);
  const [showVideo, setShowVideo] = React.useState(false);

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

      setOngoingProjects(active.map(p => ({
        id: p.id,
        name: p.name || p.sections?.projectName || 'Unnamed Project',
        completion: p.sections?.physicalProgress || 0
      })));
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

    // Combined listener for recent activities to avoid flickering
    const qReports = query(collectionGroup(db, 'reports'), orderBy('date', 'desc'), limit(10));
    const qProjects = query(collection(db, 'projects'), where('isEliminated', '==', false), orderBy('updatedAt', 'desc'), limit(10));

    let reportsData: any[] = [];
    let projectsData: any[] = [];

    const updateActivities = () => {
      const combined = [...reportsData, ...projectsData]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 8);
      setRecentActivities(combined);
    };

    const unsubRecentReports = onSnapshot(qReports, (snapshot) => {
      reportsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        type: 'REPORT',
        timestamp: doc.data().date,
        ...doc.data() 
      }));
      updateActivities();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const unsubRecentProjects = onSnapshot(qProjects, (snapshot) => {
      projectsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        type: 'STATUS_UPDATE',
        timestamp: doc.data().updatedAt || doc.data().createdAt || Date.now(),
        ...doc.data() 
      }));
      updateActivities();
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
    <div className="space-y-12 pb-20 neo-blur">
      {/* App Tour Video at Top */}
      <section className="relative pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-transparent border-none rounded-[3.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.05)]">
          <div className="lg:col-span-12 relative h-[70vh] min-h-[550px] group cursor-pointer overflow-hidden rounded-[3.5rem]" onClick={() => setShowVideo(true)}>
             <img 
                src="https://picsum.photos/seed/ccl-mining-ranchi/1920/1080" 
                alt="System Preview" 
                className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent flex items-center p-12 lg:p-24">
                <div className="max-w-2xl space-y-8">
                  <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/20 backdrop-blur-xl rounded-full border border-white/20">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span className="text-xs font-black uppercase tracking-[0.35em] text-white">Interactive Visuals</span>
                  </div>
                  
                  <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-white uppercase drop-shadow-2xl">
                    Smart CSR <br />
                    <span className="text-primary italic">Intelligence</span>
                  </h1>
                  
                  <p className="text-xl text-white/80 font-medium leading-relaxed italic max-w-lg">
                    "Experience our advanced tracking system through a beautiful interactive walkthrough."
                  </p>
                  
                  <div className="flex flex-wrap gap-6 pt-4">
                    <Button 
                      onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                      className="h-20 px-12 rounded-[2rem] bg-white text-black font-black text-sm uppercase tracking-[0.25em] shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:bg-primary hover:text-white transition-all transform hover:scale-105 group/btn overflow-hidden"
                    >
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left" />
                      <Play className="mr-4 fill-current group-hover/btn:animate-pulse" size={24} />
                      Start Experience
                    </Button>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Floating Website Link Cards - Direct Links */}
        <div className="absolute -bottom-10 left-12 right-12 z-10 hidden lg:grid grid-cols-2 gap-6">
           <motion.a
             href="https://www.coalindia.in"
             target="_blank"
             rel="noopener noreferrer"
             whileHover={{ y: -5 }}
             className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/40 group overflow-hidden"
           >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Globe size={32} />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Coal India Limited</span>
                    <h3 className="text-xl font-black tracking-tighter uppercase text-slate-800">CIL Official Website</h3>
                 </div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary group-hover:border-primary transition-colors">
                 <ArrowRight size={20} />
              </div>
           </motion.a>

           <motion.a
             href="https://www.centralcoalfields.in"
             target="_blank"
             rel="noopener noreferrer"
             whileHover={{ y: -5 }}
             className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 group"
           >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-primary transition-all duration-500">
                    <Navigation size={32} />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">CCL Ranchi</span>
                    <h3 className="text-xl font-black tracking-tighter uppercase text-white">CCL Ranchi Portal</h3>
                 </div>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white group-hover:border-primary transition-colors">
                 <ArrowRight size={20} />
              </div>
           </motion.a>
        </div>

        {/* App Tour Video Overlay */}
        <PresentationGuide 
          isOpen={showVideo} 
          onClose={() => setShowVideo(false)} 
        />
      </section>

      {/* CSR Policy Showcase Section */}
      <section className="pt-20 px-4 space-y-10">
         <div className="text-center space-y-4">
            <Badge variant="outline" className="px-6 py-2 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.4em]">Corporate Social Responsibility</Badge>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase text-slate-900 leading-none">
              Governance & <br />
              <span className="text-primary italic">Social Impact</span>
            </h2>
            <p className="text-slate-500 font-medium italic max-w-xl mx-auto uppercase text-xs tracking-widest">CCL CSR Policy focuses on holistic development through structured pillars</p>
         </div>

         <CSRPolicySection t={t} />
      </section>

      {/* Quick Navigation Shortcuts */}
      <section className="px-4">
         <div className="p-10 rounded-[3.5rem] bg-slate-950 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
               <div className="space-y-4 max-w-sm">
                  <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic">Quick <br/> Navigation</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Direct access to mission-critical modules and analysis tools.</p>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'projects', label: 'Monitor Projects', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { id: 'gis', label: 'GIS Dashboard', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { id: 'budget', label: 'Fiscal Tracker', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' }
                  ].map((shortcut) => (
                    <motion.button
                      key={shortcut.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onNavigate(shortcut.id)}
                      className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center gap-6 group hover:bg-white transition-all duration-300"
                    >
                       <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:bg-slate-900 group-hover:text-white", shortcut.bg, shortcut.color)}>
                          <shortcut.icon size={32} />
                       </div>
                       <div className="text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-400 block mb-1">Launcher</span>
                          <span className="text-sm font-black uppercase tracking-tighter text-white group-hover:text-slate-900">{shortcut.label}</span>
                       </div>
                    </motion.button>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Top Bar: Language & Branding */}
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <div className="text-primary font-black text-3xl tracking-tighter uppercase whitespace-nowrap">CCL CSR</div>
          <div className="h-10 w-px bg-border/50 hidden md:block" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:block">Sustainable Development & Excellence</p>
        </div>
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

      {/* Interactive Vision/Mission/Philosophy Section */}
      <section className="px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
             <div className="relative h-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={language}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden rounded-[3.5rem] relative h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                      
                      <CardContent className="p-12 lg:p-20 relative flex flex-col justify-between h-full space-y-12">
                        <div className="space-y-8">
                          <div className="flex items-center gap-4">
                            <Badge className="bg-white/20 text-white border-none px-6 py-2 text-[10px] font-black tracking-[0.3em] uppercase">Miniratna Category-I</Badge>
                            <div className="h-px flex-1 bg-white/20" />
                          </div>
                          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none text-white uppercase italic">
                            {t.welcome}
                          </h2>
                          <div className="flex items-start gap-8">
                             <Shield className="text-white/40 shrink-0 mt-1" size={40} />
                             <p className="text-2xl font-medium text-white/90 max-w-2xl leading-relaxed italic pr-12">
                                "{t.philosophyText}"
                             </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/10">
                          <motion.div 
                            whileHover={{ x: 10 }}
                            className="space-y-4 cursor-default"
                          >
                            <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">{t.vision}</h3>
                            </div>
                            <p className="text-sm font-bold leading-relaxed tracking-tight text-white/90 uppercase">{t.visionText}</p>
                          </motion.div>
                          <motion.div 
                            whileHover={{ x: 10 }}
                            className="space-y-4 cursor-default"
                          >
                            <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                               <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">{t.mission}</h3>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-white/80">{t.missionText}</p>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
          
          <div className="lg:col-span-4 flex flex-col gap-8">
             <motion.div
               whileHover={{ scale: 1.02 }}
               className="flex-1 p-10 rounded-[3.5rem] bg-white border border-border/50 shadow-2xl flex flex-col justify-between relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
                    <Users size={40} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-3xl font-black tracking-tighter text-slate-800 uppercase">Impact Metrics</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Real-time mapping of socio-economic progress across Jharkhand's mining heartlands.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => onNavigate('projects')} 
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-primary transition-all overflow-hidden relative group/btn"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Deep Dive Data <ArrowRight size={18} />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left" />
                </Button>
             </motion.div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title={t.activeProjects} value={stats.activeProjects.toString()} icon={Briefcase} trend={12} />
        <StatCard title={t.completed} value={stats.completedProjects.toString()} icon={CheckCircle2} trend={5} />
        <StatCard title={t.reports} value={stats.totalReports.toString()} icon={FileText} trend={18} />
        <StatCard title={t.beneficiaries} value={stats.totalBeneficiaries.toLocaleString()} icon={Users} trend={24} />
      </div>

      {navMode === 'advanced' && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic glitch-text">Analytical Intelligence</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Advanced CSR Performance HUD</p>
            </div>
            <div className="flex gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Signal Health</span>
                  <div className="flex gap-1 mt-1">
                     {[1, 2, 3, 4, 5].map(b => (
                       <div key={b} className={cn("w-1 h-3 rounded-full", b <= 4 ? "bg-primary" : "bg-muted-foreground/20")} />
                     ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             {/* Main Chart HUD */}
             <Card className="lg:col-span-8 border-none bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative group">
                <div className="absolute inset-0 hud-grid opacity-10 pointer-events-none" />
                <CardHeader className="pb-0 border-none relative z-10">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Activity size={20} />
                         </div>
                         <div>
                            <CardTitle className="text-white text-base font-black uppercase tracking-widest">Growth Trajectory</CardTitle>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Simulated Real-Time Impact Projection</p>
                         </div>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/20 font-black animate-pulse">OPTIMIZED</Badge>
                   </div>
                </CardHeader>
                <CardContent className="h-[400px] pt-10 relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Q1', val: 4000 },
                        { name: 'Q2', val: 3000 },
                        { name: 'Q3', val: 2000 },
                        { name: 'Q4', val: 2780 },
                        { name: 'Q1', val: 1890 },
                        { name: 'Q2', val: 2390 },
                        { name: 'Q3', val: 3490 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tick={{ fill: '#ffffff50', fontWeight: 'bold' }}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                          itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="val" 
                          stroke="var(--primary)" 
                          strokeWidth={4} 
                          dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                          activeDot={{ r: 8, strokeWidth: 0, className: 'animate-pulse' }}
                        />
                      </LineChart>
                   </ResponsiveContainer>
                </CardContent>
             </Card>

             {/* Side Quick Stats HUD */}
             <div className="lg:col-span-4 flex flex-col gap-6">
                {[
                  { label: 'Network Integrity', val: '99.9%', trend: '+0.2', icon: Shield },
                  { label: 'Blockchain Sync', val: 'Verified', trend: 'Live', icon: Cpu },
                  { label: 'Data Latency', val: '12ms', trend: '-2ms', icon: Clock }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: -10, scale: 1.02 }}
                    className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl flex items-center gap-6 relative overflow-hidden group"
                  >
                     <div className="absolute inset-0 hud-scanline opacity-5" />
                     <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-12">
                        <stat.icon size={24} />
                     </div>
                     <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 block mb-1">{stat.label}</span>
                        <div className="flex items-center justify-between">
                           <span className="text-2xl font-black text-white tracking-tighter uppercase">{stat.val}</span>
                           <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", stat.trend.includes('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary")}>
                              {stat.trend}
                           </span>
                        </div>
                     </div>
                  </motion.div>
                ))}
                
                <Card className="flex-1 border-none bg-primary rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-primary/20 group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                   <div className="space-y-2 relative z-10">
                      <h4 className="text-white font-black uppercase text-xs tracking-widest">System Optimization</h4>
                      <p className="text-white/80 text-xs font-medium leading-tight">Advanced mode leverages AI to prioritize critical CSR alerts and field-op updates.</p>
                   </div>
                   <div className="space-y-4 pt-4 relative z-10">
                      <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest">
                         <span>CPU Priority</span>
                         <span>94%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                         <motion.div animate={{ width: ['20%', '94%', '88%'] }} transition={{ duration: 5, repeat: Infinity }} className="h-full bg-white shadow-[0_0_10px_white]" />
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        </motion.section>
      )}

      <div className="grid grid-cols-1 gap-10">
        <Card className="shadow-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {t.ongoingCompletion}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs font-black tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => onNavigate('projects')}
                >
                  See More <ArrowRight className="ml-1" size={12} />
                </Button>
                <Badge variant="outline" className="font-mono text-xs">LIVE PROGRESS</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingProjects.length > 0 ? ongoingProjects.slice(0, 6).map((project) => (
                <div key={project.id} className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm truncate max-w-[200px] group-hover:text-primary transition-colors">{project.name}</p>
                    <span className="font-mono text-xs font-black text-primary">{project.completion}%</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.completion}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    />
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-10 text-muted-foreground italic">
                  No ongoing projects found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <Card className="border border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {t.operations}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-black tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
                onClick={() => onNavigate('reports')}
              >
                Full History <ArrowRight className="ml-1" size={12} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentActivities.length > 0 ? recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center gap-6 p-8 hover:bg-primary/[0.02] transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-inner">
                    {activity.type === 'REPORT' ? <FileText size={28} /> : <Activity size={28} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <p className="font-black text-foreground text-xl tracking-tight group-hover:text-primary transition-colors">
                        {activity.type === 'REPORT' 
                          ? `Progress update for ${activity.projectName || activity.area}` 
                          : `Status change for ${activity.name || activity.sections?.projectName || 'Project'}`}
                      </p>
                      <Badge variant="secondary" className="font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-muted/50">
                        {new Date(activity.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground line-clamp-1 font-medium leading-relaxed max-w-3xl text-slate-500">
                        {activity.type === 'REPORT' 
                          ? activity.progressText 
                          : `Current Status: ${activity.status}`}
                      </p>
                      {activity.type === 'REPORT' && (
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[11px] font-bold text-primary border-primary/20">
                            PHYSICAL: {activity.physicalProgress || 0}%
                          </Badge>
                          <Badge variant="outline" className="text-[11px] font-bold text-blue-600 border-blue-200">
                            FINANCIAL: {activity.financialProgress || 0}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge className={cn(
                      "font-black text-xs px-4 py-1.5 rounded-full border-none shadow-sm",
                      activity.status === 'VERIFIED' || activity.status === 'ONGOING' || activity.status === 'COMPLETED' 
                        ? "bg-green-500 text-white" 
                        : "bg-yellow-500 text-white"
                    )}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs font-mono text-slate-300 uppercase tracking-tighter">Ref: {activity.id.slice(0, 8)}</span>
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
      {navMode === 'advanced' && <AIAssistant onNavigate={onNavigate} />}
    </div>
  );
}
