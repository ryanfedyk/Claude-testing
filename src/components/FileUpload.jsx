import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader, Zap, FileSpreadsheet, FileImage, File } from 'lucide-react';
import { parseCSV, parseImageText } from '../utils/csvParser';
import { parseFileWithLLM, parseTextWithLLM } from '../utils/llmParser';

export default function FileUpload({ onDataParsed, apiKey }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'processing', 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [parseMethod, setParseMethod] = useState(null); // 'llm' or 'rules'
  const [parsedFields, setParsedFields] = useState([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef(null);

  const hasLLM = !!apiKey;

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // LLM-powered parsing: works with ANY file type
  const processFileWithLLM = useCallback(async (file) => {
    setUploadStatus('processing');
    setParseMethod('llm');
    setStatusMessage(`Claude is analyzing ${file.name}...`);
    setParsedFields([]);

    try {
      const result = await parseFileWithLLM(file, apiKey, (msg) => setStatusMessage(msg));

      if (!result.parsed || result.fieldCount === 0) {
        setUploadStatus('error');
        setStatusMessage('Claude could not extract financial data from this file. Try a different document or enter data manually.');
        return;
      }

      setParsedFields(Object.keys(result.parsed));
      setUploadStatus('success');
      setStatusMessage(`Claude extracted ${result.fieldCount} financial fields`);
      onDataParsed(result.parsed, []);
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage(`LLM Error: ${err.message}`);
    }
  }, [apiKey, onDataParsed]);

  // Rule-based fallback parsing for CSV and images
  const processFileWithRules = useCallback(async (file) => {
    setUploadStatus('processing');
    setParseMethod('rules');
    setStatusMessage(`Processing ${file.name}...`);
    setParsedFields([]);

    try {
      const isImage = file.type.startsWith('image/');
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';

      if (isCSV) {
        const text = await file.text();
        const { parsed, unmapped } = await parseCSV(text);
        const fieldCount = Object.keys(parsed).length;

        if (fieldCount === 0) {
          setUploadStatus('error');
          setStatusMessage('No recognizable fields found. Set up an API key for AI-powered parsing of any format.');
          return;
        }

        setParsedFields(Object.keys(parsed));
        setUploadStatus('success');
        setStatusMessage(`Rule-based parser found ${fieldCount} fields from CSV`);
        onDataParsed(parsed, unmapped);
      } else if (isImage) {
        setStatusMessage('Running OCR on image... This may take a moment.');

        const Tesseract = await import('tesseract.js');
        const { data: { text } } = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setStatusMessage(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        const parsed = parseImageText(text);
        const fieldCount = Object.keys(parsed).length;

        if (fieldCount === 0) {
          setUploadStatus('error');
          setStatusMessage('Could not extract data from image. Set up an API key — Claude\'s vision is much more accurate.');
          return;
        }

        setParsedFields(Object.keys(parsed));
        setUploadStatus('success');
        setStatusMessage(`Extracted ${fieldCount} fields from image via OCR`);
        onDataParsed(parsed, []);
      } else {
        setUploadStatus('error');
        setStatusMessage('This file type requires AI parsing. Set up your API key in Settings to process any file format.');
      }
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage(`Error: ${err.message}`);
    }
  }, [onDataParsed]);

  // Main file processor: routes to LLM or rules
  const processFile = useCallback(async (file) => {
    if (hasLLM) {
      await processFileWithLLM(file);
    } else {
      await processFileWithRules(file);
    }
  }, [hasLLM, processFileWithLLM, processFileWithRules]);

  // Handle paste text submission
  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) return;

    if (hasLLM) {
      setUploadStatus('processing');
      setParseMethod('llm');
      setStatusMessage('Claude is analyzing your pasted data...');
      setParsedFields([]);

      try {
        const result = await parseTextWithLLM(pasteText, apiKey, (msg) => setStatusMessage(msg));

        if (!result.parsed || result.fieldCount === 0) {
          setUploadStatus('error');
          setStatusMessage('Claude could not extract financial data from this text.');
          return;
        }

        setParsedFields(Object.keys(result.parsed));
        setUploadStatus('success');
        setStatusMessage(`Claude extracted ${result.fieldCount} fields from pasted text`);
        onDataParsed(result.parsed, []);
        setPasteMode(false);
        setPasteText('');
      } catch (err) {
        setUploadStatus('error');
        setStatusMessage(`LLM Error: ${err.message}`);
      }
    } else {
      // Try rule-based CSV parsing on pasted text
      try {
        const { parsed, unmapped } = await parseCSV(pasteText);
        const fieldCount = Object.keys(parsed).length;
        if (fieldCount > 0) {
          setParsedFields(Object.keys(parsed));
          setUploadStatus('success');
          setStatusMessage(`Found ${fieldCount} fields from pasted text`);
          onDataParsed(parsed, unmapped);
          setPasteMode(false);
          setPasteText('');
        } else {
          setUploadStatus('error');
          setStatusMessage('Could not parse pasted text. Set up an API key for AI-powered interpretation.');
        }
      } catch {
        setUploadStatus('error');
        setStatusMessage('Could not parse pasted text. Set up an API key for AI-powered interpretation.');
      }
    }
  }, [pasteText, hasLLM, apiKey, onDataParsed]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const statusIcon = {
    processing: <Loader className="animate-spin" size={20} />,
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
  };

  const statusColor = {
    processing: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    error: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="space-y-4">
      {/* LLM Status Banner */}
      {hasLLM ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <Zap size={16} className="text-blue-400" />
          <span className="text-xs font-medium text-blue-300">
            AI-powered parsing active — upload any file format (CSV, PDF, images, screenshots, bank statements, brokerage exports)
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <AlertCircle size={16} className="text-amber-400" />
          <span className="text-xs text-slate-400">
            Set up your API key in <span className="text-amber-300 font-medium">Settings</span> to enable AI-powered parsing of any file format.
            Currently limited to simple CSV and image OCR.
          </span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
          ${dragActive
            ? 'border-blue-400 bg-blue-400/10 scale-[1.02]'
            : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800/50'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={hasLLM ? '*/*' : '.csv,image/*'}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
            ${hasLLM
              ? 'bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20'
              : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
            }`}
          >
            <Upload size={28} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-200">
              {hasLLM ? 'Drop any financial document here' : 'Drop your financial data here'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {hasLLM ? (
              <>
                <FileBadge icon={FileSpreadsheet} label="CSV / Excel" />
                <FileBadge icon={FileImage} label="Images / Screenshots" />
                <FileBadge icon={File} label="PDFs" />
                <FileBadge icon={FileText} label="Any text file" />
              </>
            ) : (
              <>
                <FileBadge icon={FileText} label="CSV files" />
                <FileBadge icon={Image} label="Screenshots / Images" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Paste Mode */}
      <div>
        <button
          onClick={(e) => { e.stopPropagation(); setPasteMode(!pasteMode); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {pasteMode ? 'Hide paste area' : 'Or paste financial data as text...'}
        </button>
        {pasteMode && (
          <div className="mt-2 space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={hasLLM
                ? "Paste anything — bank statement text, brokerage summary, spreadsheet data, even a description of your finances in plain English..."
                : "Paste CSV data here (e.g. 'Age, 35\\nIncome, $120,000')"}
              className="w-full h-32 px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-200 font-mono
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white
                hover:from-blue-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {hasLLM ? 'Analyze with Claude' : 'Parse Text'}
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      {uploadStatus && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${statusColor[uploadStatus]}`}>
          <div className="mt-0.5">{statusIcon[uploadStatus]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{statusMessage}</p>
              {parseMethod && uploadStatus === 'success' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                  ${parseMethod === 'llm' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-400'}`}>
                  {parseMethod === 'llm' ? 'AI parsed' : 'Rule-based'}
                </span>
              )}
            </div>
            {parsedFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {parsedFields.map(field => (
                  <span
                    key={field}
                    className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help / Format Info */}
      {!hasLLM && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 font-medium mb-2">Supported CSV formats (without API key):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="font-mono bg-slate-900/50 p-2 rounded-lg">
              Field, Value<br />
              Age, 35<br />
              Income, $120,000<br />
              401k Balance, $85,000
            </div>
            <div className="font-mono bg-slate-900/50 p-2 rounded-lg">
              Age, Income, 401k, Roth IRA<br />
              35, 120000, 85000, 42000
            </div>
          </div>
        </div>
      )}

      {hasLLM && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 font-medium mb-2">Claude can interpret:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-500">
            <div className="bg-slate-900/50 p-2 rounded-lg text-center">
              <span className="block text-lg mb-1">📊</span>
              Spreadsheets & CSVs in any format
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg text-center">
              <span className="block text-lg mb-1">📸</span>
              Screenshots of financial apps
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg text-center">
              <span className="block text-lg mb-1">📄</span>
              Bank & brokerage PDFs
            </div>
            <div className="bg-slate-900/50 p-2 rounded-lg text-center">
              <span className="block text-lg mb-1">💬</span>
              Plain English descriptions
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileBadge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
      <Icon size={14} />
      {label}
    </div>
  );
}
