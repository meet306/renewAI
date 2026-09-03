import React from 'react';

const StatusBadge = ({ status, size = 'md', pulse = true }) => {
  const normalized = (status || 'healthy').toLowerCase();

  const configs = {
    healthy: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      pulseClass: 'pulse-emerald',
      label: 'Healthy'
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      pulseClass: '',
      label: 'Warning'
    },
    critical: {
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/40',
      text: 'text-rose-400',
      dot: 'bg-rose-500',
      pulseClass: 'pulse-rose',
      label: 'Critical'
    },
    maintenance: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      pulseClass: '',
      label: 'Maintenance'
    },
    offline: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      pulseClass: '',
      label: 'Offline'
    }
  };

  const config = configs[normalized] || configs.healthy;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : (size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? config.pulseClass : ''}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
