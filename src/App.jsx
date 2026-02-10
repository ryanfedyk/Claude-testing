import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { generateProjection, runMonteCarloSimulation, getRequiredFields, estimateAIME, calculateSocialSecurity } from './engine/retirementEngine';
import FileUpload from './components/FileUpload';
import Questionnaire from './components/Questionnaire';
import ScenarioControls from './components/ScenarioControls';
import Dashboard from './components/Dashboard';
import { BalanceChart, IncomeExpenseChart, MonteCarloChart, WithdrawalRateChart } from './components/Charts';
import InsightsPanel from './components/InsightsPanel';
import YearlyTable from './components/YearlyTable';
import { Upload, ClipboardList, BarChart3, ChevronRight, RotateCcw } from 'lucide-react';

const SCENARIO_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const DEFAULT_DATA = {
  currentAge: '',
  retirementAge: '',
  lifeExpectancy: 95,
  filingStatus: 'single',
  annualIncome: '',
  annualExpenses: '',
  annualSavingsRate: '',
  traditional401k: 0,
  roth401k: 0,
  traditionalIRA: 0,
  rothIRA: 0,
  taxableBrokerage: 0,
  otherSavings: 0,
  pension: 0,
  socialSecurityAge: 67,
  estimatedSSMonthly: 0,
  annualRetirementSpending: '',
  nominalReturn: 0.07,
  inflationRate: 0.025,
  rothConversionStrategy: 'none',
  partTimeIncome: 0,
  partTimeEndAge: 0,
  rentalIncome: 0,
  annuityIncome: 0,
  healthcareCostStart: 12000,
};

function App() {
  const [step, setStep] = useState('upload'); // 'upload', 'questionnaire', 'results'
  const [formData, setFormData] = useState({ ...DEFAULT_DATA });
  const [scenarios, setScenarios] = useState([
    { name: 'Base Plan', color: SCENARIO_COLORS[0], data: { ...DEFAULT_DATA } },
  ]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [missingRequired, setMissingRequired] = useState([]);
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [isRunningMC, setIsRunningMC] = useState(false);
  const resultsRef = useRef(null);

  // Handle file upload data
  const handleDataParsed = useCallback((parsed) => {
    setFormData(prev => {
      const newData = { ...prev };
      for (const [key, value] of Object.entries(parsed)) {
        newData[key] = value;
      }
      return newData;
    });
    setScenarios(prev => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        data: { ...updated[0].data, ...parsed },
      };
      return updated;
    });
    setStep('questionnaire');
  }, []);

  // Update form field
  const handleFieldUpdate = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setScenarios(prev => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        data: { ...updated[0].data, [key]: value },
      };
      return updated;
    });
    setMissingRequired(prev => prev.filter(k => k !== key));
  }, []);

  // Validate required fields
  const validateAndProceed = useCallback(() => {
    const required = getRequiredFields().filter(f => f.required);
    const missing = required.filter(f => {
      const val = formData[f.key];
      return val === '' || val == null;
    }).map(f => f.key);

    if (missing.length > 0) {
      setMissingRequired(missing);
      return;
    }

    // Auto-estimate Social Security if not provided
    if (!formData.estimatedSSMonthly || formData.estimatedSSMonthly === 0) {
      const yearsWorked = Math.max(0, (formData.retirementAge || 67) - 22);
      const aime = estimateAIME(formData.annualIncome || 0, yearsWorked);
      const ssBenefit = calculateSocialSecurity(aime, formData.socialSecurityAge || 67);
      setFormData(prev => ({ ...prev, estimatedSSMonthly: Math.round(ssBenefit) }));
      setScenarios(prev => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          data: { ...updated[0].data, estimatedSSMonthly: Math.round(ssBenefit) },
        };
        return updated;
      });
    }

    // Auto-estimate retirement spending if not provided
    if (!formData.annualRetirementSpending) {
      const estimated = Math.round((formData.annualExpenses || 50000) * 0.8);
      setFormData(prev => ({ ...prev, annualRetirementSpending: estimated }));
      setScenarios(prev => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          data: { ...updated[0].data, annualRetirementSpending: estimated },
        };
        return updated;
      });
    }

    setStep('results');
  }, [formData]);

  // Generate projections for all scenarios
  const projections = useMemo(() => {
    if (step !== 'results') return [];
    return scenarios.map(scenario => {
      const params = { ...formData, ...scenario.data };
      // Ensure percentage fields are in decimal form
      if (params.nominalReturn > 1) params.nominalReturn = params.nominalReturn / 100;
      if (params.inflationRate > 1) params.inflationRate = params.inflationRate / 100;
      return generateProjection(params);
    });
  }, [scenarios, formData, step]);

  // Update scenario
  const handleUpdateScenario = useCallback((idx, updates) => {
    setScenarios(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        data: { ...updated[idx].data, ...updates },
      };
      return updated;
    });
  }, []);

  // Add scenario
  const handleAddScenario = useCallback(() => {
    setScenarios(prev => {
      const baseData = prev[0].data;
      const idx = prev.length;
      return [...prev, {
        name: `Scenario ${idx + 1}`,
        color: SCENARIO_COLORS[idx % SCENARIO_COLORS.length],
        data: { ...baseData },
      }];
    });
  }, []);

  // Remove scenario
  const handleRemoveScenario = useCallback((idx) => {
    setScenarios(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated;
    });
    setActiveScenario(prev => Math.min(prev, scenarios.length - 2));
  }, [scenarios.length]);

  // Run Monte Carlo
  const runMonteCarlo = useCallback(() => {
    setIsRunningMC(true);
    // Use setTimeout to not block the UI
    setTimeout(() => {
      const params = { ...formData, ...scenarios[0].data };
      if (params.nominalReturn > 1) params.nominalReturn = params.nominalReturn / 100;
      if (params.inflationRate > 1) params.inflationRate = params.inflationRate / 100;
      const result = runMonteCarloSimulation(params, 500);
      setMonteCarloData(result);
      setIsRunningMC(false);
    }, 50);
  }, [formData, scenarios]);

  // Auto-run Monte Carlo when results are shown
  useEffect(() => {
    if (step === 'results' && !monteCarloData && !isRunningMC) {
      runMonteCarlo();
    }
  }, [step, monteCarloData, isRunningMC, runMonteCarlo]);

  // Re-run Monte Carlo when base scenario changes
  useEffect(() => {
    if (step === 'results') {
      setMonteCarloData(null);
    }
  }, [scenarios[0]?.data?.retirementAge, scenarios[0]?.data?.annualRetirementSpending,
      scenarios[0]?.data?.nominalReturn, scenarios[0]?.data?.inflationRate,
      scenarios[0]?.data?.socialSecurityAge, scenarios[0]?.data?.annualSavingsRate]);

  const activeParams = { ...formData, ...scenarios[activeScenario]?.data };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Retirement Planner Pro
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Advanced scenario modeling & Monte Carlo analysis</p>
            </div>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              {[
                { key: 'upload', label: 'Upload', icon: Upload },
                { key: 'questionnaire', label: 'Details', icon: ClipboardList },
                { key: 'results', label: 'Analysis', icon: BarChart3 },
              ].map((s, idx) => {
                const isActive = s.key === step;
                const isPast = ['upload', 'questionnaire', 'results'].indexOf(step) > idx;
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    {idx > 0 && <ChevronRight size={14} className="text-slate-600" />}
                    <button
                      onClick={() => {
                        if (isPast || isActive) setStep(s.key);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${isActive
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : isPast
                            ? 'text-slate-400 hover:text-slate-200 cursor-pointer'
                            : 'text-slate-600 cursor-default'
                        }`}
                    >
                      <s.icon size={14} />
                      {s.label}
                    </button>
                  </div>
                );
              })}
            </div>

            {step === 'results' && (
              <button
                onClick={() => {
                  setStep('upload');
                  setFormData({ ...DEFAULT_DATA });
                  setScenarios([{ name: 'Base Plan', color: SCENARIO_COLORS[0], data: { ...DEFAULT_DATA } }]);
                  setActiveScenario(0);
                  setMonteCarloData(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <RotateCcw size={14} />
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Start Your Retirement Plan</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Upload your financial data in CSV or image format, or skip to enter details manually.
              </p>
            </div>

            <FileUpload onDataParsed={handleDataParsed} />

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <button
              onClick={() => setStep('questionnaire')}
              className="w-full py-3 px-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all"
            >
              Enter details manually
            </button>
          </div>
        )}

        {/* Step: Questionnaire */}
        {step === 'questionnaire' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Complete Your Financial Profile</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Fill in the required fields below. Expand optional sections for more precise planning.
              </p>
            </div>

            <Questionnaire
              data={formData}
              onUpdate={handleFieldUpdate}
              missingRequired={missingRequired}
            />

            {missingRequired.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
                Please fill in all required fields marked with *
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
              >
                Back
              </button>
              <button
                onClick={validateAndProceed}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/20 transition-all"
              >
                Generate Retirement Plan
              </button>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && projections.length > 0 && (
          <div className="space-y-6" ref={resultsRef}>
            {/* Dashboard Metrics */}
            <Dashboard
              projection={projections[activeScenario]}
              monteCarloData={activeScenario === 0 ? monteCarloData : null}
              params={activeParams}
            />

            {/* Controls + Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left: Scenario Controls */}
              <div className="xl:col-span-4 space-y-6">
                <ScenarioControls
                  scenarios={scenarios}
                  activeScenario={activeScenario}
                  onUpdateScenario={handleUpdateScenario}
                  onAddScenario={handleAddScenario}
                  onRemoveScenario={handleRemoveScenario}
                  onSetActive={setActiveScenario}
                />

                {/* Insights */}
                <InsightsPanel
                  projection={projections[activeScenario]}
                  params={activeParams}
                  monteCarloData={activeScenario === 0 ? monteCarloData : null}
                />
              </div>

              {/* Right: Charts */}
              <div className="xl:col-span-8 space-y-6">
                {/* Main Balance Chart */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                  <BalanceChart projections={projections} scenarios={scenarios} />
                </div>

                {/* Monte Carlo */}
                {monteCarloData && (
                  <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                    <MonteCarloChart monteCarloData={monteCarloData} />
                  </div>
                )}
                {isRunningMC && (
                  <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-400">Running 500 Monte Carlo simulations...</p>
                    </div>
                  </div>
                )}

                {/* Income vs Spending */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                  <IncomeExpenseChart projection={projections[activeScenario]} />
                </div>

                {/* Withdrawal Rate */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 sm:p-6">
                  <WithdrawalRateChart projection={projections[activeScenario]} />
                </div>
              </div>
            </div>

            {/* Yearly Table */}
            <YearlyTable projection={projections[activeScenario]} />

            {/* Social Security Optimizer Mini-Section */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-6">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Social Security Claiming Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[62, 67, 70].map(claimAge => {
                  const yearsWorked = Math.max(0, (activeParams.retirementAge || 67) - 22);
                  const aime = estimateAIME(activeParams.annualIncome || 0, yearsWorked);
                  const monthly = calculateSocialSecurity(aime, claimAge);
                  const annual = monthly * 12;
                  const isSelected = (activeParams.socialSecurityAge || 67) === claimAge;

                  return (
                    <div
                      key={claimAge}
                      className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.02]
                        ${isSelected
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50'
                        }`}
                      onClick={() => handleUpdateScenario(activeScenario, { socialSecurityAge: claimAge })}
                    >
                      <div className="text-xs text-slate-400 mb-1">
                        Claim at age {claimAge}
                        {claimAge === 62 && ' (Early)'}
                        {claimAge === 67 && ' (Full)'}
                        {claimAge === 70 && ' (Max)'}
                      </div>
                      <div className="text-lg font-bold text-slate-100">${Math.round(monthly)}/mo</div>
                      <div className="text-xs text-slate-500 mt-1">${Math.round(annual).toLocaleString()}/year</div>
                      {isSelected && (
                        <div className="text-[10px] text-purple-300 mt-2 font-medium">Currently selected</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-xs text-slate-600 text-center">
            This tool provides estimates for educational purposes only. Consult a certified financial planner for personalized advice.
            Projections are based on historical averages and do not guarantee future results.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
