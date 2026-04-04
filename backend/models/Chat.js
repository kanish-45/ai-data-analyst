const mongoose = require('mongoose')

// ── Message sub-schema ────────────────────────────────────────────────────────
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type:     String,
      enum:     ['user', 'assistant'],
      required: true,
    },
    text: {
      type:     String,
      required: true,
    },
    time: {
      type:    String,
      default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  },
  { _id: true, timestamps: false }
)

// ── Chat Session schema ───────────────────────────────────────────────────────
const ChatSessionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    title: {
      type:    String,
      default: 'New Chat',
      maxlength: 100,
    },
    model: {
      type:    String,
      default: 'llama3.2',
    },
    // Dataset context snapshot (name + column info only — not full data)
    datasetInfo: {
      name:     { type: String, default: null },
      rowCount: { type: Number, default: null },
      columns:  { type: [String], default: [] },
    },
    messages: {
      type:    [MessageSchema],
      default: [],
    },
    // Auto-generated from first user message
    titleGenerated: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
)

// ── Auto-generate title from first user message ───────────────────────────────
ChatSessionSchema.methods.generateTitle = function () {
  if (this.titleGenerated) return
  const firstUserMsg = this.messages.find((m) => m.role === 'user')
  if (firstUserMsg) {
    // Take first 60 chars of first user message as title
    this.title = firstUserMsg.text.slice(0, 60) + (firstUserMsg.text.length > 60 ? '…' : '')
    this.titleGenerated = true
  }
}

// ── Virtual: message count ────────────────────────────────────────────────────
ChatSessionSchema.virtual('messageCount').get(function () {
  return this.messages.length
})

// ── Return safe summary (no full messages for list view) ─────────────────────
ChatSessionSchema.methods.toSummary = function () {
  return {
    id:           this._id,
    title:        this.title,
    model:        this.model,
    datasetInfo:  this.datasetInfo,
    messageCount: this.messages.length,
    lastMessage:  this.messages.length > 0
      ? this.messages[this.messages.length - 1].text.slice(0, 80)
      : null,
    createdAt:    this.createdAt,
    updatedAt:    this.updatedAt,
  }
}

module.exports = mongoose.model('ChatSession', ChatSessionSchema)