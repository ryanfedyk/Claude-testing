import Papa from 'papaparse';

// Field mapping: maps common CSV column names to our internal field keys
const FIELD_MAPPINGS = {
  // Age / Personal
  'age': 'currentAge',
  'current age': 'currentAge',
  'my age': 'currentAge',
  'retirement age': 'retirementAge',
  'target retirement age': 'retirementAge',
  'retire age': 'retirementAge',
  'life expectancy': 'lifeExpectancy',
  'filing status': 'filingStatus',
  'tax status': 'filingStatus',

  // Income
  'income': 'annualIncome',
  'annual income': 'annualIncome',
  'salary': 'annualIncome',
  'gross income': 'annualIncome',
  'annual salary': 'annualIncome',
  'expenses': 'annualExpenses',
  'annual expenses': 'annualExpenses',
  'monthly expenses': '_monthlyExpenses',
  'spending': 'annualExpenses',
  'savings rate': 'annualSavingsRate',
  'savings rate %': 'annualSavingsRate',
  'saving rate': 'annualSavingsRate',

  // Account balances
  '401k': 'traditional401k',
  '401(k)': 'traditional401k',
  '401k balance': 'traditional401k',
  'traditional 401k': 'traditional401k',
  'traditional 401(k)': 'traditional401k',
  'roth 401k': 'roth401k',
  'roth 401(k)': 'roth401k',
  'ira': 'traditionalIRA',
  'traditional ira': 'traditionalIRA',
  'ira balance': 'traditionalIRA',
  'roth ira': 'rothIRA',
  'roth ira balance': 'rothIRA',
  'brokerage': 'taxableBrokerage',
  'taxable': 'taxableBrokerage',
  'taxable brokerage': 'taxableBrokerage',
  'taxable account': 'taxableBrokerage',
  'investment account': 'taxableBrokerage',
  'savings': 'otherSavings',
  'cash': 'otherSavings',
  'other savings': 'otherSavings',
  'emergency fund': 'otherSavings',

  // Retirement income
  'pension': 'pension',
  'pension income': 'pension',
  'annual pension': 'pension',
  'social security': 'estimatedSSMonthly',
  'ss benefit': 'estimatedSSMonthly',
  'social security benefit': 'estimatedSSMonthly',
  'ss monthly': 'estimatedSSMonthly',
  'social security age': 'socialSecurityAge',
  'ss age': 'socialSecurityAge',
  'ss claim age': 'socialSecurityAge',
  'retirement spending': 'annualRetirementSpending',
  'retirement expenses': 'annualRetirementSpending',

  // Assumptions
  'return rate': 'nominalReturn',
  'expected return': 'nominalReturn',
  'annual return': 'nominalReturn',
  'inflation': 'inflationRate',
  'inflation rate': 'inflationRate',

  // Advanced
  'rental income': 'rentalIncome',
  'rent income': 'rentalIncome',
  'part time income': 'partTimeIncome',
  'part-time income': 'partTimeIncome',
  'annuity': 'annuityIncome',
  'annuity income': 'annuityIncome',
  'healthcare cost': 'healthcareCostStart',
  'health care cost': 'healthcareCostStart',
  'healthcare': 'healthcareCostStart',
};

function normalizeKey(key) {
  return key.toLowerCase().trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
}

function parseValue(value, key) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[$,\s%]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return null;

  // Handle filing status
  if (key === 'filingStatus') {
    const lower = value.toLowerCase().trim();
    if (lower.includes('married') || lower.includes('joint')) return 'married';
    return 'single';
  }

  // Handle Roth conversion strategy
  if (key === 'rothConversionStrategy') {
    const lower = value.toLowerCase().trim();
    if (lower.includes('aggressive')) return 'aggressive';
    if (lower.includes('moderate')) return 'moderate';
    return 'none';
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseCSV(fileContent) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('Failed to parse CSV: ' + results.errors[0].message));
          return;
        }

        const parsed = {};
        const unmapped = [];

        // Try to detect format: key-value pairs or columnar
        const headers = results.meta.fields || [];

        if (results.data.length === 1 || isKeyValueFormat(headers)) {
          // Single row with headers as field names
          const row = results.data[0];
          for (const header of headers) {
            const normalizedHeader = normalizeKey(header);
            const mappedKey = FIELD_MAPPINGS[normalizedHeader];

            if (mappedKey) {
              const value = parseValue(row[header], mappedKey);
              if (value !== null) {
                if (mappedKey === '_monthlyExpenses') {
                  parsed['annualExpenses'] = value * 12;
                } else {
                  parsed[mappedKey] = value;
                }
              }
            } else {
              unmapped.push({ header, value: row[header] });
            }
          }
        } else {
          // Try key-value format: first column is field name, second is value
          for (const row of results.data) {
            const values = Object.values(row);
            if (values.length >= 2) {
              const key = normalizeKey(String(values[0]));
              const mappedKey = FIELD_MAPPINGS[key];

              if (mappedKey) {
                const value = parseValue(values[1], mappedKey);
                if (value !== null) {
                  if (mappedKey === '_monthlyExpenses') {
                    parsed['annualExpenses'] = value * 12;
                  } else {
                    parsed[mappedKey] = value;
                  }
                }
              } else if (values[0]) {
                unmapped.push({ header: String(values[0]), value: values[1] });
              }
            }
          }
        }

        // Post-processing: convert percentages expressed as whole numbers
        if (parsed.nominalReturn && parsed.nominalReturn > 1) {
          parsed.nominalReturn = parsed.nominalReturn / 100;
        }
        if (parsed.inflationRate && parsed.inflationRate > 1) {
          parsed.inflationRate = parsed.inflationRate / 100;
        }

        resolve({ parsed, unmapped, rawData: results.data });
      },
      error: (error) => {
        reject(new Error('CSV parsing failed: ' + error.message));
      },
    });
  });
}

function isKeyValueFormat(headers) {
  // If headers look like financial field names, it's probably columnar
  const normalizedHeaders = headers.map(normalizeKey);
  const matchCount = normalizedHeaders.filter(h => FIELD_MAPPINGS[h]).length;
  return matchCount >= 2;
}

export function parseImageText(text) {
  // Parse OCR text output to extract financial data
  const parsed = {};
  const lines = text.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Try to match "Label: $Value" or "Label: Value" patterns
    const colonMatch = line.match(/^([^:]+):\s*\$?([\d,]+\.?\d*)\s*%?/);
    if (colonMatch) {
      const key = normalizeKey(colonMatch[1]);
      const mappedKey = FIELD_MAPPINGS[key];
      if (mappedKey) {
        const value = parseValue(colonMatch[2], mappedKey);
        if (value !== null) {
          parsed[mappedKey] = value;
        }
      }
      continue;
    }

    // Try "Label $Value" pattern
    const spaceMatch = line.match(/^([A-Za-z\s()]+)\s+\$?([\d,]+\.?\d*)/);
    if (spaceMatch) {
      const key = normalizeKey(spaceMatch[1]);
      const mappedKey = FIELD_MAPPINGS[key];
      if (mappedKey) {
        const value = parseValue(spaceMatch[2], mappedKey);
        if (value !== null) {
          parsed[mappedKey] = value;
        }
      }
    }
  }

  // Post-processing
  if (parsed.nominalReturn && parsed.nominalReturn > 1) {
    parsed.nominalReturn = parsed.nominalReturn / 100;
  }
  if (parsed.inflationRate && parsed.inflationRate > 1) {
    parsed.inflationRate = parsed.inflationRate / 100;
  }

  return parsed;
}
