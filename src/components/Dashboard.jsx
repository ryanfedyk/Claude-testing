import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, Calendar, Heart, Percent } from 'lucide-react';
import { formatCurrency, formatPercent, getSuccessColor, getSuccessLabel } from '../utils/formatters';
import { calculateWithdrawalRate } from '../engine/retirementEngine';

function MetricCard({ icon: Icon, label, value, subvalue, color, highlight }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]
      ${highlight ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10' : 'border-slate-700/50 bg-slate-800/30'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
          <p className={`text-xl font-bold ${color || 'text-slate-100'}`}>{value}</p>
          {subvalue && <p className="text-xs text-slate-500 mt-1">{subvalue}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${highlight ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
          <Icon size={18} className={color || 'text-slate-400'} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ projection, monteCarloData, params }) {
  const metrics = useMemo(() => {
    if (!projection || projection.length === 0) return null;

    const retirementYear = projection.find(y => y.isRetired);
    const lastYear = projection[projection.length - 1];
    const peakBalance = Math.max(...projection.map(y => y.totalBalance));
    const peakAge = projection.find(y => y.totalBalance === peakBalance)?.age;
    const runsOutYear = projection.find(y => y.ranOut);

    const retirementBalance = retirementYear?.totalBalance || 0;
    const retirementSpending = retirementYear?.annualSpending || 0;
    const initialWithdrawalRate = calculateWithdrawalRate(retirementBalance, retirementSpending);

    // Years of retirement funded
    const yearsRetired = projection.filter(y => y.isRetired);
    const yearsFunded = yearsRetired.filter(y => y.totalBalance > 0).length;

    // Average annual spending in retirement
    const avgRetirementSpending = yearsRetired.length > 0
      ? yearsRetired.reduce((sum, y) => sum + y.annualSpending, 0) / yearsRetired.length
      : 0;

    // Total SS income over retirement
    const totalSS = yearsRetired.reduce((sum, y) => sum + y.ssIncome, 0);

    return {
      retirementBalance,
      retirementSpending,
      initialWithdrawalRate,
      peakBalance,
      peakAge,
      lastYearBalance: lastYear.totalBalance,
      runsOutAge: runsOutYear?.age || null,
      yearsFunded,
      totalYearsRetired: yearsRetired.length,
      avgRetirementSpending,
      totalSS,
      successRate: monteCarloData?.successRate || null,
    };
  }, [projection, monteCarloData]);

  if (!metrics) return null;

  const successColor = metrics.successRate != null ? getSuccessColor(metrics.successRate) : '#64748b';
  const successLabel = metrics.successRate != null ? getSuccessLabel(metrics.successRate) : 'N/A';

  return (
    <div className="space-y-4">
      {/* Success Rate Hero */}
      {metrics.successRate != null && (
        <div
          className="relative overflow-hidden rounded-2xl border p-6 text-center"
          style={{ borderColor: successColor + '40', background: successColor + '08' }}
        >
          <div className="absolute inset-0 opacity-5" style={{
            background: `radial-gradient(circle at 50% 0%, ${successColor}, transparent 70%)`
          }} />
          <div className="relative">
            <p className="text-xs font-medium text-slate-400 mb-2">Monte Carlo Success Rate</p>
            <div className="flex items-center justify-center gap-3">
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${successColor} ${metrics.successRate * 3.6}deg, #1e293b ${metrics.successRate * 3.6}deg)`,
                }}
              >
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-2xl font-black" style={{ color: successColor }}>
                    {Math.round(metrics.successRate)}%
                  </span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-lg font-bold" style={{ color: successColor }}>{successLabel}</p>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  {metrics.successRate >= 85
                    ? 'Your plan has a strong probability of lasting through retirement.'
                    : metrics.successRate >= 60
                      ? 'Consider adjusting spending or retirement age to improve odds.'
                      : 'Significant changes needed. Explore the scenario controls below.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={DollarSign}
          label="Balance at Retirement"
          value={formatCurrency(metrics.retirementBalance, true)}
          subvalue={`Age ${params.retirementAge}`}
          color="text-blue-400"
          highlight
        />
        <MetricCard
          icon={TrendingUp}
          label="Peak Balance"
          value={formatCurrency(metrics.peakBalance, true)}
          subvalue={`Reached at age ${metrics.peakAge}`}
          color="text-emerald-400"
        />
        <MetricCard
          icon={Percent}
          label="Initial Withdrawal Rate"
          value={formatPercent(metrics.initialWithdrawalRate)}
          subvalue={metrics.initialWithdrawalRate > 4 ? 'Above 4% rule guideline' : 'Within safe range'}
          color={metrics.initialWithdrawalRate > 4 ? 'text-amber-400' : 'text-emerald-400'}
        />
        <MetricCard
          icon={metrics.runsOutAge ? AlertTriangle : Shield}
          label={metrics.runsOutAge ? 'Runs Out At' : 'Final Balance'}
          value={metrics.runsOutAge ? `Age ${metrics.runsOutAge}` : formatCurrency(metrics.lastYearBalance, true)}
          subvalue={metrics.runsOutAge ? 'Money depleted before end of plan' : `At age ${params.lifeExpectancy || 95}`}
          color={metrics.runsOutAge ? 'text-red-400' : 'text-emerald-400'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={Calendar}
          label="Years Funded"
          value={`${metrics.yearsFunded} / ${metrics.totalYearsRetired}`}
          subvalue="Years of retirement covered"
          color="text-purple-400"
        />
        <MetricCard
          icon={DollarSign}
          label="Avg Retirement Spending"
          value={formatCurrency(metrics.avgRetirementSpending, true)}
          subvalue="Per year (inflation adjusted)"
          color="text-slate-300"
        />
        <MetricCard
          icon={Heart}
          label="Lifetime Social Security"
          value={formatCurrency(metrics.totalSS, true)}
          subvalue="Total SS income in retirement"
          color="text-indigo-400"
        />
        <MetricCard
          icon={TrendingDown}
          label="Retirement Spending"
          value={formatCurrency(metrics.retirementSpending, true)}
          subvalue="First year spending (year 1)"
          color="text-orange-400"
        />
      </div>
    </div>
  );
}
