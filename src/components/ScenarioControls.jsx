import { useState } from 'react';
import { SlidersHorizontal, RotateCcw, Copy, Trash2, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const SLIDER_CONFIG = [
  { key: 'retirementAge', label: 'Retirement Age', min: 50, max: 80, step: 1, format: (v) => v },
  { key: 'annualRetirementSpending', label: 'Annual Retirement Spending', min: 20000, max: 300000, step: 5000, format: (v) => formatCurrency(v) },
  { key: 'nominalReturn', label: 'Investment Return', min: 0.02, max: 0.12, step: 0.005, format: (v) => (v * 100).toFixed(1) + '%' },
  { key: 'inflationRate', label: 'Inflation Rate', min: 0.01, max: 0.06, step: 0.005, format: (v) => (v * 100).toFixed(1) + '%' },
  { key: 'socialSecurityAge', label: 'Social Security Claim Age', min: 62, max: 70, step: 1, format: (v) => v },
  { key: 'lifeExpectancy', label: 'Plan Until Age', min: 80, max: 105, step: 1, format: (v) => v },
  { key: 'annualSavingsRate', label: 'Savings Rate', min: 0, max: 60, step: 1, format: (v) => v + '%' },
];

export default function ScenarioControls({ scenarios, activeScenario, onUpdateScenario, onAddScenario, onRemoveScenario, onSetActive }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentData = scenarios[activeScenario]?.data;

  if (!currentData) return null;

  const handleSliderChange = (key, value) => {
    onUpdateScenario(activeScenario, { [key]: parseFloat(value) });
  };

  const getSliderPercent = (config) => {
    const value = currentData[config.key] ?? config.min;
    return ((value - config.min) / (config.max - config.min)) * 100;
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Scenario Tabs */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-700/50 bg-slate-800/80 overflow-x-auto">
        {scenarios.map((scenario, idx) => (
          <button
            key={idx}
            onClick={() => onSetActive(idx)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${idx === activeScenario
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: scenario.color }}
            />
            {scenario.name}
            {scenarios.length > 1 && idx === activeScenario && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveScenario(idx); }}
                className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </button>
        ))}
        {scenarios.length < 4 && (
          <button
            onClick={onAddScenario}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 transition-all"
          >
            <PlusCircle size={14} />
            Compare
          </button>
        )}
      </div>

      {/* Toggle Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Scenario Adjustments</span>
        </div>
        <span className="text-xs text-slate-500">{isExpanded ? 'Collapse' : 'Expand'}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-5">
          {SLIDER_CONFIG.map(config => {
            const value = currentData[config.key] ?? config.min;
            const percent = getSliderPercent(config);

            return (
              <div key={config.key}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-400">{config.label}</label>
                  <span className="text-sm font-bold text-slate-200 bg-slate-700/50 px-2 py-0.5 rounded-md font-mono">
                    {config.format(value)}
                  </span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-150"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value}
                    onChange={(e) => handleSliderChange(config.key, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-blue-500/30 border-2 border-blue-400 pointer-events-none transition-all duration-150"
                    style={{ left: `calc(${percent}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-slate-600">{config.format(config.min)}</span>
                  <span className="text-[10px] text-slate-600">{config.format(config.max)}</span>
                </div>
              </div>
            );
          })}

          {/* Roth Conversion Strategy */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Roth Conversion Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {['none', 'moderate', 'aggressive'].map(strategy => (
                <button
                  key={strategy}
                  onClick={() => onUpdateScenario(activeScenario, { rothConversionStrategy: strategy })}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${currentData.rothConversionStrategy === strategy
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-700/30 text-slate-400 border border-slate-700 hover:bg-slate-700/50'
                    }`}
                >
                  {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateScenario(activeScenario, {
                  nominalReturn: 0.05,
                  inflationRate: 0.035,
                })}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
              >
                🐻 Conservative
              </button>
              <button
                onClick={() => onUpdateScenario(activeScenario, {
                  nominalReturn: 0.09,
                  inflationRate: 0.02,
                })}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                🐂 Optimistic
              </button>
              <button
                onClick={() => onUpdateScenario(activeScenario, {
                  nominalReturn: 0.04,
                  inflationRate: 0.045,
                })}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                🌩️ Stagflation
              </button>
              <button
                onClick={() => onUpdateScenario(activeScenario, {
                  nominalReturn: 0.07,
                  inflationRate: 0.025,
                })}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
              >
                📊 Historical Avg
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
