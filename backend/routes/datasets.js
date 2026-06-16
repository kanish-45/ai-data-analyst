const express   = require('express')
const Dataset   = require('../models/Dataset')
const auth      = require('../middleware/auth')
const mlService = require('../services/mlService')

const router = express.Router()
router.use(auth)

// ── GET /api/datasets ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const datasets = await Dataset
      .find({ user: req.user._id })
      .select('-sampleRows -columnStats -anomalies -correlations -trends')
      .sort({ createdAt: -1 })
      .limit(100)
    res.json({ datasets: datasets.map((d) => d.toSummary()) })
  } catch (err) {
    console.error('Get datasets error:', err)
    res.status(500).json({ message: 'Failed to load datasets.' })
  }
})

// ── POST /api/datasets ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      name, type, size, rawSize,
      rowCount, columns, sampleRows, allRows,
      columnStats, tags,
    } = req.body

    if (!name || !type || !columns) {
      return res.status(400).json({ message: 'name, type, and columns are required.' })
    }

    let finalStats = columnStats || {}
    if (Array.isArray(allRows) && allRows.length > 0) {
      const pythonStats = await mlService.profileDataset(allRows)
      if (pythonStats) {
        finalStats = pythonStats
        console.log(`[datasets] ✓ Python profile used for "${name}" (${allRows.length} rows)`)
      } else {
        console.log(`[datasets] ✗ Python unreachable, falling back to JS stats for "${name}"`)
      }
    }

    let anomalies = null
    if (Array.isArray(allRows) && allRows.length > 0) {
      const result = await mlService.detectAnomalies(allRows)
      if (result) {
        anomalies = result
        console.log(`[datasets] ✓ Anomaly detection: ${result.totalOutlierRows} outlier rows across ${Object.keys(result.anomalies).length} columns`)
      }
    }

    let correlations = null
    if (Array.isArray(allRows) && allRows.length > 0) {
      const result = await mlService.computeCorrelations(allRows)
      if (result) {
        correlations = result
        console.log(`[datasets] ✓ Correlations: ${result.topPairs?.length || 0} pair(s) found across ${result.columns?.length || 0} numeric columns`)
      }
    }

    let quality = null
    if (Array.isArray(allRows) && allRows.length > 0) {
      const result = await mlService.computeQuality(allRows)
      if (result) {
        quality = result
        console.log(`[datasets] ✓ Quality score: ${result.score} (${result.grade})`)
      }
    }

    let insights = null
    if (Array.isArray(allRows) && allRows.length > 0) {
      const result = await mlService.generateInsights(allRows)
      if (result) {
        insights = result
        console.log(`[datasets] ✓ Insights: ${result.insights?.length || 0} observations generated`)
      }
    }

    let trends = null
    if (Array.isArray(allRows) && allRows.length > 0) {
      const result = await mlService.detectTrends(allRows)
      if (result) {
        trends = result
        if (result.hasDateColumn) {
          console.log(`[datasets] ✓ Trends: ${result.trends?.length || 0} trend(s) detected on '${result.dateColumn}' over ${result.periodDays} days`)
        } else {
          console.log(`[datasets] ✓ Trends: no date column detected — skipped`)
        }
      }
    }

    const storedSample = sampleRows && sampleRows.length > 0
      ? sampleRows
      : (Array.isArray(allRows) ? allRows.slice(0, 20) : [])

    const existing = await Dataset.findOne({ user: req.user._id, name })
    if (existing) {
      existing.type        = type
      existing.size        = size        || '0 B'
      existing.rawSize     = rawSize     || 0
      existing.rowCount    = rowCount    || 0
      existing.columns     = columns     || []
      existing.sampleRows  = storedSample
      existing.columnStats = finalStats
      if (anomalies)    existing.anomalies    = anomalies
      if (correlations) existing.correlations = correlations
      if (quality)      existing.quality      = quality
      if (insights)     existing.insights     = insights
      if (trends)       existing.trends       = trends
      existing.tags        = tags        || [type.toUpperCase()]
      existing.status      = 'ready'

      existing.markModified('columnStats')
      if (anomalies)    existing.markModified('anomalies')
      if (correlations) existing.markModified('correlations')
      if (quality)      existing.markModified('quality')
      if (insights)     existing.markModified('insights')
      if (trends)       existing.markModified('trends')

      await existing.save()
      return res.json({ dataset: existing.toFull(), updated: true })
    }

    const dataset = await Dataset.create({
      user:         req.user._id,
      name,
      type,
      size:         size        || '0 B',
      rawSize:      rawSize     || 0,
      rowCount:     rowCount    || 0,
      columns:      columns     || [],
      sampleRows:   storedSample,
      columnStats:  finalStats,
      anomalies:    anomalies    || {},
      correlations: correlations || {},
      quality:      quality      || {},
      insights:     insights     || {},
      trends:       trends       || {},
      tags:         tags || [type.toUpperCase()],
      status:       'ready',
    })

    res.status(201).json({ dataset: dataset.toFull() })
  } catch (err) {
    console.error('Create dataset error:', err)
    res.status(500).json({ message: 'Failed to save dataset.' })
  }
})

// ── GET /api/datasets/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, user: req.user._id })
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' })
    res.json({ dataset: dataset.toFull() })
  } catch (err) {
    console.error('Get dataset error:', err)
    res.status(500).json({ message: 'Failed to load dataset.' })
  }
})

// ── DELETE /api/datasets/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!dataset) return res.status(404).json({ message: 'Dataset not found.' })
    res.json({ message: 'Dataset deleted successfully.' })
  } catch (err) {
    console.error('Delete dataset error:', err)
    res.status(500).json({ message: 'Failed to delete dataset.' })
  }
})

// ── DELETE /api/datasets ──────────────────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    const result = await Dataset.deleteMany({ user: req.user._id })
    res.json({ message: `Deleted ${result.deletedCount} datasets.` })
  } catch (err) {
    console.error('Delete all datasets error:', err)
    res.status(500).json({ message: 'Failed to delete datasets.' })
  }
})

module.exports = router