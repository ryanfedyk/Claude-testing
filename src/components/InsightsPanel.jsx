import { useMemo } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function InsightsPanel({ projection, params, monteCarloData }) {
  const insights = useMemo(() => {
    if (!projection || projection.length === 0) return [];

    const results = [];
    const retirementYear = projection.find(y => y.isRetired);
    const lastYear = projection[projection.length - 1];
    const runsOutYear = projection.find(y => y.ranOut);
    const retirementBalance = retirementYear?.totalBalance || 0;
    const retirementSpending = retirementYear?.annualSpending || 0;
    const withdrawalRate = retirementBalance > 0 ? (retirementSpending / retirementBalance) * 100 : 0;
    const successRate = monteCarloData?.successRate;

    // Critical: money runs out
    if (runsOutYear) {
      results.push({
        type: 'critical',
        title: 'Portfolio Depletion Risk',
        message: `Your portfolio is projected to run out at age ${runsOutYear.age}. Consider increasing savings, reducing spending, or delaying retirement.`,
        actions: [
          `Delay retirement by ${Math.min(5, Math.ceil((95 - runsOutYear.age) / 3))} years`,
          `Reduce retirement spending by ${formatCurrency(retirementSpending * 0.15, true)}/year`,
          `Increase current savings rate by 5%`,
        ],
      });
    }

    // Withdrawal rate check
    if (withdrawalRate > 5) {
      results.push({
        type: 'warning',
        title: 'High Withdrawal Rate',
        message: `Your initial withdrawal rate of ${formatPercent(withdrawalRate)} exceeds the commonly cited 4% rule. This increases the risk of running out of money.`,
        actions: [
          'Reduce first-year retirement spending',
          'Build a larger nest egg before retiring',
          'Consider a dynamic withdrawal strategy',
        ],
      });
    } else if (withdrawalRate > 0 && withdrawalRate <= 3.5) {
      results.push({
        type: 'positive',
        title: 'Conservative Withdrawal Rate',
        message: `Your ${formatPercent(withdrawalRate)} withdrawal rate is conservative. You may be able to spend more or retire earlier.`,
        actions: [],
      });
    }

    // Social Security optimization
    if (params.socialSecurityAge && params.socialSecurityAge < 67) {
      const earlyPenalty = Math.round((67 - params.socialSecurityAge) * 6.67);
      results.push({
        type: 'info',
        title: 'Early Social Security Claiming',
        message: `Claiming at age ${params.socialSecurityAge} reduces your benefit by ~${earlyPenalty}% compared to full retirement age. Each year you delay (up to 70) increases benefits by ~8%.`,
        actions: [
          `Delay to 67 for ~${earlyPenalty}% more monthly income`,
          'Delay to 70 for maximum benefit (~24% more than age 67)',
          'Use other savings to bridge the gap',
        ],
      });
    } else if (params.socialSecurityAge && params.socialSecurityAge >= 70) {
      results.push({
        type: 'positive',
        title: 'Maximized Social Security',
        message: 'Claiming at 70 gives you the maximum possible Social Security benefit with delayed retirement credits.',
        actions: [],
      });
    }

    // Roth conversion opportunity
    const traditionalBalance = (params.traditional401k || 0) + (params.traditionalIRA || 0);
    const rothBalance = (params.roth401k || 0) + (params.rothIRA || 0);
    if (traditionalBalance > 200000 && params.rothConversionStrategy === 'none') {
      results.push({
        type: 'info',
        title: 'Roth Conversion Opportunity',
        message: `You have ${formatCurrency(traditionalBalance, true)} in pre-tax accounts. Strategic Roth conversions before RMDs begin at 73 could reduce your lifetime tax burden.`,
        actions: [
          'Enable "Moderate" Roth conversion strategy',
          'Convert in years with lower income (e.g., early retirement)',
          'Consult a tax advisor for personalized strategy',
        ],
      });
    }

    // Healthcare costs warning
    if (params.currentAge < 65 && retirementYear) {
      const yearsBeforeMedicare = Math.max(0, 65 - params.retirementAge);
      if (yearsBeforeMedicare > 0) {
        results.push({
          type: 'warning',
          title: 'Pre-Medicare Healthcare Gap',
          message: `You'll need ${yearsBeforeMedicare} years of private healthcare before Medicare eligibility at 65. This can cost $15,000-$25,000/year per person.`,
          actions: [
            'Research ACA marketplace plans',
            'Consider COBRA coverage from employer',
            'Budget for health insurance premiums',
          ],
        });
      }
    }

    // Large taxable balance - tax-loss harvesting
    if (params.taxableBrokerage > 100000) {
      results.push({
        type: 'info',
        title: 'Tax-Loss Harvesting Opportunity',
        message: `With ${formatCurrency(params.taxableBrokerage, true)} in taxable accounts, tax-loss harvesting during market downturns can offset gains and reduce your tax bill.`,
        actions: [
          'Harvest losses during market corrections',
          'Use losses to offset up to $3,000/year of ordinary income',
          'Consider direct indexing for automated tax-loss harvesting',
        ],
      });
    }

    // Success rate insights
    if (successRate != null) {
      if (successRate >= 90) {
        results.push({
          type: 'positive',
          title: 'Strong Monte Carlo Results',
          message: `With a ${Math.round(successRate)}% success rate across 500 simulated market scenarios, your plan is robust even in adverse conditions.`,
          actions: [],
        });
      } else if (successRate < 70) {
        results.push({
          type: 'critical',
          title: 'Low Monte Carlo Success Rate',
          message: `Only ${Math.round(successRate)}% of simulated scenarios show your money lasting through retirement. Market volatility poses a significant risk.`,
          actions: [
            'Increase savings rate or reduce retirement spending',
            'Consider a more conservative asset allocation approaching retirement',
            'Build a larger cash buffer for sequence-of-returns risk',
          ],
        });
      }
    }

    // Legacy / estate
    if (lastYear.totalBalance > 500000 && !runsOutYear) {
      results.push({
        type: 'info',
        title: 'Estate Planning Consideration',
        message: `Your projected final balance of ${formatCurrency(lastYear.totalBalance, true)} at age ${lastYear.age} suggests significant wealth transfer. Consider estate planning strategies.`,
        actions: [
          'Review beneficiary designations',
          'Consider charitable giving strategies',
          'Explore trust structures for tax efficiency',
        ],
      });
    }

    return results;
  }, [projection, params, monteCarloData]);

  if (insights.length === 0) return null;

  const typeStyles = {
    critical: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-300',
      badge: 'bg-red-500/20 text-red-300',
      badgeText: 'Action Required',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-300',
      badgeText: 'Warning',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      icon: Lightbulb,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-300',
      badge: 'bg-blue-500/20 text-blue-300',
      badgeText: 'Tip',
    },
    positive: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-300',
      badgeText: 'On Track',
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={18} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">Expert Insights & Recommendations</h3>
      </div>
      {insights.map((insight, idx) => {
        const style = typeStyles[insight.type];
        const Icon = style.icon;

        return (
          <div
            key={idx}
            className={`rounded-2xl border p-4 ${style.border} ${style.bg} transition-all duration-300 hover:scale-[1.005]`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Icon size={18} className={style.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${style.titleColor}`}>{insight.title}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${style.badge}`}>
                    {style.badgeText}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{insight.message}</p>
                {insight.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {insight.actions.map((action, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ArrowRight size={10} className="text-slate-600 flex-shrink-0" />
                        {action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
