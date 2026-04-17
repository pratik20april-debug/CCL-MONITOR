import React from 'react';
import { GoogleGenAI, Type, FunctionDeclaration, Modality } from '@google/genai';
import { 
  Bot, 
  Send, 
  X, 
  MessageSquare, 
  Sparkles, 
  Navigation, 
  Command,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Volume2,
  VolumeX,
  Search as SearchIcon,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { toast } from 'sonner';
import { db } from '@/src/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
}

const NAV_TABS = [
  { id: 'home', label: 'Home Dashboard' },
  { id: 'projects', label: 'CSR Projects Master List' },
  { id: 'mou', label: 'MOU & Legal Documents' },
  { id: 'budget', label: 'Financial Budget Tracker' },
  { id: 'ngos', label: 'NGO Partners and Vetting' },
  { id: 'ngo-tasks', label: 'NGO Field Task Manager' },
  { id: 'ngo-evidence', label: 'Field Evidence & Geotags' },
  { id: 'ngo-funds', label: 'NGO Fund Disbursement' },
  { id: 'ngo-docs', label: 'Compliance Documents' },
  { id: 'ngo-support', label: 'Support & Queries' },
  { id: 'reports', label: 'Monthly Progress Reports' },
  { id: 'status', label: 'Live Project Status' },
  { id: 'completed', label: 'Archive of Completed Projects' },
  { id: 'gis', label: 'GIS Project Overview Map' },
  { id: 'settings', label: 'System Settings' },
];

const navigateFunction: FunctionDeclaration = {
  name: 'navigateTo',
  description: 'Navigate the user to a specific section of the CCL CSR Portal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tabId: {
        type: Type.STRING,
        description: 'The unique ID of the navigation tab to open.',
        enum: NAV_TABS.map(t => t.id),
      },
      reason: {
        type: Type.STRING,
        description: 'Briefly explain why this section is relevant to the user request.',
      }
    },
    required: ['tabId'],
  },
};

const getPortalStatsFunction: FunctionDeclaration = {
  name: 'getPortalStats',
  description: 'Retrieve high-level statistics about the CSR portal (Total projects, impact, budget summary).',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const searchProjectsFunction: FunctionDeclaration = {
  name: 'searchProjects',
  description: 'Search for specific projects by name or keyword.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query (e.g., "Health project", "Ranchi", "Education").',
      },
    },
    required: ['query'],
  },
};

export default function MitraAI({ onNavigate }: { onNavigate: (tabId: string) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', text: 'Namaste! Mitra v2.5 Neural Link established. I am now capable of searching the portal, analyzing stats, and navigating you through the CCL CSR ecosystem. How can I assist your mission today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const aiRef = React.useRef<GoogleGenAI | null>(null);

  React.useEffect(() => {
    if (!aiRef.current) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    }
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const playAudio = async (text: string) => {
    if (isMuted || !aiRef.current) return;
    
    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Say naturally but professionally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
        }
        
        const floatData = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          floatData[i] = bytes[i] / 32768.0;
        }

        const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
        buffer.getChannelData(0).set(floatData);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (error) {
      console.warn('TTS failed:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !aiRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        })), { role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: `You are "Mitra", the advanced neural AI coordinator for the Central Coalfields Limited (CCL) CSR Portal. 
          Your mission is to provide powerful navigation, data insights, and helpdesk support.
          Current Operations: CSR Budget Tracking, NGO Vetting, GIS Mapping, and Field Evidence Analysis.
          Tone: Professional, Mission-driven, Technical. Use "Neural Link" and "Mission Control" themes.
          
          Functions:
          - navigateTo: Jump to specific portal sections.
          - getPortalStats: Get summaries of projects and impact.
          - searchProjects: Find specific initiatives.
          
          Available Sections: ${NAV_TABS.map(t => `${t.label} (ID: ${t.id})`).join(', ')}.`,
          tools: [{ functionDeclarations: [navigateFunction, getPortalStatsFunction, searchProjectsFunction] }],
        },
      });

      const text = response.text || '';
      const functionCalls = response.functionCalls;

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'navigateTo') {
            const { tabId, reason } = call.args as { tabId: string, reason?: string };
            const tabLabel = NAV_TABS.find(t => t.id === tabId)?.label;
            onNavigate(tabId);
            const msg = text || `Protocol initiated. Redirecting to ${tabLabel}. ${reason || ''}`;
            setMessages(prev => [...prev, { role: 'model', text: msg }]);
            playAudio(msg);
            toast.info(`Navigating to ${tabLabel}`);
          } 
          else if (call.name === 'getPortalStats') {
            const projectsSnap = await getDocs(collection(db, 'projects'));
            const count = projectsSnap.size;
            const msg = `Neural scan complete. We currently have ${count} active CSR initiatives across all mining zones. Primary focus remains on health and education in rural Jharkhand areas.`;
            setMessages(prev => [...prev, { role: 'model', text: msg }]);
            playAudio(msg);
          }
          else if (call.name === 'searchProjects') {
            const { query: searchQuery } = call.args as { query: string };
            const q = query(collection(db, 'projects'), where('name', '>=', searchQuery), limit(3));
            const snap = await getDocs(q);
            const results = snap.docs.map(d => d.data().name);
            const msg = results.length > 0 
              ? `Search sequence successful. Found matches: ${results.join(', ')}. Would you like me to open one of these for you?`
              : `Negative matches for "${searchQuery}". Try broadening the search parameters or check the GIS map.`;
            setMessages(prev => [...prev, { role: 'model', text: msg }]);
            playAudio(msg);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text }]);
        playAudio(text);
      }
    } catch (error) {
      console.error(error);
      toast.error('Neural Link sync failed.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[100]">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              layoutId="ai-bubble"
              onClick={() => setIsOpen(true)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 bg-primary rounded-full shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center justify-center text-primary-foreground border-4 border-white/20 backdrop-blur-xl group"
            >
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 group-hover:opacity-40" />
              <BrainCircuit size={32} />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                <Sparkles size={10} className="text-primary font-bold" />
              </div>
            </motion.button>
          )}

          {isOpen && (
            <motion.div
              layoutId="ai-bubble"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="w-[400px] h-[600px] bg-card/95 backdrop-blur-2xl border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
                <div className="flex items-center gap-4 relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                    <BrainCircuit size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight text-lg uppercase flex items-center gap-2">
                      MITRA <span className="opacity-50">v2.5</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Syncing...</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative">
                  <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white hover:bg-white/10 rounded-xl">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-xl">
                    <Minimize2 size={20} />
                  </Button>
                </div>
              </div>

              {/* Chat Area */}
              <ScrollArea className="flex-1 p-6 space-y-4">
                <div className="space-y-4 pb-4">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn(
                        "flex w-full",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted/50 border border-border/10 rounded-tl-none backdrop-blur-sm"
                      )}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted/30 p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">Neural Processing</span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Suggestions */}
              <div className="px-6 pb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {[
                    { label: 'Status Scan', icon: BarChart3, cmd: 'Run portal status scan' },
                    { label: 'Find Health Project', icon: SearchIcon, cmd: 'Search for health projects' },
                    { label: 'Map View', icon: Navigation, cmd: 'Open Project Overview Map' },
                    { label: 'Budget Task', icon: Command, cmd: 'Show me the budget tracker' }
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setInput(s.cmd)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-wider text-primary whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-all group"
                    >
                      <s.icon size={12} className="group-hover:scale-110 transition-transform" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-6 pt-2 border-t border-border/50">
                <div className="relative group">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="How can I assist you?"
                    className="h-14 pl-6 pr-14 rounded-[1.5rem] border-none bg-muted/50 focus-visible:ring-primary/20 transition-all font-medium text-sm group-hover:bg-muted"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-center mt-3 font-medium text-muted-foreground uppercase tracking-tighter">
                  Powered by <span className="font-bold text-primary">Gemini 3 Flash</span> Neural Core
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
