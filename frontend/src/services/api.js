import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

export const parksService = {
  getParks: () => api.get('/parks'),
  getParkDetail: (parkId) => api.get(`/parks/${parkId}`),
};

export const assetsService = {
  getAssets: (params) => api.get('/assets', { params }),
  getAssetDetail: (assetId) => api.get(`/assets/${assetId}`),
  getAssetTelemetry: (assetId, limit = 48) => api.get(`/assets/${assetId}/telemetry`, { params: { limit } }),
};

export const energyService = {
  getCurrentEnergy: () => api.get('/energy/current'),
  getGenerationHistory: (hours = 24) => api.get('/energy/history', { params: { hours } }),
};

export const weatherService = {
  getCurrentWeather: () => api.get('/weather/current'),
};

export const forecastService = {
  get24hForecast: () => api.get('/forecast'),
};

export const maintenanceService = {
  getRisks: () => api.get('/maintenance/risks'),
  getRecords: () => api.get('/maintenance/records'),
  scheduleMaintenance: (data) => api.post('/maintenance/schedule', data),
  getAnomalies: () => api.get('/maintenance/anomalies'),
};

export const gridService = {
  getGridStatus: () => api.get('/grid/status'),
  getRecommendations: () => api.get('/grid/recommendations'),
};

export const agentService = {
  query: (query, engine = 'orchestrate', assetId = null, parkId = null) =>
    api.post('/agent/query', { query, engine, asset_id: assetId, park_id: parkId }),
  getHistory: (limit = 15) => api.get('/agent/history', { params: { limit } }),
  getDailySummary: () => api.get('/agent/summary'),
  getEnginesStatus: () => api.get('/agent/engines/status'),
  getVoiceBriefing: () => api.get('/agent/voice-briefing'),
};

export const alertsService = {
  getAlerts: (params) => api.get('/alerts', { params }),
  acknowledgeAlert: (alertId) => api.post(`/alerts/${alertId}/acknowledge`),
};

export const simulationService = {
  getScenarios: () => api.get('/simulation/scenarios'),
  triggerScenario: (scenarioCode) => api.post('/simulation/trigger', { scenario_code: scenarioCode }),
  resetSimulation: () => api.post('/simulation/reset'),
};

export const digitalTwinService = {
  getTurbineTwin: (assetCode = 'WT-021') => api.get(`/digital-twin/turbine/${assetCode}`),
  getInverterTwin: (assetCode = 'INV-042') => api.get(`/digital-twin/inverter/${assetCode}`),
};

export const workOrdersService = {
  getWorkOrders: (params) => api.get('/workorders', { params }),
  getWorkOrderDetail: (id) => api.get(`/workorders/${id}`),
  generateFromAnomaly: (data) => api.post('/workorders/generate-from-anomaly', data),
  updateStatus: (id, status, notes = '') => api.patch(`/workorders/${id}/status`, { status, notes }),
  toggleStep: (id, stepNum) => api.patch(`/workorders/${id}/toggle-step/${stepNum}`),
};

export const marketService = {
  getOverview: () => api.get('/market/overview'),
};

export const resilienceService = {
  getScenarios: () => api.get('/resilience/scenarios'),
  triggerScenario: (scenarioId) => api.post('/resilience/trigger', { scenario_id: scenarioId }),
};

export const ingestService = {
  ingestSingle: (payload) => api.post('/ingest/telemetry', payload),
  ingestCSV: (formData) => api.post('/ingest/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTemplate: () => api.get('/ingest/scada-template'),
};

export default api;
