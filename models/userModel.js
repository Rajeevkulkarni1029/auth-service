const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true,},
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
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
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

userSchema.pre('save', async function (next) {
  if (!this.id) {
    const lastUser = await this.constructor.findOne({}, {}, { sort: { id: -1 } })
    this.id = lastUser ? lastUser.id + 1 : 1
  }
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
