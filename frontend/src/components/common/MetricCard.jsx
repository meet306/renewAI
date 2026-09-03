import React from 'react';

const MetricCard = ({
  title,
  value,
  unit = '',
  delta,
  deltaType = 'positive',
  subtext,
  icon: Icon,
  accentColor = 'emerald',
  badge
}) => {
  const accentGlow = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400',
    amber: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400',
    rose: 'border-rose-500/20 hover:border-rose-500/40 text-rose-400',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400',
    purple: 'border-purple-500/20 hover:border-purple-500/40 text-purple-400',
    blue: 'border-blue-500/20 hover:border-blue-500/40 text-blue-400'
  }[accentColor] || 'border-slate-700/50 hover:border-slate-600 text-slate-400';

  const iconBg = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }[accentColor] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className={`glass-panel glass-card-hover rounded-xl p-4 border transition-all duration-200 ${accentGlow}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
            {title}
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-800 border border-slate-700 text-slate-300 font-normal">
                {badge}
              </span>
            )}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(delta !== undefined || subtext) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {delta !== undefined ? (
            <span className={`inline-flex items-center gap-0.5 font-medium ${
              deltaType === 'positive' ? 'text-emerald-400' : (deltaType === 'negative' ? 'text-rose-400' : 'text-slate-400')
            }`}>
              <span>{deltaType === 'positive' ? '↑' : (deltaType === 'negative' ? '↓' : '•')}</span>
              <span>{delta}</span>
            </span>
          ) : <span />}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
