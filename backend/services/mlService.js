/**
 * ML Service Client
 * ─────────────────
 * Talks to the Python FastAPI ML service. Single source of truth for
 * Node ↔ Python communication. Falls back gracefully if the service is
 * unreachable so the app stays usable.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const TIMEOUT_MS     = 30000   // 30s — pandas can be slow on huge datasets

/**
 * Wrapper around fetch with a timeout, since Node 22's fetch doesn't
 * have one built in.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Check whether the ML service is reachable. Used for health endpoints.
 */
async function isHealthy() {
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/health`, {}, 2000)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Send dataset rows to the Python service and get back a rich
 * statistical profile.
 */
async function profileDataset(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/profile`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })

    if (!res.ok) {
      console.warn(`[mlService] /profile returned ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json()
    return data.stats || null
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[mlService] /profile timed out — falling back')
    } else {
      console.warn('[mlService] /profile failed:', err.message)
    }
    return null
  }
}

/**
 * Send dataset rows to Python and get back anomaly/outlier detection
 * results (IQR-based per numeric column).
 */
async function detectAnomalies(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/anomalies`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })

    if (!res.ok) {
      console.warn(`[mlService] /anomalies returned ${res.status} ${res.statusText}`)
      return null
    }

    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[mlService] /anomalies timed out — falling back')
    } else {
      console.warn('[mlService] /anomalies failed:', err.message)
    }
    return null
  }
}

/**
 * Send dataset rows to Python and get back pairwise Pearson correlations
 * for every pair of numeric columns (returns matrix + ranked top pairs).
 */
async function computeCorrelations(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/correlations`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })

    if (!res.ok) {
      console.warn(`[mlService] /correlations returned ${res.status} ${res.statusText}`)
      return null
    }

    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[mlService] /correlations timed out — falling back')
    } else {
      console.warn('[mlService] /correlations failed:', err.message)
    }
    return null
  }
}

module.exports = {
  ML_SERVICE_URL,
  isHealthy,
  profileDataset,
  detectAnomalies,
  computeCorrelations,
}