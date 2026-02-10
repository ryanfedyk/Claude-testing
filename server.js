import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from dist in production
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const SYSTEM_PROMPT = `You are an expert financial data extraction assistant. Your job is to analyze uploaded financial documents and extract structured data for a retirement planning tool.

You MUST return ONLY valid JSON with no additional text, no markdown fences, no explanation. Just the raw JSON object.

Extract as many of these fields as you can find in the document:

{
  "currentAge": <number - person's current age>,
  "retirementAge": <number - target retirement age>,
  "lifeExpectancy": <number - planned life expectancy, default 95>,
  "filingStatus": <"single" or "married">,
  "annualIncome": <number - annual gross income>,
  "annualExpenses": <number - annual expenses/spending>,
  "annualSavingsRate": <number - savings rate as percentage 0-100>,
  "traditional401k": <number - traditional 401k balance>,
  "roth401k": <number - roth 401k balance>,
  "traditionalIRA": <number - traditional IRA balance>,
  "rothIRA": <number - roth IRA balance>,
  "taxableBrokerage": <number - taxable brokerage/investment account balance>,
  "otherSavings": <number - cash, savings accounts, CDs, emergency fund>,
  "pension": <number - annual pension income>,
  "socialSecurityAge": <number - planned SS claiming age>,
  "estimatedSSMonthly": <number - estimated monthly SS benefit>,
  "annualRetirementSpending": <number - target annual retirement spending>,
  "nominalReturn": <number - expected return as decimal e.g. 0.07 for 7%>,
  "inflationRate": <number - inflation rate as decimal e.g. 0.025 for 2.5%>,
  "rothConversionStrategy": <"none", "moderate", or "aggressive">,
  "partTimeIncome": <number - part-time income in retirement>,
  "partTimeEndAge": <number - age to stop part-time work>,
  "rentalIncome": <number - annual rental income>,
  "annuityIncome": <number - annual annuity income>,
  "healthcareCostStart": <number - estimated annual healthcare cost>
}

Rules:
- Only include fields you can confidently extract or infer from the data
- Convert all monetary values to annual amounts (multiply monthly by 12, etc.)
- Convert percentages: savings rates should be 0-100 (e.g. 20 for 20%), but return rates and inflation as decimals (e.g. 0.07 for 7%)
- If you see account balances, categorize them correctly (401k, IRA, Roth, brokerage, savings)
- If the document is a bank/brokerage statement, extract balances and any income information
- If you see multiple accounts, sum them into the appropriate categories
- Be smart about interpreting different formats: tables, key-value pairs, narratives, statements
- If you can compute savings rate from income and expenses, do so
- Return ONLY the JSON object, nothing else`;

// Parse file with LLM
app.post('/api/parse', upload.single('file'), async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required. Set your Anthropic API key in Settings.' });
    }

    const file = req.file;
    const textContent = req.body.textContent;

    if (!file && !textContent) {
      return res.status(400).json({ error: 'No file or text content provided' });
    }

    const client = new Anthropic({ apiKey });

    // Build the message content
    const content = [];

    if (file) {
      const isImage = file.mimetype.startsWith('image/');
      const isCSV = file.originalname.endsWith('.csv') || file.mimetype === 'text/csv';
      const isText = file.mimetype.startsWith('text/') || isCSV;
      const isPDF = file.mimetype === 'application/pdf';

      if (isImage) {
        // Send image directly to Claude's vision
        const base64 = file.buffer.toString('base64');
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.mimetype,
            data: base64,
          },
        });
        content.push({
          type: 'text',
          text: `This is an image of a financial document. Extract all financial data you can find. The filename was: ${file.originalname}`,
        });
      } else if (isPDF) {
        // Send PDF directly to Claude
        const base64 = file.buffer.toString('base64');
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        });
        content.push({
          type: 'text',
          text: `This is a PDF financial document. Extract all financial data you can find. The filename was: ${file.originalname}`,
        });
      } else if (isText) {
        const text = file.buffer.toString('utf-8');
        content.push({
          type: 'text',
          text: `Here is the content of a financial file (${file.originalname}):\n\n${text}\n\nExtract all financial data from this content.`,
        });
      } else {
        // Try to read as text anyway
        try {
          const text = file.buffer.toString('utf-8');
          content.push({
            type: 'text',
            text: `Here is the content of an uploaded file (${file.originalname}, type: ${file.mimetype}):\n\n${text}\n\nExtract all financial data from this content.`,
          });
        } catch {
          return res.status(400).json({ error: `Unsupported file type: ${file.mimetype}` });
        }
      }
    } else if (textContent) {
      content.push({
        type: 'text',
        text: `Here is financial data that was entered or pasted:\n\n${textContent}\n\nExtract all financial data from this content.`,
      });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    // Extract JSON from response
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Try to parse JSON from the response (handle cases where model adds markdown fences)
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the response
        const braceMatch = responseText.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0]);
        } else {
          throw new Error('Could not extract JSON from LLM response');
        }
      }
    }

    // Validate and clean the parsed data
    const cleaned = {};
    const validFields = [
      'currentAge', 'retirementAge', 'lifeExpectancy', 'filingStatus',
      'annualIncome', 'annualExpenses', 'annualSavingsRate',
      'traditional401k', 'roth401k', 'traditionalIRA', 'rothIRA',
      'taxableBrokerage', 'otherSavings', 'pension',
      'socialSecurityAge', 'estimatedSSMonthly', 'annualRetirementSpending',
      'nominalReturn', 'inflationRate', 'rothConversionStrategy',
      'partTimeIncome', 'partTimeEndAge', 'rentalIncome', 'annuityIncome',
      'healthcareCostStart',
    ];

    for (const field of validFields) {
      if (parsed[field] !== undefined && parsed[field] !== null) {
        cleaned[field] = parsed[field];
      }
    }

    res.json({
      parsed: cleaned,
      fieldCount: Object.keys(cleaned).length,
      rawResponse: responseText,
    });
  } catch (err) {
    console.error('Parse error:', err);

    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Please check your Anthropic API key in Settings.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Rate limited. Please wait a moment and try again.' });
    }

    res.status(500).json({
      error: err.message || 'Failed to parse file with LLM',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Build the frontend first with: npm run build' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Retirement Planner API server running on http://localhost:${PORT}`);
  console.log(`Frontend dev server: run "npm run dev" separately on port 5173`);
});
