// Advanced Retirement Planning Engine
// Handles projections, Monte Carlo simulations, Social Security, tax planning, etc.

const TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
};

const CAPITAL_GAINS_BRACKETS = {
  single: [
    { min: 0, max: 47025, rate: 0 },
    { min: 47025, max: 518900, rate: 0.15 },
    { min: 518900, max: Infinity, rate: 0.20 },
  ],
  married: [
    { min: 0, max: 94050, rate: 0 },
    { min: 94050, max: 583750, rate: 0.15 },
    { min: 583750, max: Infinity, rate: 0.20 },
  ],
};

// Social Security bend points and formula (2024)
const SS_BEND_POINTS = [1174, 7078];
const SS_REPLACEMENT_RATES = [0.90, 0.32, 0.15];

export function calculateFederalTax(income, filingStatus = 'single') {
  const brackets = TAX_BRACKETS_2024[filingStatus] || TAX_BRACKETS_2024.single;
  let tax = 0;
  let remaining = income;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
    if (taxableInBracket <= 0) break;
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  return tax;
}

export function calculateCapitalGainsTax(gains, ordinaryIncome, filingStatus = 'single') {
  const brackets = CAPITAL_GAINS_BRACKETS[filingStatus] || CAPITAL_GAINS_BRACKETS.single;
  let tax = 0;
  let remaining = gains;
  let currentIncome = ordinaryIncome;

  for (const bracket of brackets) {
    if (currentIncome >= bracket.max) {
      currentIncome -= (bracket.max - bracket.min);
      continue;
    }
    const spaceInBracket = bracket.max - Math.max(currentIncome, bracket.min);
    const taxableInBracket = Math.min(remaining, spaceInBracket);
    if (taxableInBracket <= 0) continue;
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    if (remaining <= 0) break;
  }

  return tax;
}

export function calculateSocialSecurity(aime, claimAge = 67, fullRetirementAge = 67) {
  // Primary Insurance Amount (PIA) from AIME
  let pia = 0;
  if (aime <= SS_BEND_POINTS[0]) {
    pia = aime * SS_REPLACEMENT_RATES[0];
  } else if (aime <= SS_BEND_POINTS[1]) {
    pia = SS_BEND_POINTS[0] * SS_REPLACEMENT_RATES[0] +
      (aime - SS_BEND_POINTS[0]) * SS_REPLACEMENT_RATES[1];
  } else {
    pia = SS_BEND_POINTS[0] * SS_REPLACEMENT_RATES[0] +
      (SS_BEND_POINTS[1] - SS_BEND_POINTS[0]) * SS_REPLACEMENT_RATES[1] +
      (aime - SS_BEND_POINTS[1]) * SS_REPLACEMENT_RATES[2];
  }

  // Adjustment for early/late claiming
  const monthsDiff = (claimAge - fullRetirementAge) * 12;
  if (monthsDiff < 0) {
    // Early: reduce by 5/9% per month for first 36 months, 5/12% after
    const earlyMonths = Math.abs(monthsDiff);
    const first36 = Math.min(earlyMonths, 36);
    const beyond36 = Math.max(0, earlyMonths - 36);
    pia *= (1 - first36 * (5 / 900) - beyond36 * (5 / 1200));
  } else if (monthsDiff > 0) {
    // Delayed: 8% per year (2/3% per month)
    pia *= (1 + monthsDiff * (2 / 300));
  }

  return Math.round(pia * 100) / 100;
}

export function estimateAIME(currentSalary, yearsWorked) {
  // Simplified AIME estimation
  const avgEarnings = currentSalary * 0.85; // rough average over career
  const top35Years = Math.min(yearsWorked, 35);
  return Math.round((avgEarnings * top35Years) / (35 * 12));
}

export function calculateRMD(balance, age) {
  // Uniform Lifetime Table (simplified for common ages)
  const distributionPeriods = {
    72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9,
    78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7,
    84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
    90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  };
  const period = distributionPeriods[age] || Math.max(5, 27.4 - (age - 72) * 0.9);
  return balance / period;
}

export function generateProjection(params) {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy = 95,
    annualIncome,
    annualExpenses,
    annualSavingsRate,
    traditional401k = 0,
    roth401k = 0,
    traditionalIRA = 0,
    rothIRA = 0,
    taxableBrokerage = 0,
    otherSavings = 0,
    pension = 0,
    socialSecurityAge = 67,
    estimatedSSMonthly = 0,
    annualRetirementSpending,
    inflationRate = 0.025,
    nominalReturn = 0.07,
    filingStatus = 'single',
    healthcareCostStart = 12000,
    healthcareCostInflation = 0.055,
    rothConversionStrategy = 'none', // 'none', 'moderate', 'aggressive'
    partTimeIncome = 0,
    partTimeEndAge = 0,
    rentalIncome = 0,
    annuityIncome = 0,
    inheritanceAge = 0,
    inheritanceAmount = 0,
  } = params;

  const realReturn = nominalReturn - inflationRate;
  const years = [];

  let trad401kBal = traditional401k;
  let roth401kBal = roth401k;
  let tradIRABal = traditionalIRA;
  let rothIRABal = rothIRA;
  let taxableBal = taxableBrokerage;
  let otherBal = otherSavings;

  const annualSavings = annualIncome * (annualSavingsRate / 100);
  const trad401kContrib = Math.min(annualSavings * 0.5, 23000);
  const rothContrib = Math.min(annualSavings * 0.25, 7000);
  const taxableContrib = Math.max(0, annualSavings - trad401kContrib - rothContrib);

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearIndex = age - currentAge;
    const inflationMultiplier = Math.pow(1 + inflationRate, yearIndex);
    const isRetired = age >= retirementAge;
    const isReceivingSS = age >= socialSecurityAge;

    // Income sources
    let ssIncome = isReceivingSS ? estimatedSSMonthly * 12 : 0;
    let pensionIncome = isRetired ? pension * inflationMultiplier * 0.5 : 0; // some pensions aren't inflation adjusted
    let partTime = (!isRetired || (partTimeEndAge > 0 && age <= partTimeEndAge)) && isRetired ? partTimeIncome : 0;
    let rental = rentalIncome * inflationMultiplier;
    let annuity = isRetired ? annuityIncome : 0;
    let employment = isRetired ? 0 : annualIncome * inflationMultiplier;

    // Inheritance
    if (inheritanceAge > 0 && age === inheritanceAge) {
      taxableBal += inheritanceAmount;
    }

    // Healthcare costs (increase faster than general inflation)
    let healthcareCost = 0;
    if (age >= 55) {
      const healthYears = age - 55;
      healthcareCost = healthcareCostStart * Math.pow(1 + healthcareCostInflation, healthYears);
      if (age >= 65) healthcareCost *= 0.6; // Medicare offset
    }

    // Spending needs
    let targetSpending = isRetired
      ? (annualRetirementSpending || annualExpenses * 0.8) * inflationMultiplier + healthcareCost
      : annualExpenses * inflationMultiplier;

    // Accumulation phase
    if (!isRetired) {
      trad401kBal = trad401kBal * (1 + nominalReturn) + trad401kContrib;
      rothIRABal = rothIRABal * (1 + nominalReturn) + rothContrib;
      taxableBal = taxableBal * (1 + nominalReturn * 0.85) + taxableContrib; // tax drag
      otherBal = otherBal * (1 + nominalReturn * 0.5);
      tradIRABal = tradIRABal * (1 + nominalReturn);
      roth401kBal = roth401kBal * (1 + nominalReturn);
    } else {
      // Distribution phase
      let incomeNeeded = targetSpending - ssIncome - pensionIncome - partTime - rental - annuity;

      // Roth conversion strategy
      let rothConversion = 0;
      if (rothConversionStrategy !== 'none' && age < 73 && trad401kBal + tradIRABal > 0) {
        const conversionLimit = rothConversionStrategy === 'aggressive' ? 100000 : 50000;
        const taxableIncome = ssIncome * 0.85 + pensionIncome + partTime;
        const remainingIn12Bracket = (filingStatus === 'married' ? 94300 : 47150) - taxableIncome;
        rothConversion = Math.min(
          Math.max(0, remainingIn12Bracket),
          conversionLimit,
          trad401kBal + tradIRABal
        );

        if (rothConversion > 0) {
          const fromTrad401k = Math.min(rothConversion, trad401kBal);
          trad401kBal -= fromTrad401k;
          const fromIRA = rothConversion - fromTrad401k;
          tradIRABal -= fromIRA;
          rothIRABal += rothConversion;
        }
      }

      // RMD check
      let rmd = 0;
      if (age >= 73) {
        rmd = calculateRMD(trad401kBal + tradIRABal, age);
      }

      // Withdrawal order: taxable first, then traditional (for RMD), then Roth
      let withdrawn = 0;
      incomeNeeded = Math.max(0, incomeNeeded);

      // Taxable account first
      if (incomeNeeded > 0 && taxableBal > 0) {
        const fromTaxable = Math.min(incomeNeeded, taxableBal);
        taxableBal -= fromTaxable;
        withdrawn += fromTaxable;
        incomeNeeded -= fromTaxable;
      }

      // Other savings
      if (incomeNeeded > 0 && otherBal > 0) {
        const fromOther = Math.min(incomeNeeded, otherBal);
        otherBal -= fromOther;
        withdrawn += fromOther;
        incomeNeeded -= fromOther;
      }

      // Traditional (at least RMD)
      const tradWithdrawal = Math.max(rmd, incomeNeeded > 0 ? incomeNeeded : 0);
      if (tradWithdrawal > 0) {
        const from401k = Math.min(tradWithdrawal, trad401kBal);
        trad401kBal -= from401k;
        const remainingTrad = tradWithdrawal - from401k;
        const fromIRA = Math.min(remainingTrad, tradIRABal);
        tradIRABal -= fromIRA;
        withdrawn += from401k + fromIRA;
        incomeNeeded -= (from401k + fromIRA);
      }

      // Roth last
      if (incomeNeeded > 0) {
        const fromRoth = Math.min(incomeNeeded, rothIRABal + roth401kBal);
        const fromRothIRA = Math.min(incomeNeeded, rothIRABal);
        rothIRABal -= fromRothIRA;
        const fromRoth401k = Math.min(incomeNeeded - fromRothIRA, roth401kBal);
        roth401kBal -= fromRoth401k;
        withdrawn += fromRothIRA + fromRoth401k;
        incomeNeeded -= fromRoth;
      }

      // Growth on remaining balances
      trad401kBal *= (1 + nominalReturn);
      tradIRABal *= (1 + nominalReturn);
      rothIRABal *= (1 + nominalReturn);
      roth401kBal *= (1 + nominalReturn);
      taxableBal *= (1 + nominalReturn * 0.85);
      otherBal *= (1 + nominalReturn * 0.5);
    }

    const totalBalance = trad401kBal + roth401kBal + tradIRABal + rothIRABal + taxableBal + otherBal;
    const totalIncome = isRetired
      ? ssIncome + pensionIncome + partTime + rental + annuity
      : employment;

    years.push({
      age,
      year: new Date().getFullYear() + yearIndex,
      isRetired,
      totalBalance: Math.max(0, Math.round(totalBalance)),
      traditional401k: Math.max(0, Math.round(trad401kBal)),
      roth401k: Math.max(0, Math.round(roth401kBal)),
      traditionalIRA: Math.max(0, Math.round(tradIRABal)),
      rothIRA: Math.max(0, Math.round(rothIRABal)),
      taxableBrokerage: Math.max(0, Math.round(taxableBal)),
      otherSavings: Math.max(0, Math.round(otherBal)),
      annualIncome: Math.round(totalIncome),
      annualSpending: Math.round(targetSpending),
      ssIncome: Math.round(ssIncome),
      pensionIncome: Math.round(pensionIncome),
      healthcareCost: Math.round(healthcareCost),
      inflationMultiplier: Math.round(inflationMultiplier * 1000) / 1000,
      ranOut: totalBalance <= 0 && isRetired,
    });
  }

  return years;
}

export function runMonteCarloSimulation(params, numSimulations = 500) {
  const results = [];
  const baseReturn = params.nominalReturn || 0.07;
  const volatility = 0.16; // typical stock market volatility

  for (let i = 0; i < numSimulations; i++) {
    // Generate a sequence of random returns using Box-Muller transform
    const simParams = { ...params };
    const projection = generateProjectionWithRandomReturns(simParams, baseReturn, volatility);
    results.push(projection);
  }

  // Calculate percentiles at each age
  const ages = results[0].map(y => y.age);
  const percentileData = ages.map((age, idx) => {
    const balances = results.map(r => r[idx].totalBalance).sort((a, b) => a - b);
    return {
      age,
      p5: balances[Math.floor(numSimulations * 0.05)],
      p10: balances[Math.floor(numSimulations * 0.10)],
      p25: balances[Math.floor(numSimulations * 0.25)],
      p50: balances[Math.floor(numSimulations * 0.50)],
      p75: balances[Math.floor(numSimulations * 0.75)],
      p90: balances[Math.floor(numSimulations * 0.90)],
      p95: balances[Math.floor(numSimulations * 0.95)],
    };
  });

  // Success rate: % of simulations where money doesn't run out
  const successCount = results.filter(r => {
    const lastYear = r[r.length - 1];
    return lastYear.totalBalance > 0;
  }).length;

  return {
    percentileData,
    successRate: (successCount / numSimulations) * 100,
    simulations: results,
  };
}

function generateProjectionWithRandomReturns(params, baseReturn, volatility) {
  const years = [];
  const {
    currentAge, retirementAge, lifeExpectancy = 95,
    annualIncome, annualExpenses, annualSavingsRate,
    traditional401k = 0, roth401k = 0, traditionalIRA = 0,
    rothIRA = 0, taxableBrokerage = 0, otherSavings = 0,
    pension = 0, socialSecurityAge = 67, estimatedSSMonthly = 0,
    annualRetirementSpending, inflationRate = 0.025,
    healthcareCostStart = 12000, healthcareCostInflation = 0.055,
    partTimeIncome = 0, partTimeEndAge = 0, rentalIncome = 0, annuityIncome = 0,
  } = params;

  let trad401kBal = traditional401k;
  let roth401kBal = roth401k;
  let tradIRABal = traditionalIRA;
  let rothIRABal = rothIRA;
  let taxableBal = taxableBrokerage;
  let otherBal = otherSavings;

  const annualSavings = annualIncome * (annualSavingsRate / 100);
  const trad401kContrib = Math.min(annualSavings * 0.5, 23000);
  const rothContrib = Math.min(annualSavings * 0.25, 7000);
  const taxableContrib = Math.max(0, annualSavings - trad401kContrib - rothContrib);

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    const yearIndex = age - currentAge;
    const inflationMultiplier = Math.pow(1 + inflationRate, yearIndex);
    const isRetired = age >= retirementAge;

    // Random return using Box-Muller
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const yearReturn = baseReturn + volatility * z;

    const isReceivingSS = age >= socialSecurityAge;
    let ssIncome = isReceivingSS ? estimatedSSMonthly * 12 : 0;
    let pensionIncome = isRetired ? pension * inflationMultiplier * 0.5 : 0;
    let partTime = isRetired && partTimeEndAge > 0 && age <= partTimeEndAge ? partTimeIncome : 0;
    let rental = rentalIncome * inflationMultiplier;
    let annuity = isRetired ? annuityIncome : 0;

    let healthcareCost = 0;
    if (age >= 55) {
      healthcareCost = healthcareCostStart * Math.pow(1 + healthcareCostInflation, age - 55);
      if (age >= 65) healthcareCost *= 0.6;
    }

    let targetSpending = isRetired
      ? (annualRetirementSpending || annualExpenses * 0.8) * inflationMultiplier + healthcareCost
      : annualExpenses * inflationMultiplier;

    if (!isRetired) {
      trad401kBal = trad401kBal * (1 + yearReturn) + trad401kContrib;
      rothIRABal = rothIRABal * (1 + yearReturn) + rothContrib;
      taxableBal = taxableBal * (1 + yearReturn * 0.85) + taxableContrib;
      otherBal = otherBal * (1 + yearReturn * 0.5);
      tradIRABal = tradIRABal * (1 + yearReturn);
      roth401kBal = roth401kBal * (1 + yearReturn);
    } else {
      let incomeNeeded = Math.max(0, targetSpending - ssIncome - pensionIncome - partTime - rental - annuity);

      if (incomeNeeded > 0 && taxableBal > 0) {
        const amt = Math.min(incomeNeeded, taxableBal);
        taxableBal -= amt;
        incomeNeeded -= amt;
      }
      if (incomeNeeded > 0 && otherBal > 0) {
        const amt = Math.min(incomeNeeded, otherBal);
        otherBal -= amt;
        incomeNeeded -= amt;
      }
      if (incomeNeeded > 0 && (trad401kBal + tradIRABal) > 0) {
        const amt = Math.min(incomeNeeded, trad401kBal + tradIRABal);
        const from401k = Math.min(amt, trad401kBal);
        trad401kBal -= from401k;
        tradIRABal -= Math.min(amt - from401k, tradIRABal);
        incomeNeeded -= amt;
      }
      if (incomeNeeded > 0) {
        const fromRothIRA = Math.min(incomeNeeded, rothIRABal);
        rothIRABal -= fromRothIRA;
        incomeNeeded -= fromRothIRA;
        const fromRoth401k = Math.min(incomeNeeded, roth401kBal);
        roth401kBal -= fromRoth401k;
      }

      trad401kBal *= (1 + yearReturn);
      tradIRABal *= (1 + yearReturn);
      rothIRABal *= (1 + yearReturn);
      roth401kBal *= (1 + yearReturn);
      taxableBal *= (1 + yearReturn * 0.85);
      otherBal *= (1 + yearReturn * 0.5);
    }

    const totalBalance = Math.max(0, trad401kBal + roth401kBal + tradIRABal + rothIRABal + taxableBal + otherBal);

    years.push({
      age,
      totalBalance: Math.round(totalBalance),
      isRetired,
      ranOut: totalBalance <= 0 && isRetired,
    });
  }

  return years;
}

export function calculateWithdrawalRate(totalBalance, annualSpending) {
  if (totalBalance <= 0) return 0;
  return (annualSpending / totalBalance) * 100;
}

export function getRequiredFields() {
  return [
    { key: 'currentAge', label: 'Current Age', type: 'number', required: true, category: 'personal' },
    { key: 'retirementAge', label: 'Target Retirement Age', type: 'number', required: true, category: 'personal' },
    { key: 'lifeExpectancy', label: 'Life Expectancy', type: 'number', required: false, category: 'personal', default: 95 },
    { key: 'filingStatus', label: 'Tax Filing Status', type: 'select', options: ['single', 'married'], required: true, category: 'personal' },
    { key: 'annualIncome', label: 'Annual Gross Income', type: 'currency', required: true, category: 'income' },
    { key: 'annualExpenses', label: 'Annual Expenses', type: 'currency', required: true, category: 'income' },
    { key: 'annualSavingsRate', label: 'Savings Rate (%)', type: 'percentage', required: true, category: 'income' },
    { key: 'traditional401k', label: '401(k) Traditional Balance', type: 'currency', required: false, category: 'accounts' },
    { key: 'roth401k', label: '401(k) Roth Balance', type: 'currency', required: false, category: 'accounts' },
    { key: 'traditionalIRA', label: 'Traditional IRA Balance', type: 'currency', required: false, category: 'accounts' },
    { key: 'rothIRA', label: 'Roth IRA Balance', type: 'currency', required: false, category: 'accounts' },
    { key: 'taxableBrokerage', label: 'Taxable Brokerage Balance', type: 'currency', required: false, category: 'accounts' },
    { key: 'otherSavings', label: 'Other Savings / Cash', type: 'currency', required: false, category: 'accounts' },
    { key: 'pension', label: 'Annual Pension Income', type: 'currency', required: false, category: 'retirement_income' },
    { key: 'socialSecurityAge', label: 'Social Security Claim Age', type: 'number', required: false, category: 'retirement_income', default: 67 },
    { key: 'estimatedSSMonthly', label: 'Estimated Monthly SS Benefit', type: 'currency', required: false, category: 'retirement_income' },
    { key: 'annualRetirementSpending', label: 'Desired Annual Retirement Spending', type: 'currency', required: false, category: 'retirement_income' },
    { key: 'nominalReturn', label: 'Expected Annual Return (%)', type: 'percentage', required: false, category: 'assumptions', default: 7 },
    { key: 'inflationRate', label: 'Inflation Rate (%)', type: 'percentage', required: false, category: 'assumptions', default: 2.5 },
    { key: 'rothConversionStrategy', label: 'Roth Conversion Strategy', type: 'select', options: ['none', 'moderate', 'aggressive'], required: false, category: 'advanced' },
    { key: 'partTimeIncome', label: 'Part-time Income in Retirement', type: 'currency', required: false, category: 'advanced' },
    { key: 'partTimeEndAge', label: 'Part-time Work End Age', type: 'number', required: false, category: 'advanced' },
    { key: 'rentalIncome', label: 'Rental Income (Annual)', type: 'currency', required: false, category: 'advanced' },
    { key: 'annuityIncome', label: 'Annuity Income (Annual)', type: 'currency', required: false, category: 'advanced' },
    { key: 'healthcareCostStart', label: 'Estimated Annual Healthcare Cost (age 55)', type: 'currency', required: false, category: 'advanced', default: 12000 },
  ];
}
