/**
 * ML Service Client
 * ─────────────────
 * Talks to the Python FastAPI ML service. Falls back gracefully if the
 * service is unreachable so the app stays usable.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const TIMEOUT_MS     = 30000

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

async function isHealthy() {
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/health`, {}, 2000)
    return res.ok
  } catch {
    return false
  }
}

async function profileDataset(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
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
    console.warn('[mlService] /profile failed:', err.message)
    return null
  }
}

async function detectAnomalies(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
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
    console.warn('[mlService] /anomalies failed:', err.message)
    return null
  }
}

async function computeCorrelations(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
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
    console.warn('[mlService] /correlations failed:', err.message)
    return null
  }
}

async function computeQuality(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/quality`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    if (!res.ok) {
      console.warn(`[mlService] /quality returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /quality failed:', err.message)
    return null
  }
}

async function generateInsights(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/insights`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    if (!res.ok) {
      console.warn(`[mlService] /insights returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /insights failed:', err.message)
    return null
  }
}

async function detectTrends(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/trends`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    if (!res.ok) {
      console.warn(`[mlService] /trends returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /trends failed:', err.message)
    return null
  }
}

async function computeClusters(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/clusters`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    }, 60000)    // 60s — elbow method runs many fits
    if (!res.ok) {
      console.warn(`[mlService] /clusters returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /clusters failed:', err.message)
    return null
  }
}
async function forecastFuture(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/forecast`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    }, 60000)    // 60s — ARIMA can take longer
    if (!res.ok) {
      console.warn(`[mlService] /forecast returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /forecast failed:', err.message)
    return null
  }
}
async function computePCA(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/pca`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    if (!res.ok) {
      console.warn(`[mlService] /pca returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /pca failed:', err.message)
    return null
  }
}
async function computeImportance(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/importance`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    }, 60000)    // 60s — Random Forest can be slow on bigger datasets
    if (!res.ok) {
      console.warn(`[mlService] /importance returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /importance failed:', err.message)
    return null
  }
}
async function detectDuplicates(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/duplicates`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    if (!res.ok) {
      console.warn(`[mlService] /duplicates returned ${res.status} ${res.statusText}`)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[mlService] /duplicates failed:', err.message)
    return null
  }
}

module.exports = {
  ML_SERVICE_URL,
  isHealthy,
  profileDataset,
  detectAnomalies,
  computeCorrelations,
  computeQuality,
  generateInsights,
  detectTrends,
  computeClusters,
  forecastFuture,
  computePCA,
  computeImportance,
  detectDuplicates,
}