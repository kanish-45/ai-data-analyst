const mongoose = require('mongoose')

const DatasetSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    name:       { type: String, required: true, trim: true, maxlength: 200 },
    type:       { type: String, enum: ['csv', 'json', 'xlsx', 'xls'], required: true },
    size:       { type: String, default: '0 B' },
    rawSize:    { type: Number, default: 0 },
    rowCount:   { type: Number, default: 0 },
    columns:    { type: [String], default: [] },
    sampleRows: { type: [mongoose.Schema.Types.Mixed], default: [] },
    columnStats:{ type: mongoose.Schema.Types.Mixed, default: {} },
    anomalies:  { type: mongoose.Schema.Types.Mixed, default: {} },
    tags:       { type: [String], default: [] },
    status:     { type: String, enum: ['ready', 'error'], default: 'ready' },
  },
  { timestamps: true }
)

DatasetSchema.methods.toSummary = function () {
  return {
    id:        this._id,
    name:      this.name,
    type:      this.type,
    size:      this.size,
    rawSize:   this.rawSize,
    rowCount:  this.rowCount,
    columns:   this.columns,
    tags:      this.tags,
    status:    this.status,
    uploaded:  this.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

DatasetSchema.methods.toFull = function () {
  return {
    ...this.toSummary(),
    rows:        this.sampleRows,
    allRows:     this.sampleRows,
    columnStats: this.columnStats,
    anomalies:   this.anomalies,
  }
}

module.exports = mongoose.model('Dataset', DatasetSchema) 