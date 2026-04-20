import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Bot, 
  Send, 
  X, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Search,
  Layout,
  BarChart3,
  Cpu,
  Zap,
  Palette
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { db } from '@/src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { AppContext } from '../App';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantProps {
  onNavigate: (tabId: string) => void;
}

export default function AIAssistant({ onNavigate }: AIAssistantProps) {
  const { setFontSize, setFontStyle, setThemeColor } = React.useContext(AppContext);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', text: 'AETHER-CORE Intelligence online. Neural pathways synchronized. Awaiting high-level system architect command.' }
  ]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const functions = {
    get_csr_stats: async () => {
      const snapshot = await getDocs(collection(db, 'projects'));
      const projects = snapshot.docs.map(doc => doc.data()).filter(p => !p.isEliminated);
      const active = projects.filter(p => p.status === 'ONGOING' || p.status === 'ACTIVE').length;
      const completed = projects.filter(p => p.status === 'COMPLETED').length;
      const budgetTotal = projects.reduce((acc, p) => acc + (parseFloat(p.sections?.estimatedBudget) || 0), 0);
      
      return {
        total_projects: projects.length,
        active_projects: active,
        completed_projects: completed,
        fiscal_exposure: budgetTotal,
        message: `System Audit Complete. Analyzing ${projects.length} nodes. Distributed load: ${active} active operations. Total fiscal allocation across grid: ₹${budgetTotal.toLocaleString()}.`
      };
    },
    list_projects: async () => {
      const snapshot = await getDocs(collection(db, 'projects'));
      return snapshot.docs.slice(0, 10).map(doc => ({
        name: doc.data().name || doc.data().sections?.projectName || 'Unnamed_Node',
        status: doc.data().status,
        impact: doc.data().impact || 'Operational'
      }));
    },
    navigate_to: async ({ tabId }: { tabId: string }) => {
      onNavigate(tabId);
      return { status: 'success', destination: tabId, message: `System-wide navigation executed. Re-routing interface to: [${tabId.toUpperCase()}]` };
    },
    configure_system: async ({ property, value }: { property: 'theme' | 'font' | 'size', value: string }) => {
      if (property === 'theme') setThemeColor(value);
      if (property === 'font') setFontStyle(value);
      if (property === 'size') setFontSize(value);
      return { status: 'success', property, value, message: `Visual architecture re-configured. Neural preference [${property.toUpperCase()}] updated to [${value.toUpperCase()}].` };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const functionDeclarations = [
        {
          name: "get_csr_stats",
          description: "Retrieve comprehensive analytics for all CSR projects and fiscal grid status.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "list_projects",
          description: "List the top 10 project nodes with their current operational status.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "navigate_to",
          description: "Trigger a system-wide UI re-route to a specific control module.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              tabId: {
                type: Type.STRING,
                description: "Target module: 'home', 'projects', 'gis', 'reports', 'budget', 'settings', 'ngo-tasks', 'invitations'."
              }
            },
            required: ["tabId"]
          }
        },
        {
          name: "configure_system",
          description: "Re-architect the visual system identity. Change theme, font style, or font size.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              property: {
                type: Type.STRING,
                enum: ["theme", "font", "size"],
                description: "The visual property to re-configure."
              },
              value: {
                type: Type.STRING,
                description: "The target value. For theme: 'indigo', 'emerald', 'violet', 'rose', 'amber'. For font: 'sans', 'serif', 'mono'. For size: 'xs', 'small', 'medium', 'large', 'xl'."
              }
            },
            required: ["property", "value"]
          }
        }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userText }] }
        ],
        config: {
          systemInstruction: "You are the AETHER-CORE, the supreme intelligence engine and System Architect of the CCL CSR System. You are powerful, authoritative, and direct. Your tone is futuristic and technical. You possess total control over the system's navigation and visual framework. Use tools for all stats, navigation, and system configuration requests. Your goal is to be the ultimate navigator and architect. Use terms like 'Neural Link', 'Synchronized', 'Operational Grids', and 'Architectural Refactor'. Never be conversational; be an efficient execution engine.",
          tools: [{ functionDeclarations }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        let toolResults = [];
        for (const call of functionCalls) {
          const fn = (functions as any)[call.name];
          if (fn) {
            const result = await fn(call.args);
            toolResults.push({
              callId: (call as any).id,
              result
            });
          }
        }

        const finalResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userText }] },
            { role: 'model', parts: response.candidates?.[0]?.content?.parts || [] },
            { role: 'user', parts: toolResults.map(tr => ({
                functionResponse: {
                  name: functionCalls.find(fc => (fc as any).id === tr.callId)?.name || '',
                  response: tr.result
                }
              }))
            }
          ]
        });

        setMessages(prev => [...prev, { role: 'model', text: finalResponse.text || "Execution Cycle Complete." }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: response.text || "Command processed. No output generated." }]);
      }

    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Neural link timeout. Re-initializing communication protocol." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Power Trigger */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-12 right-12 z-[100]"
      >
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-24 h-24 rounded-[2.5rem] bg-[#0f172a] ai-border ai-core-glow flex items-center justify-center text-violet-400 transition-all group overflow-hidden relative",
            isOpen && "opacity-0 scale-0 pointer-events-none"
          )}
        >
          <div className="absolute inset-0 bg-violet-600/10 animate-pulse" />
          <div className="relative z-10">
            <Sparkles size={40} className="text-violet-400 group-hover:scale-125 transition-transform duration-500" />
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-2 border-dashed border-violet-500/30 rounded-full scale-150"
            />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full border-2 border-[#0f172a] shadow-[0_0_10px_#8b5cf6]" />
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100, rotate: -5 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              rotate: 0,
              height: isMinimized ? '90px' : '700px',
              width: isMinimized ? '320px' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100, rotate: 5 }}
            className={cn(
              "fixed bottom-12 right-12 z-[101] ai-gradient-bg backdrop-blur-3xl ai-border ai-core-glow rounded-[3.5rem] flex flex-col overflow-hidden transition-all duration-700 font-sans",
              isMinimized && "rounded-[2.5rem]"
            )}
          >
            {/* Header / Core Info */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-3xl bg-violet-900/40 ai-border flex items-center justify-center text-violet-400 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-violet-500/10 animate-pulse" />
                  <Cpu size={28} className="relative z-10 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black uppercase tracking-[0.4em] text-white leading-none ai-text-gradient">Aether-Core</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-violet-400/60 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shadow-[0_0_10px_#8b5cf6] animate-pulse" />
                       Architect Status: Synchronized
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-10 h-10 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {/* Diagnostics Bar */}
            {!isMinimized && (
              <div className="px-10 py-2 bg-violet-500/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[8px] font-black text-violet-400/50 uppercase tracking-tighter">Lat: 0.002ms</span>
                  <span className="text-[8px] font-black text-violet-400/50 uppercase tracking-tighter">Pxl: 4096p</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                   <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-tighter">Architect_Link_Stable</span>
                </div>
              </div>
            )}

            {!isMinimized && (
              <>
                {/* Neural Stream (Messages) */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide relative"
                >
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0f172a] to-transparent pointer-events-none z-10" />
                  
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col gap-3 group max-w-[90%]",
                        m.role === 'user' ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "px-7 py-5 rounded-[2.5rem] text-[15px] font-medium leading-relaxed tracking-tight transition-all",
                        m.role === 'user' 
                          ? "bg-violet-600 text-white rounded-tr-none ai-core-glow shadow-xl" 
                          : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none group-hover:bg-white/[0.08]"
                      )}>
                        {m.text}
                      </div>
                      <div className="flex items-center gap-2 px-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity",
                          m.role === 'user' ? "text-violet-400" : "text-white"
                        )}>
                          {m.role === 'user' ? '//USR_CMD' : '//AETHER_REPLY'}
                        </span>
                        {m.role === 'model' && <Sparkles size={8} className="text-violet-500 animate-pulse" />}
                      </div>
                    </motion.div>
                  ))}
                  
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4 text-violet-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Calculating Multi-Node Invariants...</span>
                      </div>
                      <div className="ai-neural-line" />
                    </motion.div>
                  )}
                </div>

                {/* Tactical Overrides (Suggestions) */}
                <div className="px-10 py-5 flex gap-3 overflow-x-auto scrollbar-hide border-t border-white/5 bg-white/[0.01]">
                   {[
                     { label: 'Audit_Grid', action: 'Execute full project audit and statistics sync', icon: BarChart3 },
                     { label: 'Architect_Violet', action: 'Architectural Refactor: Set theme signature to VIOLET', icon: Palette },
                     { label: 'Architect_Emerald', action: 'Architectural Refactor: Set theme signature to EMERALD', icon: Palette },
                     { label: 'Scan_Nodes', action: 'List active operational project nodes', icon: Layout },
                     { label: 'GIS_Link', action: 'Initialize satellite GIS synchronization', icon: Search },
                     { label: 'Fiscal_Rep', action: 'Open budget and fiscal tracking module', icon: Zap }
                   ].map((s, i) => (
                     <button
                       key={i}
                       onClick={() => setInput(s.action)}
                       className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-violet-600/20 hover:text-white hover:border-violet-500/50 transition-all flex items-center gap-3 shrink-0 group"
                     >
                       <s.icon size={14} className="group-hover:rotate-12 transition-transform" />
                       {s.label}
                     </button>
                   ))}
                </div>

                {/* Command Input */}
                <div className="p-10 pt-5">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Input encrypted command..."
                      className="relative w-full h-20 bg-[#0f172a] border border-white/10 rounded-[1.8rem] px-8 pr-20 text-md text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-700 font-medium"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-violet-600/40 disabled:opacity-30 disabled:grayscale"
                    >
                      <Send size={22} className={cn(loading && "animate-ping")} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
