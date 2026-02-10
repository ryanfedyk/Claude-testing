import { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle, XCircle, Eye, EyeOff, Server, Zap } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, checkServerHealth } from '../utils/llmParser';

export default function ApiKeySettings({ apiKey, onApiKeyChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'

  useEffect(() => {
    checkServerHealth().then(ok => {
      setServerStatus(ok ? 'online' : 'offline');
    });
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = inputValue.trim();
    setStoredApiKey(trimmed);
    onApiKeyChange(trimmed);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setStoredApiKey('');
    onApiKeyChange('');
  };

  const isConfigured = !!apiKey;
  const maskedKey = apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-4) : '';

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
          ${isConfigured
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : 'text-amber-400 hover:bg-amber-500/10 animate-pulse'
          }`}
        title={isConfigured ? 'LLM parsing enabled' : 'Configure API key for AI-powered parsing'}
      >
        {isConfigured ? <Zap size={14} /> : <Key size={14} />}
        {isConfigured ? 'AI Parsing On' : 'Set API Key'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Settings size={16} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-200">AI-Powered File Parsing</h2>
                  <p className="text-xs text-slate-500">Configure Claude API to interpret any financial document</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Server Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border
                ${serverStatus === 'online'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : serverStatus === 'offline'
                    ? 'bg-red-500/5 border-red-500/20 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Server size={14} />
                {serverStatus === 'online' && 'Backend server is running'}
                {serverStatus === 'offline' && (
                  <span>
                    Backend server is not running.
                    <span className="text-slate-500 ml-1">Start it with: <code className="bg-slate-800 px-1 rounded">npm run server</code></span>
                  </span>
                )}
                {serverStatus === 'checking' && 'Checking server status...'}
              </div>

              {/* How it works */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs font-medium text-slate-300 mb-2">How it works</p>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">1.</span>
                    Upload any file — CSV, Excel screenshots, bank statements, brokerage PDFs, handwritten notes photos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">2.</span>
                    Claude analyzes the document and intelligently extracts financial data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">3.</span>
                    Extracted data auto-populates your retirement planning form
                  </li>
                </ul>
              </div>

              {/* API Key Input */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Anthropic API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2.5 pr-10 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-200 font-mono
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5">
                  Stored in your browser's localStorage. Never sent anywhere except to Anthropic's API through the local backend server.
                </p>
              </div>

              {/* Current status */}
              {isConfigured && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-300">API key configured: <code className="text-slate-400">{maskedKey}</code></span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-slate-800 bg-slate-800/30">
              {isConfigured ? (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <XCircle size={14} />
                  Remove Key
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!inputValue.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white
                    hover:from-blue-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
