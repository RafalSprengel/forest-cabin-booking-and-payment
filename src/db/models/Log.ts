import mongoose from 'mongoose'

const LogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['error', 'warn', 'info'],
    required: true
  },
  event: String,
  message: String,
  context: Object,
  createdAt: { type: Date, default: Date.now }
})

const Log = mongoose.models.Log || mongoose.model('Log', LogSchema)

export default Log