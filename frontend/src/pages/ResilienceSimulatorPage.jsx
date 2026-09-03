import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, Wind, Sun, Zap, ShieldCheck, AlertTriangle, 
  Play, RotateCcw, CheckCircle2, Clock, Radio, Activity, RefreshCw
} from 'lucide-react';
import { resilienceService } from '../services/api';

export default function ResilienceSimulatorPage() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState('cyclone_biparjoy');
  const [activeScenario, setActiveScenario] = useState(null);
  const [executionState, setExecutionState] = useState(null);
  const [executingStep, setExecutingStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await resilienceService.getScenarios();
      setScenarios(res.data.scenarios || []);
      if (res.data.scenarios?.length > 0) {
        setActiveScenario(res.data.scenarios[0]);
        setActiveScenarioId(res.data.scenarios[0].id);
      }
    } catch (err) {
      console.error('Failed to load resilience scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (sc) => {
    setActiveScenario(sc);
    setActiveScenarioId(sc.id);
    setExecutionState(null);
    setExecutingStep(0);
  };

  const handleTriggerFailsafe = async () => {
    if (!activeScenario) return;
    setExecutionState('RUNNING');
    setExecutingStep(1);

    try {
      const res = await resilienceService.triggerScenario(activeScenario.id);
      
      // Animate execution steps
      const totalSteps = activeScenario.autonomous_agent_actions.length;
      for (let i = 1; i <= totalSteps; i++) {
        await new Promise(r => setTimeout(r, 600));
        setExecutingStep(i);
      }
      setExecutionState('COMPLETED');
    } catch (err) {
      console.error('Error triggering failsafe:', err);
      setExecutionState('ERROR');
    }
  };

  const handleReset = () => {
    setExecutionState(null);
    setExecutingStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Gujarat Extreme Weather & Climate Resilience
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Autonomous Fail-Safe Loop
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <CloudLightning className="h-6 w-6 text-rose-400" />
            Gujarat Extreme Climate & Grid Resilience Simulator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate Cyclone Biparjoy coastal wind cutoffs, Rann of Kutch salt storms, and 46.5°C heatwaves to observe autonomous multi-agent fail-safes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {executionState === 'COMPLETED' ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Conditions
            </button>
          ) : (
            <button
              onClick={handleTriggerFailsafe}
              disabled={executionState === 'RUNNING'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition shadow-lg shadow-rose-900/30"
            >
              <Play className={`h-4 w-4 ${executionState === 'RUNNING' ? 'animate-spin' : ''}`} />
              {executionState === 'RUNNING' ? 'Engaging Fail-Safe...' : 'Trigger Autonomous Fail-Safe'}
            </button>
          )}
        </div>
      </div>

      {/* Scenario Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isSelected = activeScenarioId === sc.id;
          const isCrit = sc.severity === 'CRITICAL';
          return (
            <div
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected 
                  ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-950/40' 
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isCrit ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {sc.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{sc.target_region.split(',')[0]}</span>
              </div>
              <h3 className="font-bold text-white text-sm mt-1 line-clamp-2">{sc.title}</h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{sc.description}</p>
            </div>
          );
        })}
      </div>

      {/* Active Scenario Execution & Agent Action Stream */}
      {activeScenario && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Environmental Metrics */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Target Disturbance</span>
              <h3 className="text-lg font-bold text-white mt-1">{activeScenario.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{activeScenario.description}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Live Disturbance Parameters:</h4>
              {Object.entries(activeScenario.parameters).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold font-mono text-rose-300">{val}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Post-Mitigation Park State:</span>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{activeScenario.system_status}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Autonomous Multi-Agent Protection Stream */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Multi-Agent Fail-Safe Action Sequence
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous coordinated protection chain across IBM Watson Orchestrate & tool agents.
                </p>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                executionState === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                executionState === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse' :
                'bg-slate-800 text-slate-400'
              }`}>
                {executionState === 'COMPLETED' ? 'Fail-Safe Stabilized' : executionState === 'RUNNING' ? 'Executing Sequence...' : 'Ready for Trigger'}
              </span>
            </div>

            {/* Sequence Steps List */}
            <div className="space-y-3 pt-2">
              {activeScenario.autonomous_agent_actions.map((act) => {
                const isDone = executingStep >= act.sequence || executionState === 'COMPLETED';
                const isCurrent = executingStep === act.sequence && executionState === 'RUNNING';

                return (
                  <div
                    key={act.sequence}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent 
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50' 
                        : isDone 
                          ? 'border-emerald-500/40 bg-emerald-950/20' 
                          : 'border-slate-800 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isDone ? 'bg-emerald-500 text-slate-950' : isCurrent ? 'bg-cyan-400 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? '✓' : act.sequence}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm">{act.action}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono border border-slate-800">
                            {act.agent}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{act.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {executionState === 'COMPLETED' && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200 mt-4">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-purple-400" />
                  <span>Logged to Gujarat SLDC State Registry via IBM Watson Orchestrate.</span>
                </div>
                <span className="font-mono text-slate-400">Response Latency: 120ms</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
