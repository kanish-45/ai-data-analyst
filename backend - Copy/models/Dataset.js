const mongoose = require('mongoose')

const DatasetSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    name: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['csv', 'json', 'xlsx', 'xls'],
      required: true,
    },
    size: {
      type:    String,   // human-readable e.g. "2.4 MB"
      default: '0 B',
    },
    rawSize: {
      type:    Number,   // bytes
      default: 0,
    },
    rowCount: {
      type:    Number,
      default: 0,
    },
    columns: {
      type:    [String],
      default: [],
    },
    // Store first 20 rows as sample for preview & AI context
    sampleRows: {
      type:    [mongoose.Schema.Types.Mixed],
      default: [],
    },
    // Numeric column statistics
    columnStats: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type:    [String],
      default: [],
    },
    status: {
      type:    String,
      enum:    ['ready', 'error'],
      default: 'ready',
    },
  },
  {
    timestamps: true,
  }
)

// ── Return safe summary ───────────────────────────────────────────────────────
DatasetSchema.methods.toSummary = function () {
  return {
    id:          this._id,
    name:        this.name,
    type:        this.type,
    size:        this.size,
    rawSize:     this.rawSize,
    rowCount:    this.rowCount,
    columns:     this.columns,
    tags:        this.tags,
    status:      this.status,
    uploaded:    this.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt:   this.createdAt,
    updatedAt:   this.updatedAt,
  }
}

// ── Return full dataset (with sample rows for AI context) ─────────────────────
DatasetSchema.methods.toFull = function () {
  return {
    ...this.toSummary(),
    rows:        this.sampleRows,
    allRows:     this.sampleRows,
    columnStats: this.columnStats,
  }
}

module.exports = mongoose.model('Dataset', DatasetSchema)