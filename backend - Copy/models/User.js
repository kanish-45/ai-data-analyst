const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    nickname: {
      type:     String,
      required: [true, 'Nickname is required'],
      trim:     true,
      maxlength: [30, 'Nickname cannot exceed 30 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false, // never return password in queries
    },
    plan: {
      type:    String,
      enum:    ['Free', 'Pro', 'Enterprise'],
      default: 'Free',
    },
    avatar: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
)

// ── Hash password before saving ───────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next()
  const salt    = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// ── Compare password method ───────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// ── Return safe user object (no password) ─────────────────────────────────────
UserSchema.methods.toSafeObject = function () {
  return {
    id:        this._id,
    name:      this.name,
    nickname:  this.nickname,
    email:     this.email,
    plan:      this.plan,
    avatar:    this.avatar,
    createdAt: this.createdAt,
  }
}

module.exports = mongoose.model('User', UserSchema)