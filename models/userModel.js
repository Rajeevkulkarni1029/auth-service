const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String, required: true },
  contactNumber: { type: Number },
  location: { type: String },
  dateOfBirth: { type: Date },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    require: true,
    trim: true,
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
      'Password must include at least one lowercase letter, one uppercase letter, one number, one special character, and be at least 8 characters long'
    ]
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

userSchema.pre('save', async function (next) {
  if (!this.id) {
    const lastUser = await this.constructor.findOne({}, {}, { sort: { id: -1 } })
    this.id = lastUser ? lastUser.id + 1 : 1
  }
  next()
})

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10)

      const hashedPassword = await bcrypt.hash(this.password, salt)

      this.password = hashedPassword
      next()
    } catch (error) {
      next(error)
    }
  } else {
    next()
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
