const express = require('express')
const Dataset = require('../models/Dataset')
const auth    = require('../middleware/auth')
const mlService = require('../services/mlService')

const router = express.Router()

// All dataset routes require authentication
router.use(auth)

// ── GET /api/datasets ─────────────────────────────────────────────────────────
// Get all datasets for the logged-in user
router.get('/', async (req, res) => {
  try {
    const datasets = await Dataset
      .find({ user: req.user._id })
      .select('-sampleRows -columnStats')   // exclude heavy fields for list view
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({ datasets: datasets.map((d) => d.toSummary()) })
  } catch (err) {
    console.error('Get datasets error:', err)
    res.status(500).json({ message: 'Failed to load datasets.' })
  }
})

// ── POST /api/datasets ────────────────────────────────────────────────────────
// Save a new parsed dataset
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

    // ── Authoritative stats: prefer Python ML service, fall back to JS ─────
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

    // Store only a sample of rows in the DB (not the full data)
    const storedSample = sampleRows && sampleRows.length > 0
      ? sampleRows
      : (Array.isArray(allRows) ? allRows.slice(0, 20) : [])

    // Update if a dataset with this name already exists for this user
    const existing = await Dataset.findOne({ user: req.user._id, name })
    if (existing) {
      existing.type        = type
      existing.size        = size        || '0 B'
      existing.rawSize     = rawSize     || 0
      existing.rowCount    = rowCount    || 0
      existing.columns     = columns     || []
      existing.sampleRows  = storedSample
      existing.columnStats = finalStats
      existing.tags        = tags        || [type.toUpperCase()]
      existing.status      = 'ready'
      existing.markModified('columnStats')   // Mixed type — required
      await existing.save()
      return res.json({ dataset: existing.toFull(), updated: true })
    }

    // Create new
    const dataset = await Dataset.create({
      user:        req.user._id,
      name,
      type,
      size:        size        || '0 B',
      rawSize:     rawSize     || 0,
      rowCount:    rowCount    || 0,
      columns:     columns     || [],
      sampleRows:  storedSample,
      columnStats: finalStats,
      tags:        tags        || [type.toUpperCase()],
      status:      'ready',
    })

    res.status(201).json({ dataset: dataset.toFull() })
  } catch (err) {
    console.error('Create dataset error:', err)
    res.status(500).json({ message: 'Failed to save dataset.' })
  }
})

// ── GET /api/datasets/:id ─────────────────────────────────────────────────────
// Get a single dataset WITH sample rows (for AI context)
router.get('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found.' })
    }

    res.json({ dataset: dataset.toFull() })
  } catch (err) {
    console.error('Get dataset error:', err)
    res.status(500).json({ message: 'Failed to load dataset.' })
  }
})

// ── DELETE /api/datasets/:id ──────────────────────────────────────────────────
// Delete a single dataset
router.delete('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found.' })
    }

    res.json({ message: 'Dataset deleted successfully.' })
  } catch (err) {
    console.error('Delete dataset error:', err)
    res.status(500).json({ message: 'Failed to delete dataset.' })
  }
})

// ── DELETE /api/datasets ──────────────────────────────────────────────────────
// Delete ALL datasets for the logged-in user
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