// Use relative paths so Vite proxy handles it in dev, Express in production
const API_BASE = '';

/**
 * Parse a file using the LLM backend.
 * Sends the file to the Express server which calls Claude to intelligently
 * extract financial data from any document format.
 */
export async function parseFileWithLLM(file, apiKey, onProgress) {
  if (!apiKey) {
    throw new Error('API key required');
  }

  onProgress?.('Uploading file to LLM for analysis...');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/parse`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `Server returned ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Parse pasted text content using the LLM backend.
 */
export async function parseTextWithLLM(text, apiKey, onProgress) {
  if (!apiKey) {
    throw new Error('API key required');
  }

  onProgress?.('Analyzing text with LLM...');

  const response = await fetch(`${API_BASE}/api/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ textContent: text }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `Server returned ${response.status}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Check if the backend server is running.
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get/set API key from localStorage.
 */
const STORAGE_KEY = 'retirement-planner-api-key';

export function getStoredApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage not available
  }
}
