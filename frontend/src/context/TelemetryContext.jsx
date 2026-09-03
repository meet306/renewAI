import React, { createContext, useContext, useState, useEffect } from 'react';
import { wsClient } from '../services/websocket';
import { energyService, alertsService } from '../services/api';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [telemetry, setTelemetry] = useState({
    solar_mw: 82.0,
    wind_mw: 46.0,
    total_generation_mw: 128.0,
    grid_demand_mw: 110.0,
    grid_frequency_hz: 50.02,
    battery_soc_pct: 68.5,
    park_efficiency_pct: 91.5,
    wt_021: {
      status: 'healthy',
      health_score: 95.0,
      power_kw: 2680.0,
      vibration_mms: 1.82,
      bearing_temp_c: 61.2
    }
  });

  const [isConnected, setIsConnected] = useState(false);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState(0);
  const [lastTickTime, setLastTickTime] = useState(new Date());

  const fetchInitialData = async () => {
    try {
      const [energyRes, alertsRes] = await Promise.all([
        energyService.getCurrentEnergy(),
        alertsService.getAlerts({ severity: 'CRITICAL', is_acknowledged: false })
      ]);
      if (energyRes.data) {
        setTelemetry((prev) => ({
          ...prev,
          solar_mw: energyRes.data.solar_generation_mw,
          wind_mw: energyRes.data.wind_generation_mw,
          total_generation_mw: energyRes.data.total_generation_mw,
          grid_demand_mw: energyRes.data.grid_demand_mw,
          battery_soc_pct: energyRes.data.battery_soc_pct,
          park_efficiency_pct: energyRes.data.park_efficiency_pct,
        }));
      }
      if (alertsRes.data) {
        setCriticalAlertsCount(alertsRes.data.length);
      }
    } catch (e) {
      console.warn("Initial telemetry fetch notice:", e);
    }
  };

  useEffect(() => {
    fetchInitialData();
    wsClient.connect();

    const unsubscribe = wsClient.subscribe((data) => {
      if (data.event_type === 'CONNECTION_STATUS') {
        setIsConnected(data.status === 'connected');
      } else if (data.event_type === 'TELEMETRY_TICK') {
        setTelemetry((prev) => ({
          ...prev,
          ...data,
          wt_021: data.wt_021 || prev.wt_021
        }));
        setLastTickTime(new Date());
      } else if (data.event_type === 'SIMULATION_TRIGGERED' || data.event_type === 'SIMULATION_RESET') {
        fetchInitialData();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        isConnected,
        criticalAlertsCount,
        lastTickTime,
        refreshTelemetry: fetchInitialData
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
