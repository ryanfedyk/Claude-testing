import { useState } from 'react';
import { ChevronDown, ChevronUp, Table } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function YearlyTable({ projection }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEveryNYears, setShowEveryNYears] = useState(5);

  if (!projection || projection.length === 0) return null;

  const displayData = showEveryNYears === 1
    ? projection
    : projection.filter((y, idx) => idx === 0 || y.isRetired !== projection[idx - 1]?.isRetired || idx % showEveryNYears === 0 || idx === projection.length - 1);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Table size={18} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Detailed Year-by-Year Projection</span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <select
              onClick={(e) => e.stopPropagation()}
              value={showEveryNYears}
              onChange={(e) => setShowEveryNYears(parseInt(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300"
            >
              <option value={1}>Every year</option>
              <option value={5}>Every 5 years</option>
              <option value={10}>Every 10 years</option>
            </select>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-y border-slate-700/50">
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Age</th>
                <th className="px-3 py-2 text-left text-slate-400 font-medium">Year</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Total Balance</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">401(k)</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Roth IRA</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Taxable</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Income</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">Spending</th>
                <th className="px-3 py-2 text-right text-slate-400 font-medium">SS</th>
                <th className="px-3 py-2 text-center text-slate-400 font-medium">Phase</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((year, idx) => (
                <tr
                  key={year.age}
                  className={`border-b border-slate-700/30 transition-colors hover:bg-slate-700/20
                    ${year.ranOut ? 'bg-red-500/5' : ''}
                    ${year.isRetired && !year.ranOut ? 'bg-blue-500/3' : ''}`}
                >
                  <td className="px-3 py-2 font-medium text-slate-300">{year.age}</td>
                  <td className="px-3 py-2 text-slate-500">{year.year}</td>
                  <td className={`px-3 py-2 text-right font-mono font-medium ${year.ranOut ? 'text-red-400' : 'text-slate-200'}`}>
                    {formatCurrency(year.totalBalance, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">
                    {formatCurrency(year.traditional401k + year.roth401k, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">
                    {formatCurrency(year.rothIRA, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">
                    {formatCurrency(year.taxableBrokerage, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-400/80">
                    {formatCurrency(year.annualIncome, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-orange-400/80">
                    {formatCurrency(year.annualSpending, true)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-purple-400/80">
                    {year.ssIncome > 0 ? formatCurrency(year.ssIncome, true) : '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {year.ranOut ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">Depleted</span>
                    ) : year.isRetired ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Retired</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Working</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
