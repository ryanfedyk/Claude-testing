import { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import { formatCurrency, formatPercent } from '../utils/formatters';

const CHART_COLORS = {
  traditional401k: '#6366f1',
  roth401k: '#8b5cf6',
  traditionalIRA: '#3b82f6',
  rothIRA: '#06b6d4',
  taxableBrokerage: '#10b981',
  otherSavings: '#f59e0b',
  spending: '#ef4444',
  income: '#22c55e',
  ss: '#8b5cf6',
  pension: '#f97316',
  healthcare: '#ef4444',
};

function CustomTooltip({ active, payload, label, type = 'balance' }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-2xl shadow-black/40 max-w-xs">
      <p className="text-xs font-bold text-slate-300 mb-2">Age {label}</p>
      <div className="space-y-1">
        {payload.filter(p => p.value > 0).map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-slate-400">{entry.name}</span>
            </div>
            <span className="text-xs font-mono font-medium text-slate-200">
              {type === 'percent' ? formatPercent(entry.value) : formatCurrency(entry.value, true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BalanceChart({ projections, scenarios }) {
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked', 'total', 'compare'
  const hasMultipleScenarios = scenarios && scenarios.length > 1;

  const mainProjection = projections[0];
  if (!mainProjection || mainProjection.length === 0) return null;

  const retirementAge = mainProjection.find(y => y.isRetired)?.age;

  if (hasMultipleScenarios && viewMode === 'compare') {
    const compareData = mainProjection.map((_, idx) => {
      const point = { age: mainProjection[idx].age };
      projections.forEach((proj, sIdx) => {
        if (proj[idx]) {
          point[`scenario${sIdx}`] = proj[idx].totalBalance;
        }
      });
      return point;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Portfolio Balance Comparison</h3>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} showCompare={hasMultipleScenarios} />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={compareData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatCurrency(v, true)}
            />
            <Tooltip content={<CustomTooltip />} />
            {retirementAge && (
              <ReferenceLine x={retirementAge} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#f59e0b', fontSize: 11 }} />
            )}
            {scenarios.map((s, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`scenario${idx}`}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (viewMode === 'total') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Total Portfolio Balance</h3>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} showCompare={hasMultipleScenarios} />
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={mainProjection} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            {retirementAge && (
              <ReferenceLine x={retirementAge} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#f59e0b', fontSize: 11 }} />
            )}
            <Area type="monotone" dataKey="totalBalance" name="Total Balance" stroke="#6366f1" fill="url(#totalGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Stacked view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Portfolio Breakdown by Account</h3>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} showCompare={hasMultipleScenarios} />
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={mainProjection} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {Object.entries(CHART_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, true)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconType="circle"
            iconSize={8}
          />
          {retirementAge && (
            <ReferenceLine x={retirementAge} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Retire', fill: '#f59e0b', fontSize: 11 }} />
          )}
          <Area type="monotone" dataKey="traditional401k" name="401(k) Traditional" stackId="1" stroke={CHART_COLORS.traditional401k} fill={`url(#grad_traditional401k)`} />
          <Area type="monotone" dataKey="roth401k" name="401(k) Roth" stackId="1" stroke={CHART_COLORS.roth401k} fill={`url(#grad_roth401k)`} />
          <Area type="monotone" dataKey="traditionalIRA" name="Traditional IRA" stackId="1" stroke={CHART_COLORS.traditionalIRA} fill={`url(#grad_traditionalIRA)`} />
          <Area type="monotone" dataKey="rothIRA" name="Roth IRA" stackId="1" stroke={CHART_COLORS.rothIRA} fill={`url(#grad_rothIRA)`} />
          <Area type="monotone" dataKey="taxableBrokerage" name="Taxable Brokerage" stackId="1" stroke={CHART_COLORS.taxableBrokerage} fill={`url(#grad_taxableBrokerage)`} />
          <Area type="monotone" dataKey="otherSavings" name="Other Savings" stackId="1" stroke={CHART_COLORS.otherSavings} fill={`url(#grad_otherSavings)`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeExpenseChart({ projection }) {
  if (!projection || projection.length === 0) return null;

  const retirementData = projection.filter(y => y.isRetired);
  if (retirementData.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Retirement Income vs. Spending</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={retirementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, true)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
          <Bar dataKey="ssIncome" name="Social Security" fill={CHART_COLORS.ss} radius={[2, 2, 0, 0]} />
          <Bar dataKey="pensionIncome" name="Pension" fill={CHART_COLORS.pension} radius={[2, 2, 0, 0]} />
          <Line type="monotone" dataKey="annualSpending" name="Spending" stroke={CHART_COLORS.spending} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="healthcareCost" name="Healthcare" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonteCarloChart({ monteCarloData }) {
  if (!monteCarloData || !monteCarloData.percentileData) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">
        Monte Carlo Simulation
        <span className="text-xs font-normal text-slate-500 ml-2">(500 simulations)</span>
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={monteCarloData.percentileData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="mc_outer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="mc_mid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="mc_inner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, true)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="p5" name="5th Percentile" stroke="transparent" fill="transparent" />
          <Area type="monotone" dataKey="p95" name="95th %ile" stroke="#6366f130" fill="url(#mc_outer)" />
          <Area type="monotone" dataKey="p75" name="75th %ile" stroke="#6366f150" fill="url(#mc_mid)" />
          <Area type="monotone" dataKey="p25" name="25th %ile" stroke="#6366f170" fill="url(#mc_inner)" />
          <Line type="monotone" dataKey="p50" name="Median" stroke="#818cf8" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="p10" name="10th %ile" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          <ReferenceLine y={0} stroke="#64748b" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WithdrawalRateChart({ projection }) {
  if (!projection || projection.length === 0) return null;

  const retirementData = projection
    .filter(y => y.isRetired && y.totalBalance > 0)
    .map(y => ({
      ...y,
      withdrawalRate: y.totalBalance > 0 ? ((y.annualSpending - y.ssIncome - y.pensionIncome) / y.totalBalance) * 100 : 0,
    }));

  if (retirementData.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Withdrawal Rate Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={retirementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="age" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toFixed(1) + '%'} domain={[0, 'auto']} />
          <Tooltip content={<CustomTooltip type="percent" />} />
          <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '4% Rule', fill: '#f59e0b', fontSize: 11, position: 'right' }} />
          <Area
            type="monotone"
            dataKey="withdrawalRate"
            name="Withdrawal Rate"
            stroke="#8b5cf6"
            fill="#8b5cf620"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function ViewToggle({ viewMode, setViewMode, showCompare }) {
  return (
    <div className="flex gap-1 bg-slate-700/30 rounded-lg p-0.5">
      <button
        onClick={() => setViewMode('stacked')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
          ${viewMode === 'stacked' ? 'bg-slate-600 text-slate-200' : 'text-slate-400 hover:text-slate-300'}`}
      >
        Stacked
      </button>
      <button
        onClick={() => setViewMode('total')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
          ${viewMode === 'total' ? 'bg-slate-600 text-slate-200' : 'text-slate-400 hover:text-slate-300'}`}
      >
        Total
      </button>
      {showCompare && (
        <button
          onClick={() => setViewMode('compare')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
            ${viewMode === 'compare' ? 'bg-slate-600 text-slate-200' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Compare
        </button>
      )}
    </div>
  );
}
