import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  PieChart, 
  Map as MapIcon, 
  FileText, 
  Users,
  MessageSquare,
  Volume2,
  ArrowRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface Step {
  title: string;
  subtitle: string;
  guidance: string;
  image: string;
  icon: any;
  color: string;
}

const steps: Step[] = [
  {
    title: "Project Discovery",
    subtitle: "Centralized CSR Management",
    guidance: "Welcome to the CCL CSR Portal. I am your assistant. This application serves as a central hub for all community social responsibility projects across Jharkhand. Here, you can monitor active missions, track funding, and stay connected with field operations in real-time.",
    image: "https://images.unsplash.com/photo-1579546678183-a9c1b72b0d59?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: Building2,
    color: "bg-blue-600"
  },
  {
    title: "Partner Onboarding",
    subtitle: "Fast and Secure NGO Verification",
    guidance: "To join, NGO partners receive a unique invitation. Simply enter your name and mobile number. The system instantly generates your unique login code. There is no waiting for OTPs—just enter your mobile number and get your code to start your mission.",
    image: "https://images.unsplash.com/photo-1510511459019-5dee997dd0ef?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: ShieldCheck,
    color: "bg-emerald-600"
  },
  {
    title: "Mission Logistics",
    subtitle: "Digital Document Storage",
    guidance: "Managing paperwork is now effortless. Navigate to the MOU and Document sections to securely upload, sign, and store all project agreements. Our centralized storage ensures that your legal and operational documents are always just one click away.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: FileText,
    color: "bg-purple-600"
  },
  {
    title: "Fiscal Intelligence",
    subtitle: "Real-time Budget Tracking",
    guidance: "Transparency is our priority. The Budget Tracker allows you to see exactly how funds are allocated and spent. Compare your total budget against actual field spending to ensure complete financial honesty and mission efficiency.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: PieChart,
    color: "bg-orange-600"
  },
  {
    title: "Field Operations",
    subtitle: "Daily Task Management",
    guidance: "Teams on the ground use our Task Manager to provide daily heartbeats. They can upload site photos that are automatically tagged with GPS locations. This 'Selfie-with-Site' feature provides undeniable proof of progress for every project stage.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: Users,
    color: "bg-amber-600"
  },
  {
    title: "GIS Intelligence",
    subtitle: "Interactive Geo-Spatial Maps",
    guidance: "Visualize your impact through our GIS Dashboard. See every project location pinned on an interactive map. Clicking a pin reveals real-time data about that specific location, helping you analyze the geographical reach of our CSR efforts.",
    image: "https://images.unsplash.com/photo-1524613032530-449a5d94c285?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: MapIcon,
    color: "bg-cyan-600"
  },
  {
    title: "Dynamic Reporting",
    subtitle: "Automated Field Submissions",
    guidance: "Submit your weekly progress reports directly through the portal. The app automatically calculates work completion percentages and remaining budgets, reducing manual data entry and ensuring error-free reporting to management.",
    image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: MessageSquare,
    color: "bg-indigo-600"
  },
  {
    title: "Data Integrity",
    subtitle: "Advanced Fail-Safe Recovery",
    guidance: "Never worry about accidental deletions. Our Recycle Bin protects your history. You can review and restore removed projects or permanently delete them only after final approval, keeping your project history safe and accurate.",
    image: "https://images.unsplash.com/photo-1593642532400-2682810df593?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: Sparkles,
    color: "bg-slate-700"
  },
  {
    title: "Impact Analysis",
    subtitle: "Visualizing Social Progress",
    guidance: "At the end of the day, it's about people. Our analytics engine turns field data into beautiful charts and insights. See exactly how many lives were touched and how our collective efforts are transforming Jharkhand, one project at a time.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1920&h=1080&auto=format&fit=crop",
    icon: PieChart,
    color: "bg-rose-600"
  }
];

export default function PresentationGuide({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = React.useState(true);
  const speechRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  const speak = (text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    speechRef.current = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a premium female voice
    const femaleVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
    if (femaleVoice) {
      speechRef.current.voice = femaleVoice;
    }
    speechRef.current.pitch = 1.05;
    speechRef.current.rate = 0.95; // Slightly slower for clarity
    window.speechSynthesis.speak(speechRef.current);
  };

  React.useEffect(() => {
    if (isOpen) {
      speak(steps[currentStep].guidance);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [currentStep, isOpen]);

  React.useEffect(() => {
    let timer: any;
    if (isAutoPlaying && isOpen) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev === steps.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 10000); // 10 seconds per slide for better understanding
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, isOpen]);

  const next = () => {
    setIsAutoPlaying(false);
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prev = () => {
    setIsAutoPlaying(false);
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 lg:p-12 cursor-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
              y: [0, 50, 0]
            }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/30 blur-[120px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -45, 0],
              x: [0, -80, 0],
              y: [0, 120, 0]
            }} 
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-emerald-500/20 blur-[100px] rounded-full" 
          />
        </div>

        {/* Cinematic Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-[210] bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles size={24} className="text-white fill-current" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tighter uppercase leading-none">System Presentation</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Interactive User Onboarding v1.0</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={cn(
                "w-12 h-12 rounded-full border border-white/10 text-white transition-all",
                isVoiceEnabled ? "bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/10"
              )}
            >
              {isVoiceEnabled ? <Volume2 size={20} /> : <div className="relative"><Volume2 size={20} className="opacity-40" /><X size={12} className="absolute -top-1 -right-1 text-rose-500" /></div>}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/10 text-white hover:bg-rose-600 transition-all"
            >
              <X size={24} />
            </Button>
          </div>
        </div>

        <div className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-[205]">
          
          {/* Visual Showcase (The "Screen") */}
          <div className="lg:col-span-12 xl:col-span-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -30 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative aspect-video rounded-[3.5rem] overflow-hidden border-8 border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] group"
              >
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-[10s] ease-linear group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* HUD Overlays */}
                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/40 to-transparent">
                  <div className="flex flex-col gap-4">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="inline-flex items-center gap-4"
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl", step.color)}>
                        <step.icon size={28} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Module Briefing</span>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase leading-none italic">{step.title}</h2>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Simulated UI "Video" Interactions Overlay */}
                <AnimatePresence>
                  <motion.div
                    key={`sim-${currentStep}`}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="absolute inset-0 pointer-events-none z-[15]"
                  >
                    {currentStep === 0 && ( // Project Discovery Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-80 bg-white/10 backdrop-blur-3xl rounded-3xl shadow-2xl p-8 border border-white/20 scale-110">
                        <div className="flex gap-4 mb-8">
                          <div className="flex-1 h-12 bg-white/10 rounded-xl border border-white/10 flex items-center px-6 gap-3">
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                             <motion.span 
                               initial={{ width: 0 }}
                               animate={{ width: "auto" }}
                               transition={{ delay: 0.5, duration: 2 }}
                               className="text-white/60 text-xs font-mono overflow-hidden whitespace-nowrap"
                             >
                               Searching: "Solar Micro-Grid Ranchi"
                             </motion.span>
                          </div>
                          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                             <Sparkles size={20} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <motion.div 
                             initial={{ y: 20, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             transition={{ delay: 2.5 }}
                             className="p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-3"
                           >
                              <div className="h-2 w-20 bg-slate-100 rounded" />
                              <div className="h-4 w-full bg-slate-50 rounded" />
                              <div className="mt-4 flex justify-between items-center">
                                 <div className="h-2 w-12 bg-primary/20 rounded" />
                                 <div className="w-6 h-6 bg-primary rounded-full" />
                              </div>
                           </motion.div>
                           <motion.div 
                             initial={{ y: 20, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             transition={{ delay: 2.8 }}
                             className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3"
                           >
                              <div className="h-2 w-20 bg-white/10 rounded" />
                              <div className="h-4 w-full bg-white/5 rounded" />
                              <div className="mt-4 flex justify-between items-center opacity-30">
                                 <div className="h-2 w-12 bg-white/20 rounded" />
                                 <div className="w-6 h-6 bg-white/10 rounded-full" />
                              </div>
                           </motion.div>
                        </div>
                        <motion.div 
                          animate={{ 
                            x: [100, -20, -20, 100],
                            y: [100, -40, -40, 100],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                          className="absolute pointer-events-none z-50"
                        >
                           <ArrowRight className="text-primary fill-primary rotate-[135deg]" size={24} />
                        </motion.div>
                      </div>
                    )}

                    {currentStep === 1 && ( // Partner Onboarding Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-white rounded-3xl shadow-2xl p-6 space-y-4 border-4 border-primary/20 scale-110">
                        <div className="h-4 w-20 bg-slate-100 rounded" />
                        <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded-xl flex items-center px-4 relative">
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity }} className="w-0.5 h-6 bg-primary" />
                          <motion.span 
                            initial={{ width: 0 }} 
                            animate={{ width: "auto" }} 
                            transition={{ delay: 1, duration: 1 }}
                            className="ml-2 text-slate-400 text-sm overflow-hidden whitespace-nowrap"
                          >
                            9876543210
                          </motion.span>
                        </div>
                        <div className="h-12 w-full bg-primary rounded-xl flex items-center justify-center text-white font-black text-xs uppercase tracking-widest relative overflow-hidden">
                           <motion.div 
                             animate={{ x: ["-100%", "100%"] }} 
                             transition={{ duration: 1.5, repeat: Infinity }}
                             className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" 
                           />
                           Generate Code
                        </div>
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          transition={{ delay: 2.5, type: "spring" }}
                          className="mt-6 p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl text-center"
                        >
                           <span className="text-[10px] text-primary font-black uppercase tracking-widest block mb-2">Unique Code Authorized</span>
                           <span className="text-3xl font-black text-primary">NGO-3210-542</span>
                        </motion.div>
                        
                        {/* Simulated Cursor */}
                        <motion.div 
                          animate={{ 
                            x: [100, 0, 0, 0],
                            y: [100, -20, -20, 100],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                          className="absolute pointer-events-none z-50"
                        >
                           <ArrowRight className="text-primary fill-primary rotate-[135deg]" size={24} />
                        </motion.div>
                      </div>
                    )}

                    {currentStep === 2 && ( // Logistics/MOU Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-72 bg-white rounded-3xl shadow-2xl p-8 border-4 border-primary/20 scale-110">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital MOU Storage</h4>
                           <Badge className="bg-primary/10 text-primary border-primary/20">4 Docs Loaded</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {[1, 2, 3, 4].map(i => (
                             <motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.2 + 0.5 }}
                               key={i} 
                               className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 group/doc hover:border-primary/30 transition-all cursor-pointer"
                             >
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                   <FileText size={20} />
                                </div>
                                <div className="flex-1">
                                   <div className="h-2 w-16 bg-slate-200 rounded mb-1" />
                                   <div className="h-1.5 w-10 bg-slate-100 rounded" />
                                </div>
                                <ShieldCheck size={16} className="text-emerald-500 opacity-0 group-hover/doc:opacity-100 transition-opacity" />
                             </motion.div>
                           ))}
                        </div>
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }} 
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mt-6 h-12 w-full bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-[0.3em] gap-2"
                        >
                           <Sparkles size={14} className="text-primary" />
                           Securely Encrypted
                        </motion.div>
                      </div>
                    )}

                    {currentStep === 3 && ( // Fiscal Intelligence Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/10 overflow-hidden scale-110">
                         <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-black text-white/40 uppercase tracking-widest">Budget Utilization</span>
                            <div className="px-3 py-1 bg-emerald-500 rounded-full text-[10px] text-white font-black">82%</div>
                         </div>
                         <div className="space-y-6">
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }} 
                                 animate={{ width: "82%" }} 
                                 transition={{ duration: 2, delay: 0.5 }}
                                 className="h-full bg-gradient-to-r from-primary to-emerald-500" 
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                                  <span className="block text-[8px] text-white/40 font-black uppercase tracking-widest">Budget</span>
                                  <span className="text-lg font-black text-white">₹24.5 Cr</span>
                               </div>
                               <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                                  <span className="block text-[8px] text-white/40 font-black uppercase tracking-widest">Spent</span>
                                  <span className="text-lg font-black text-emerald-400">₹20.1 Cr</span>
                               </div>
                            </div>
                         </div>
                         <motion.div 
                           animate={{ 
                             opacity: [0, 1, 0],
                             y: [0, -10, 0]
                           }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className="absolute top-1/2 left-1/2 -translate-x-1/2 font-black text-[10px] text-emerald-400 uppercase tracking-widest"
                         >
                           Savings Detected
                         </motion.div>
                      </div>
                    )}

                    {currentStep === 4 && ( // Field Ops Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-[450px] bg-slate-900 rounded-[3rem] shadow-2xl p-4 border-4 border-primary/20 scale-110 relative overflow-hidden">
                         {/* Mobile HUD */}
                         <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-800 rounded-full" />
                         <div className="mt-8 space-y-4">
                            <div className="h-48 w-full bg-slate-800 rounded-2xl overflow-hidden relative">
                               <img src="https://images.unsplash.com/photo-1541888941295-1e344ca21a4d?q=80&w=400" alt="Site" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                               <div className="absolute inset-0 flex flex-col items-center justify-center border-4 border-dashed border-white/10 rounded-2xl m-2">
                                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="text-white/40">
                                     <Play size={32} />
                                  </motion.div>
                                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-2">Uploading Evidence</span>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <div className="h-2 w-20 bg-primary/20 rounded" />
                               <div className="h-10 w-full bg-white/5 rounded-xl flex items-center px-4 gap-2">
                                  <MapIcon size={12} className="text-primary" />
                                  <span className="text-[10px] text-white/60 font-mono">23.3441° N, 85.3091° E</span>
                               </div>
                               <div className="h-10 w-full bg-white/5 rounded-xl flex items-center px-4 gap-2">
                                  <Clock size={12} className="text-primary" />
                                  <span className="text-[10px] text-white/60 font-mono">Verified Time: 11:45 AM</span>
                               </div>
                            </div>
                            <motion.div 
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 2 }}
                              className="h-12 w-full bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest"
                            >
                               GPS Self-Evidence Filed
                            </motion.div>
                         </div>
                      </div>
                    )}

                    {currentStep === 6 && ( // Reporting Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-80 bg-white rounded-3xl shadow-2xl p-10 border-4 border-primary/20 scale-110">
                         <div className="flex justify-between items-center mb-8">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Auto-Reporting Engine</h4>
                            <div className="flex gap-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                               <span className="text-[10px] font-black text-slate-600 uppercase">Live Sync</span>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Progress</span>
                                  <div className="flex items-center gap-4">
                                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "75%" }} transition={{ duration: 1.5 }} className="h-full bg-primary" />
                                     </div>
                                     <span className="text-xs font-black text-primary">75%</span>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Burn</span>
                                  <div className="flex items-center gap-4">
                                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "62%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-indigo-500" />
                                     </div>
                                     <span className="text-xs font-black text-indigo-500">62%</span>
                                  </div>
                               </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-center">
                               <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="mb-4">
                                  <RefreshCw size={32} className="text-primary" />
                                </motion.div>
                                <span className="text-[8px] text-white/40 font-black uppercase tracking-widest mb-1">Generating Weekly Insights</span>
                                <span className="text-[10px] text-white font-bold italic">"No discrepancies found."</span>
                            </div>
                         </div>
                      </div>
                    )}

                    {currentStep === 7 && ( // Recycle Bin Simulation
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-64 bg-slate-50 rounded-3xl shadow-2xl p-8 border-4 border-slate-200 scale-110 flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6 relative">
                             <motion.div 
                               animate={{ 
                                 y: [0, -40, 0],
                                 opacity: [0, 1, 0]
                               }}
                               transition={{ duration: 2, repeat: Infinity }}
                               className="absolute"
                             >
                                <FileText size={40} />
                             </motion.div>
                             <Sparkles size={40} />
                          </div>
                          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-2">FAIL-SAFE RECOVERY</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                             Accidental deletions are tracked <br/> and can be restored for 30 days.
                          </p>
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="mt-6 px-6 py-2 bg-slate-900 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer"
                          >
                             Restore History
                          </motion.div>
                       </div>
                    )}

                    {currentStep === 5 && ( // GIS Intelligence Simulation
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-64 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-primary/20 scale-110 p-0">
                         <div className="w-full h-full bg-slate-100 relative">
                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/grid.png')]" />
                            <motion.div 
                               initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}
                               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                               <div className="relative">
                                  <div className="w-12 h-12 bg-primary rounded-full animate-ping opacity-20" />
                                  <div className="absolute inset-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                                     <MapIcon size={24} />
                                  </div>
                               </div>
                            </motion.div>
                            <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Active Site</span>
                               <span className="text-xs font-bold text-slate-800">Ranchi Cluster A</span>
                            </div>
                         </div>
                      </div>
                    )}

                    {currentStep === 8 && ( // Impact Analysis Simulation
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-80 bg-white rounded-3xl shadow-2xl p-8 border-4 border-primary/20 scale-110">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Impact Growth Metrics</h4>
                          <div className="flex items-end justify-between h-40 gap-4 mb-6">
                             {[40, 70, 45, 90, 65, 80].map((h, i) => (
                                <motion.div 
                                   key={i}
                                   initial={{ height: 0 }}
                                   animate={{ height: `${h}%` }}
                                   transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
                                   className="flex-1 bg-gradient-to-t from-primary to-primary/60 rounded-t-lg relative group"
                                >
                                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary">
                                      {h}%
                                   </div>
                                </motion.div>
                             ))}
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-4">
                             <div className="flex flex-col">
                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Lives Impacted</span>
                                <span className="text-xl font-black text-slate-800">12,450+</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Village Coverage</span>
                                <span className="text-xl font-black text-primary">24 Units</span>
                             </div>
                          </div>
                       </div>
                    )}
                    
                    {/* Focal Attention Circle */}
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.05, 0.1]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[40px] border-primary/20 rounded-full"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Animated Scanner Effect */}
                <motion.div 
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-px bg-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.8)] z-10"
                />
              </motion.div>
            </AnimatePresence>

            {/* In-Frame Navigation */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-8 z-20">
              <Button onClick={prev} variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl text-white border border-white/10 hover:bg-primary transition-all shadow-2xl">
                <ChevronLeft size={32} />
              </Button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-8 z-20">
              <Button onClick={next} variant="ghost" size="icon" className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-2xl text-white border border-white/10 hover:bg-primary transition-all shadow-2xl">
                <ChevronRight size={32} />
              </Button>
            </div>
          </div>

          {/* Guidance Sidebar */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-12">
            <div className="relative p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/20 transition-colors" />
              
              <div className="flex items-center gap-6 mb-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-pulse" />
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl relative z-10">
                    <Volume2 size={32} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-primary font-black text-xs uppercase tracking-[0.3em]">AI Assistant Guidance</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{step.subtitle}</h3>
                    <div className="h-1 w-12 bg-primary rounded-full" />
                  </div>
                  
                  <p className="text-2xl text-white/90 font-medium leading-[1.6] italic tracking-tight">
                    "{step.guidance}"
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-10">
                <div className="flex gap-2">
                  {steps.map((_, i) => (
                    <motion.div 
                      key={i} 
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-500",
                        currentStep === i ? "w-10 bg-primary" : "w-4 bg-white/10"
                      )} 
                      animate={currentStep === i ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono text-white/20 font-black tracking-widest">CHAPTER 0{currentStep + 1} / 0{steps.length}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={cn(
                  "flex-1 h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all border-2",
                  isAutoPlaying 
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_30px_rgba(var(--primary),0.2)]" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {isAutoPlaying ? "Auto-Play On" : "Manual Control"}
              </Button>
              <Button 
                onClick={currentStep === steps.length - 1 ? onClose : next}
                className="flex-[2] h-20 rounded-[2rem] bg-white text-black font-black text-sm uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                {currentStep === steps.length - 1 ? "Finish Tutorial" : "Next Module"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
