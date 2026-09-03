import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Download, 
  Code, 
  ArrowRight,
  Database,
  Radio,
  Sliders
} from 'lucide-react';
import { ingestService } from '../services/api';

export default function DataIngestPage() {
  const [assetCode, setAssetCode] = useState('WT-021');
  const [powerKw, setPowerKw] = useState(2100.0);
  const [expectedKw, setExpectedKw] = useState(2800.0);
  const [vibrationMms, setVibrationMms] = useState(5.4);
  const [componentTempC, setComponentTempC] = useState(78.6);
  const [ambientTempC, setAmbientTempC] = useState(34.0);
  const [windSpeedMs, setWindSpeedMs] = useState(8.4);
  const [irradianceWm2, setIrradianceWm2] = useState(0.0);
  const [voltageV, setVoltageV] = useState(690.0);
  const [currentA, setCurrentA] = useState(2450.0);

  const [loading, setLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  const handleManualIngest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIngestResult(null);

    try {
      const payload = {
        asset_code: assetCode,
        power_kw: parseFloat(powerKw),
        expected_power_kw: parseFloat(expectedKw),
        vibration_mms: parseFloat(vibrationMms),
        component_temp_c: parseFloat(componentTempC),
        ambient_temp_c: parseFloat(ambientTempC),
        wind_speed_ms: parseFloat(windSpeedMs),
        irradiance_wm2: parseFloat(irradianceWm2),
        voltage_v: parseFloat(voltageV),
        current_a: parseFloat(currentA)
      };

      const res = await ingestService.ingestSingle(payload);
      setIngestResult(res.data);
    } catch (err) {
      console.error('Error ingesting manual telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvLoading(true);
    setCsvResult(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await ingestService.ingestCSV(formData);
      setCsvResult(res.data);
    } catch (err) {
      console.error('Error uploading CSV:', err);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,timestamp,asset_code,power_kw,expected_power_kw,vibration_mms,component_temp_c,ambient_temp_c,wind_speed_ms,irradiance_wm2,voltage_v,current_a\n"
      + "2026-09-02T12:00:00Z,WT-021,2100.0,2800.0,5.4,78.6,34.0,8.4,0.0,690.0,2450.0\n"
      + "2026-09-02T12:00:00Z,INV-042,2750.0,3000.0,1.2,74.5,38.0,0.0,885.0,800.0,3437.0\n"
      + "2026-09-02T12:00:00Z,WT-005,2780.0,2800.0,1.8,61.2,32.0,8.5,0.0,690.0,2320.0";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "renewai_scada_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Sensor Ingestion & Custom Data Gateway
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Real-Time ML + Watson Orchestrate Execution
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <Database className="h-6 w-6 text-cyan-400" />
            Custom Data Ingestion & SCADA Gateway
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Feed your own real sensor measurements, upload custom SCADA CSV datasets, or stream live IoT data directly into RenewAI.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <Download className="h-4 w-4 text-cyan-400" />
          Download CSV Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Live Manual Telemetry Injector */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                Live Sensor Value Injector
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Input your custom physical readings and trigger instant AI analysis</p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              Live Pipeline
            </span>
          </div>

          <form onSubmit={handleManualIngest} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Target Asset Code</label>
                <input
                  type="text"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. WT-021, INV-042"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Active Power (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={powerKw}
                  onChange={(e) => setPowerKw(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bearing Vibration (mm/s RMS)</label>
                <input
                  type="number"
                  step="0.01"
                  value={vibrationMms}
                  onChange={(e) => setVibrationMms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-rose-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Component Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={componentTempC}
                  onChange={(e) => setComponentTempC(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Wind Speed (m/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={windSpeedMs}
                  onChange={(e) => setWindSpeedMs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Expected Power (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  value={expectedKw}
                  onChange={(e) => setExpectedKw(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <Zap className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Executing ML Inference & Watson Orchestrate...' : '⚡ Ingest & Run Real AI Diagnosis'}
            </button>
          </form>

          {/* Result Card */}
          {ingestResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Real Inference Complete for {ingestResult.asset_code}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  ingestResult.ml_inference?.risk_level === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                  ingestResult.ml_inference?.risk_level === 'High' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  Risk: {ingestResult.ml_inference?.risk_level} ({ingestResult.ml_inference?.failure_probability_pct}%)
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block">AI Diagnostic Directive ({ingestResult.engine_used}):</span>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {ingestResult.ai_orchestrator_decision}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bulk CSV Uploader & IoT API Gateway */}
        <div className="space-y-6">
          {/* CSV Uploader */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                Bulk CSV Dataset Importer
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Upload real SCADA logs, Kaggle wind/solar datasets, or sensor CSVs</p>
            </div>

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center transition bg-slate-950/40">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="hidden"
                  id="csv-upload-input"
                />
                <label htmlFor="csv-upload-input" className="cursor-pointer text-xs font-semibold text-emerald-400 hover:text-emerald-300 block">
                  {csvFile ? csvFile.name : 'Click to select CSV file or drag & drop here'}
                </label>
                <span className="text-[11px] text-slate-500 mt-1 block">Supports timestamp, asset_code, power_kw, vibration_mms, temp_c</span>
              </div>

              <button
                type="submit"
                disabled={!csvFile || csvLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <Upload className={`h-4 w-4 ${csvLoading ? 'animate-spin' : ''}`} />
                {csvLoading ? 'Parsing & Ingesting Dataset...' : 'Upload & Parse SCADA Dataset'}
              </button>
            </form>

            {csvResult && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {csvResult.message}
                </div>
                <div className="text-slate-300">
                  Rows Ingested: <strong className="text-white">{csvResult.rows_ingested}</strong> | Anomalies Detected: <strong className="text-rose-400">{csvResult.anomalies_flagged}</strong>
                </div>
              </div>
            )}
          </div>

          {/* IoT SCADA API Integration Snippet */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-purple-400" />
              Live Sensor API Gateway (Python / SCADA Stream)
            </h3>
            <p className="text-xs text-slate-400">
              Stream live telemetry from physical IoT devices or Raspberry Pi sensors into RenewAI:
            </p>

            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800">
{`import requests

url = "http://localhost:8000/api/ingest/telemetry"
payload = {
    "asset_code": "WT-021",
    "power_kw": 2100.0,
    "vibration_mms": 5.40,
    "component_temp_c": 78.6,
    "wind_speed_ms": 8.4
}
response = requests.post(url, json=payload)
print(response.json())`}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
}
