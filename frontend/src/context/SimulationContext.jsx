import React, { createContext, useContext, useState, useEffect } from 'react';
import { simulationService } from '../services/api';

const SimulationContext = createContext(null);

export const SimulationProvider = ({ children }) => {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState(null);

  useEffect(() => {
    simulationService.getScenarios().then((res) => {
      setScenarios(res.data || []);
    }).catch((e) => console.warn("Failed to load scenarios:", e));
  }, []);

  const trigger = async (scenarioCode) => {
    setLoading(true);
    try {
      const res = await simulationService.triggerScenario(scenarioCode);
      setActiveScenario(scenarioCode === 'BASELINE_NORMAL' ? null : scenarioCode);
      setLastActionMessage(
        scenarioCode === 'BASELINE_NORMAL' 
          ? "System restored to Baseline Operations."
          : `Triggered: ${res.data?.scenario || scenarioCode}`
      );
      return res.data;
    } catch (e) {
      console.error("Simulation trigger failed:", e);
      setLastActionMessage("Error triggering scenario.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setLoading(true);
    try {
      await simulationService.resetSimulation();
      setActiveScenario(null);
      setLastActionMessage("System restored to Baseline Operations. Alarms acknowledged.");
    } catch (e) {
      console.error("Simulation reset failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        scenarios,
        activeScenario,
        loading,
        lastActionMessage,
        triggerScenario: trigger,
        resetSimulation: reset,
        clearMessage: () => setLastActionMessage(null)
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
