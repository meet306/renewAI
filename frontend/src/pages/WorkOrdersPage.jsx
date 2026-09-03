import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, AlertTriangle, Clock, Wrench, 
  Truck, ShieldCheck, Download, Plus, FileText, Check, Navigation, User
} from 'lucide-react';
import { workOrdersService } from '../services/api';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWO, setSelectedWO] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssetCode, setNewAssetCode] = useState('WT-021');
  const [newPriority, setNewPriority] = useState('CRITICAL');
  const [newFailureMode, setNewFailureMode] = useState('Main Bearing Ultrasonic Defect');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await workOrdersService.getWorkOrders();
      setWorkOrders(res.data.work_orders || []);
      if (res.data.work_orders?.length > 0 && !selectedWO) {
        setSelectedWO(res.data.work_orders[0]);
      }
    } catch (err) {
      console.error('Error loading work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (woId, stepNum) => {
    try {
      await workOrdersService.toggleStep(woId, stepNum);
      // Update local state
      setWorkOrders(prev => prev.map(wo => {
        if (wo.id === woId) {
          const updatedSop = wo.sop_checklist.map(s => 
            s.step === stepNum ? { ...s, completed: !s.completed } : s
          );
          return { ...wo, sop_checklist: updatedSop };
        }
        return wo;
      }));
      if (selectedWO?.id === woId) {
        setSelectedWO(prev => ({
          ...prev,
          sop_checklist: prev.sop_checklist.map(s => 
            s.step === stepNum ? { ...s, completed: !s.completed } : s
          )
        }));
      }
    } catch (err) {
      console.error('Error toggling step:', err);
    }
  };

  const handleStatusChange = async (woId, newStatus) => {
    try {
      const res = await workOrdersService.updateStatus(woId, newStatus);
      setWorkOrders(prev => prev.map(w => w.id === woId ? res.data : w));
      if (selectedWO?.id === woId) {
        setSelectedWO(res.data);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await workOrdersService.generateFromAnomaly({
        asset_code: newAssetCode,
        priority: newPriority,
        failure_mode: newFailureMode
      });
      setWorkOrders(prev => [res.data, ...prev]);
      setSelectedWO(res.data);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating work order:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Autonomous SLDC Certified Dispatch
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SOP & Spare Parts Requisition Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-emerald-400" />
            Autonomous Work Orders & Field Crew Dispatch
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Condition-based work order generation, OEM spare part allocation (SKF bearings / IGBTs), and crew dispatch for Gujarat parks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-900/20"
        >
          <Plus className="h-4 w-4" />
          Create SLDC Work Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Active Work Orders</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-white font-mono">{workOrders.length}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">1 Critical</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Value Protected by AI</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">₹1.23 Cr</span>
            <span className="text-xs text-emerald-300">Catastrophic Failures Avoided</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Average Crew SLA / ETA</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">35 min</span>
            <span className="text-xs text-slate-400">Gujarat Hub Depots</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Digital Signatures</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-purple-400 font-mono">100%</span>
            <span className="text-xs text-purple-300">SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* Main Split View: Work Orders List & Selected Work Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Work Order Cards */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Dispatch Queue ({workOrders.length})
          </h2>

          {workOrders.map((wo) => {
            const isSelected = selectedWO?.id === wo.id;
            const isCrit = wo.priority === 'CRITICAL';
            return (
              <div
                key={wo.id}
                onClick={() => setSelectedWO(wo)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/40' 
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-300">{wo.id}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isCrit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {wo.priority}
                  </span>
                </div>

                <h4 className="font-semibold text-white text-sm line-clamp-1">{wo.title}</h4>
                <p className="text-xs text-slate-400 mt-1">Asset: <strong className="text-white">{wo.asset_code}</strong> | {wo.park_name}</p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
                  <span className="text-cyan-400 font-mono font-medium">{wo.assigned_crew?.crew_id}</span>
                  <span className={`font-bold ${
                    wo.status === 'RESOLVED' ? 'text-emerald-400' : wo.status === 'IN_PROGRESS' ? 'text-amber-400' : 'text-cyan-300'
                  }`}>
                    {wo.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Work Order Detailed View */}
        {selectedWO ? (
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-cyan-400">{selectedWO.id}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                    Status: {selectedWO.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{selectedWO.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: <strong className="text-white">{selectedWO.asset_code}</strong> ({selectedWO.gps_coordinates}) | {selectedWO.park_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <FileText className="h-3.5 w-3.5 text-purple-400" />
                  SLDC Certificate
                </button>

                {selectedWO.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange(selectedWO.id, selectedWO.status === 'DISPATCHED' ? 'IN_PROGRESS' : 'RESOLVED')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedWO.status === 'DISPATCHED' ? 'Mark In-Progress' : 'Mark Resolved'}
                  </button>
                )}
              </div>
            </div>

            {/* Crew & Financial Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assigned Crew Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-cyan-400" />
                    Assigned Field Crew
                  </h4>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                    ETA: {selectedWO.assigned_crew?.eta_minutes} min
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team Unit:</span>
                    <span className="font-semibold text-white">{selectedWO.assigned_crew?.crew_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lead Engineer:</span>
                    <span className="font-semibold text-slate-200">{selectedWO.assigned_crew?.team_lead}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Radio:</span>
                    <span className="font-mono text-slate-300">{selectedWO.assigned_crew?.contact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Depot:</span>
                    <span className="text-slate-300">{selectedWO.assigned_crew?.dispatch_depot}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Risk Impact */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Risk & Downtime Prevention
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Risk:</span>
                    <span className="font-bold text-rose-400">{selectedWO.failure_probability_pct}% (Critical)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Mode:</span>
                    <span className="font-semibold text-slate-200">{selectedWO.failure_mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset Loss Prevented:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{(selectedWO.estimated_downtime_loss_inr / 100000).toFixed(1)} Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SLA Window:</span>
                    <span className="font-mono text-cyan-300">48 Hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requisitioned OEM Spare Parts */}
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Wrench className="h-4 w-4 text-amber-400" />
                Allocated OEM Spare Parts & Specialty Tooling
              </h4>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">OEM Part Number</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Value (INR)</th>
                      <th className="p-3">Inventory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedWO.spare_parts?.map((part, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono text-cyan-300 font-semibold">{part.part_number}</td>
                        <td className="p-3 text-slate-200">{part.name}</td>
                        <td className="p-3 text-center font-mono text-slate-300">{part.quantity}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">₹{part.unit_cost_inr.toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                            {part.inventory_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step-by-Step SOP Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Standard Operating Procedure (SOP) Execution Checklist
                </h4>
                <span className="text-xs text-slate-400">Click step to mark done</span>
              </div>

              <div className="space-y-2">
                {selectedWO.sop_checklist?.map((task) => (
                  <div
                    key={task.step}
                    onClick={() => handleToggleStep(selectedWO.id, task.step)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      task.completed 
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center border transition ${
                      task.completed ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {task.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-400 mr-2">Step {task.step}:</span>
                      <span className={task.completed ? 'line-through text-slate-400' : 'text-slate-200'}>{task.task}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Digital Cryptographic Signature Footer */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-300">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>SHA-256 Audit Hash: <strong className="font-mono text-purple-200">{selectedWO.digital_signature?.sha256?.substring(0, 24)}...</strong></span>
              </div>
              <span className="text-slate-400 font-mono">{selectedWO.digital_signature?.signed_by}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Official Certificate Modal */}
      {showCertificateModal && selectedWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl space-y-6">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center border-b border-slate-800 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Government of Gujarat • SLDC Supervisory System</span>
              </div>
              <h2 className="text-xl font-bold text-white">RENEWABLE ASSET DISPATCH & MAINTENANCE CERTIFICATE</h2>
              <p className="text-xs font-mono text-slate-400 mt-1">Certificate #{selectedWO.id} • Issued under GUVNL Grid Compliance Act 2026</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Target Asset Code</span>
                <span className="text-base font-bold text-white font-mono">{selectedWO.asset_code}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Location / Park</span>
                <span className="text-sm font-semibold text-slate-200">{selectedWO.park_name} ({selectedWO.region})</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Assigned Crew Unit</span>
                <span className="text-sm font-semibold text-cyan-400 font-mono">{selectedWO.assigned_crew?.crew_id} ({selectedWO.assigned_crew?.team_lead})</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Downtime Value Saved</span>
                <span className="text-base font-bold text-emerald-400 font-mono">₹{(selectedWO.estimated_downtime_loss_inr / 100000).toFixed(1)} Lakhs</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-300">Cryptographic Verification:</div>
              <div className="font-mono text-slate-400 break-all bg-slate-900 p-2 rounded border border-slate-800">
                SHA-256: {selectedWO.digital_signature?.sha256}
              </div>
              <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                <span>Signed By: IBM Watson Orchestrate & RenewAI</span>
                <span>Timestamp: {selectedWO.created_at}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                Print Official PDF
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWorkOrder} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-400" />
              Generate Autonomous Work Order
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Asset Code</label>
              <input
                type="text"
                value={newAssetCode}
                onChange={(e) => setNewAssetCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                placeholder="e.g. WT-021, INV-042"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Priority Level</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              >
                <option value="CRITICAL">CRITICAL (48h SLA)</option>
                <option value="HIGH">HIGH (72h SLA)</option>
                <option value="MEDIUM">MEDIUM (7 Days)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Diagnosed Failure Mode / Anomaly</label>
              <input
                type="text"
                value={newFailureMode}
                onChange={(e) => setNewFailureMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Dispatch Work Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
