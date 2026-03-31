import mongoose from 'mongoose'

const paperSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    subject: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    university: { type: String },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    aiResult: {
      isAuthentic: { type: Boolean, default: true },
      authenticityScore: { type: Number, default: 0 },
      aiFeedback: { type: String, default: '' }
    },
    extractedText: { type: String, default: '' },
    downloads: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
)

export default mongoose.model('Paper', paperSchema)
