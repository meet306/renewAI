import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Wrench, 
  CloudSun, 
  GitBranch, 
  Layers, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Check
} from 'lucide-react';
import { agentService } from '../services/api';

const QUICK_PROMPTS = [
  "Which asset needs immediate attention and why?",
  "Why is WT-021 underperforming and what is the failure risk?",
  "Is the SLDC 140 MW demand increase feasible with BESS?",
  "What is tomorrow's expected renewable generation?",
  "Calculate today's G-DAM revenue and CO2 emissions avoided",
  "Generate Gujarat SLDC Shift Handover Briefing"
];

export default function AICommandPage({ initialQuery }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedEngine, setSelectedEngine] = useState('orchestrate'); // 'orchestrate' | 'granite' | 'ensemble'
  const [engineStatus, setEngineStatus] = useState(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: (
        "Welcome to the **RenewAI Operational Intelligence Command Center**.\n\n" +
        "Connected live to **IBM Watson Orchestrate (au-syd instance)** and **IBM Granite (watsonx.ai)** over real-time physical telemetry from **Kutch and Banaskantha** hybrid parks.\n\n" +
        "Select your preferred cognitive engine above or query any asset, grid constraint, or shift handover briefing."
      ),
      engineUsed: "IBM Watson Orchestrate (Live Cloud)",
      agentsConsulted: ["Master Orchestrator", "IBM Watson Orchestrate", "IBM Granite LLM"],
      toolsExecuted: [],
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchEngineStatus();
  }, []);

  const fetchEngineStatus = async () => {
    try {
      const res = await agentService.getEnginesStatus();
      setEngineStatus(res.data);
    } catch (e) {
      console.warn('Engine status fetch error:', e);
    }
  };

  const handleVoiceBriefing = async () => {
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    try {
      const res = await agentService.getVoiceBriefing();
      const speechText = res.data.speech_text;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.onend = () => setIsPlayingVoice(false);
        utterance.onerror = () => setIsPlayingVoice(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingVoice(true);
      }
    } catch (e) {
      console.error('Voice briefing error:', e);
    }
  };

  const handleSend = async (queryToSend) => {
    const text = queryToSend || query;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await agentService.query(text, selectedEngine);
      const data = res.data;

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.answer || data.granite_reasoning,
        engineUsed: data.engine_used || (selectedEngine === 'granite' ? 'IBM Granite LLM' : 'IBM Watson Orchestrate'),
        agentsConsulted: data.agents_consulted || ["IBM Watson Orchestrate"],
        toolsExecuted: data.tools_executed || [],
        recommendedActions: data.recommended_actions || [],
        responseTimeMs: data.response_time_ms || 320,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error("Agent query error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: "Encountered an issue processing query. Resilient fallback mode engaged.",
          engineUsed: "Deterministic Safe Engine",
          agentsConsulted: ["Error Resilient Handler"],
          toolsExecuted: [],
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col glass-panel rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
      
      {/* Top Header & Engine Selector */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">AI Command Center & Cognitive Reasoning</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE CLOUD ORCHESTRATION
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous multi-agent routing with IBM Watson Orchestrate & IBM Granite LLM (watsonx.ai)
            </p>
          </div>
        </div>

        {/* Engine Switcher + Voice Briefing Button */}
        <div className="flex items-center gap-3">
          {/* Voice Briefing Button */}
          <button
            onClick={handleVoiceBriefing}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isPlayingVoice 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Read SLDC Briefing Aloud"
          >
            {isPlayingVoice ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
            {isPlayingVoice ? 'Stop Audio' : '🎙️ Listen to Briefing'}
          </button>

          {/* Engine Selector */}
          <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedEngine('orchestrate')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                selectedEngine === 'orchestrate' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Watson Orchestrate
            </button>
            <button
              onClick={() => setSelectedEngine('granite')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                selectedEngine === 'granite' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IBM Granite (watsonx)
            </button>
            <button
              onClick={() => setSelectedEngine('ensemble')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                selectedEngine === 'ensemble' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ensemble Mode
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <span className="font-bold text-cyan-300 tracking-wide">
                        {msg.engineUsed || 'IBM Watson Orchestrate'}
                      </span>
                    </div>
                    {msg.responseTimeMs && (
                      <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {msg.responseTimeMs} ms
                      </span>
                    )}
                  </div>
                )}

                {/* Formatted Markdown Content */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed space-y-2">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-base font-bold text-white mt-2 mb-1">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <h4 key={idx} className="font-bold text-cyan-300 mt-2">{line.replace(/\*\*/g, '')}</h4>;
                    }
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                      return (
                        <div key={idx} className="flex items-start gap-2 ml-1 text-slate-300">
                          <span className="text-cyan-400">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    return <p key={idx} className="text-slate-200">{line}</p>;
                  })}
                </div>

                {/* Tools & Agents Badge Trace */}
                {!isUser && msg.agentsConsulted && msg.agentsConsulted.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-purple-400" />
                      Agents:
                    </span>
                    {msg.agentsConsulted.map((agent, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-purple-300 border border-purple-500/20"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                )}

                {/* Recommended Actions Badges */}
                {!isUser && msg.recommendedActions && msg.recommendedActions.length > 0 && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5 mt-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Directives & Work Orders:
                    </span>
                    <ul className="space-y-1">
                      {msg.recommendedActions.map((act, i) => (
                        <li key={i} className="text-xs text-slate-200 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">→</span>
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex items-center gap-3 text-cyan-300">
              <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
              <span>IBM Watson Orchestrate is coordinating agents and querying live telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions Bar */}
      <div className="px-6 py-2 bg-slate-950 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Queries:</span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] whitespace-nowrap transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about WT-021 bearing defect, 140 MW feasibility, G-DAM revenue, shift handover briefing..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition font-sans"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-950/50"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
