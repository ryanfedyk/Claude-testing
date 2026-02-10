import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { parseCSV, parseImageText } from '../utils/csvParser';

export default function FileUpload({ onDataParsed }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'processing', 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedFields, setParsedFields] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file) => {
    setUploadStatus('processing');
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
          setStatusMessage('No recognizable financial fields found in the CSV. Please check the format.');
          return;
        }

        setParsedFields(Object.keys(parsed));
        setUploadStatus('success');
        setStatusMessage(`Found ${fieldCount} financial fields from CSV`);
        onDataParsed(parsed, unmapped);
      } else if (isImage) {
        setStatusMessage('Running OCR on image... This may take a moment.');

        // Dynamic import for Tesseract
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
          setStatusMessage('Could not extract financial data from the image. Try a clearer image or use CSV format.');
          return;
        }

        setParsedFields(Object.keys(parsed));
        setUploadStatus('success');
        setStatusMessage(`Extracted ${fieldCount} fields from image via OCR`);
        onDataParsed(parsed, []);
      } else {
        setUploadStatus('error');
        setStatusMessage('Unsupported file format. Please upload a CSV or image file.');
      }
    } catch (err) {
      setUploadStatus('error');
      setStatusMessage(`Error: ${err.message}`);
    }
  }, [onDataParsed]);

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
          accept=".csv,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Upload size={28} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-200">
              Drop your financial data here
            </p>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              <FileText size={14} />
              CSV files
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              <Image size={14} />
              Screenshots / Images
            </div>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${statusColor[uploadStatus]}`}>
          <div className="mt-0.5">{statusIcon[uploadStatus]}</div>
          <div className="flex-1">
            <p className="font-medium text-sm">{statusMessage}</p>
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

      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <p className="text-xs text-slate-400 font-medium mb-2">Supported CSV formats:</p>
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
    </div>
  );
}
