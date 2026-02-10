import { useState, useMemo } from 'react';
import { getRequiredFields } from '../engine/retirementEngine';
import { ChevronDown, ChevronUp, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const CATEGORY_LABELS = {
  personal: { label: 'Personal Information', icon: '👤', description: 'Basic demographic details' },
  income: { label: 'Income & Expenses', icon: '💰', description: 'Current earnings and spending' },
  accounts: { label: 'Account Balances', icon: '🏦', description: 'Retirement and investment accounts' },
  retirement_income: { label: 'Retirement Income', icon: '🏖️', description: 'Expected income sources in retirement' },
  assumptions: { label: 'Market Assumptions', icon: '📈', description: 'Growth and inflation expectations' },
  advanced: { label: 'Advanced Planning', icon: '⚙️', description: 'Optional advanced scenarios' },
};

const TOOLTIPS = {
  currentAge: 'Your current age in years',
  retirementAge: 'The age you plan to stop working full-time',
  lifeExpectancy: 'Plan to age 95 for safety; adjust based on health and family history',
  annualIncome: 'Your total annual gross income before taxes',
  annualExpenses: 'Total annual spending including housing, food, transportation, etc.',
  annualSavingsRate: 'What percentage of gross income you save annually',
  traditional401k: 'Pre-tax 401(k) balance from your employer plan',
  roth401k: 'After-tax Roth 401(k) balance',
  traditionalIRA: 'Pre-tax Traditional IRA balance',
  rothIRA: 'After-tax Roth IRA balance (grows tax-free)',
  taxableBrokerage: 'Non-retirement investment account balance',
  otherSavings: 'Cash, CDs, money market, emergency fund',
  pension: 'If you have a pension, the expected annual benefit',
  socialSecurityAge: 'Age you plan to start collecting (62-70). Delaying increases benefits ~8%/year.',
  estimatedSSMonthly: 'Check ssa.gov/myaccount for your estimate. Leave blank to auto-estimate.',
  annualRetirementSpending: 'Target annual spending in retirement. Rule of thumb: 70-80% of current expenses.',
  nominalReturn: 'Historical average: 7% stocks, 5% balanced. Pre-inflation.',
  inflationRate: 'Historical average: ~2.5-3%. Reduces purchasing power over time.',
  rothConversionStrategy: 'Converting Traditional to Roth in low-tax years can reduce future RMDs.',
  partTimeIncome: 'Income from part-time work during early retirement',
  partTimeEndAge: 'Age when you stop part-time work entirely',
  rentalIncome: 'Annual income from rental properties',
  annuityIncome: 'Annual income from annuity contracts',
  healthcareCostStart: 'Estimated annual healthcare cost starting at age 55 (pre-Medicare)',
};

export default function Questionnaire({ data, onUpdate, missingRequired }) {
  const fields = getRequiredFields();
  const [expandedCategories, setExpandedCategories] = useState({
    personal: true,
    income: true,
    accounts: true,
    retirement_income: false,
    assumptions: false,
    advanced: false,
  });
  const [showTooltip, setShowTooltip] = useState(null);

  const groupedFields = useMemo(() => {
    const groups = {};
    for (const field of fields) {
      if (!groups[field.category]) groups[field.category] = [];
      groups[field.category].push(field);
    }
    return groups;
  }, []);

  const categoryStatus = useMemo(() => {
    const status = {};
    for (const [cat, catFields] of Object.entries(groupedFields)) {
      const required = catFields.filter(f => f.required);
      const filledRequired = required.filter(f => data[f.key] != null && data[f.key] !== '');
      const optional = catFields.filter(f => !f.required);
      const filledOptional = optional.filter(f => data[f.key] != null && data[f.key] !== '' && data[f.key] !== 0);

      status[cat] = {
        requiredFilled: filledRequired.length,
        requiredTotal: required.length,
        optionalFilled: filledOptional.length,
        optionalTotal: optional.length,
        complete: filledRequired.length === required.length,
      };
    }
    return status;
  }, [data, groupedFields]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleChange = (key, value, type) => {
    let parsed = value;
    if (type === 'number' || type === 'currency' || type === 'percentage') {
      const cleaned = String(value).replace(/[$,%\s]/g, '');
      parsed = cleaned === '' ? '' : parseFloat(cleaned);
      if (isNaN(parsed)) parsed = '';
    }
    onUpdate(key, parsed);
  };

  const renderField = (field) => {
    const value = data[field.key];
    const isMissing = missingRequired.includes(field.key);
    const displayValue = value != null && value !== '' ? value : '';

    return (
      <div key={field.key} className="relative group">
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-sm font-medium text-slate-300">
            {field.label}
            {field.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <button
            className="text-slate-500 hover:text-slate-300 transition-colors"
            onMouseEnter={() => setShowTooltip(field.key)}
            onMouseLeave={() => setShowTooltip(null)}
            onClick={(e) => { e.preventDefault(); setShowTooltip(showTooltip === field.key ? null : field.key); }}
          >
            <HelpCircle size={14} />
          </button>
          {showTooltip === field.key && TOOLTIPS[field.key] && (
            <div className="absolute z-50 top-0 left-full ml-2 w-64 p-3 bg-slate-700 text-xs text-slate-200 rounded-lg shadow-xl border border-slate-600">
              {TOOLTIPS[field.key]}
            </div>
          )}
        </div>

        {field.type === 'select' ? (
          <select
            value={displayValue}
            onChange={(e) => handleChange(field.key, e.target.value, field.type)}
            className={`w-full px-3 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all
              ${isMissing ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-slate-600'}`}
          >
            <option value="">Select...</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <div className="relative">
            {field.type === 'currency' && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            )}
            <input
              type="text"
              inputMode="decimal"
              value={displayValue}
              placeholder={field.default != null ? `Default: ${field.default}` : ''}
              onChange={(e) => handleChange(field.key, e.target.value, field.type)}
              className={`w-full px-3 py-2.5 bg-slate-800 border rounded-xl text-sm text-slate-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all
                ${field.type === 'currency' ? 'pl-7' : ''}
                ${field.type === 'percentage' ? 'pr-7' : ''}
                ${isMissing ? 'border-red-500/50 ring-1 ring-red-500/30' : 'border-slate-600'}`}
            />
            {field.type === 'percentage' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
            )}
          </div>
        )}
        {isMissing && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle size={12} /> Required field
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(groupedFields).map(([category, catFields]) => {
        const catInfo = CATEGORY_LABELS[category];
        const status = categoryStatus[category];
        const isExpanded = expandedCategories[category];

        return (
          <div
            key={category}
            className={`rounded-2xl border transition-all duration-300
              ${isExpanded ? 'border-slate-600 bg-slate-800/30' : 'border-slate-700/50 bg-slate-800/10 hover:bg-slate-800/20'}`}
          >
            <button
              className="w-full flex items-center justify-between p-4"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{catInfo.icon}</span>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-slate-200">{catInfo.label}</h3>
                  <p className="text-xs text-slate-500">{catInfo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {status.complete ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} />
                    Complete
                  </span>
                ) : status.requiredTotal > 0 ? (
                  <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                    {status.requiredFilled}/{status.requiredTotal} required
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-700/30 px-2 py-1 rounded-full">
                    {status.optionalFilled}/{status.optionalTotal} filled
                  </span>
                )}
                {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catFields.map(renderField)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
