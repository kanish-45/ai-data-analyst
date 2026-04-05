const express = require('express')
const Dataset = require('../models/Dataset')
const auth    = require('../middleware/auth')

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
      rowCount, columns, sampleRows,
      columnStats, tags,
    } = req.body

    if (!name || !type || !columns) {
      return res.status(400).json({ message: 'name, type, and columns are required.' })
    }

    // Check if dataset with same name already exists for this user
    const existing = await Dataset.findOne({ user: req.user._id, name })
    if (existing) {
      // Update existing instead of creating duplicate
      existing.type        = type
      existing.size        = size        || '0 B'
      existing.rawSize     = rawSize     || 0
      existing.rowCount    = rowCount    || 0
      existing.columns     = columns     || []
      existing.sampleRows  = sampleRows  || []
      existing.columnStats = columnStats || {}
      existing.tags        = tags        || [type.toUpperCase()]
      existing.status      = 'ready'
      await existing.save()
      return res.json({ dataset: existing.toSummary(), updated: true })
    }

    const dataset = await Dataset.create({
      user:        req.user._id,
      name,
      type,
      size:        size        || '0 B',
      rawSize:     rawSize     || 0,
      rowCount:    rowCount    || 0,
      columns:     columns     || [],
      sampleRows:  sampleRows  || [],
      columnStats: columnStats || {},
      tags:        tags        || [type.toUpperCase()],
      status:      'ready',
    })

    res.status(201).json({ dataset: dataset.toSummary() })
  } catch (err) {
    console.error('Save dataset error:', err)
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