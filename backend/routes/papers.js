import express from 'express'
import multer from 'multer'
import axios from 'axios'
import { protect, requireRole, optionalProtect } from '../middleware/auth.js'
import { checkOwnership } from '../middleware/ownership.js'
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js'
import { checkAndAwardBadges } from '../utils/badges.js'
import Paper from '../models/Paper.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

router.get('/papers', optionalProtect, async (req, res) => {
  try {
    const { subject, department, year, sort } = req.query

    // Role-based visibility: Admins see all, others only see approved
    const q = {}
    const isAdmin = req.user && req.user.role === 'admin'

    if (!isAdmin) {
      // For non-admins, show all approved papers (regardless of authenticityScore)
      q.status = 'approved'
    }

    if (subject) q.subject = new RegExp(subject, 'i')
    if (department) q.department = new RegExp(department, 'i')
    if (year) q.year = Number(year)

    const sortBy = sort === 'downloads' ? { downloads: -1 } : { createdAt: -1 }
    const items = await Paper.find(q).populate('uploadedBy', 'name _id').sort(sortBy)
    res.json(items)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch' })
  }
})

// Must be registered before GET /papers/:id so "mine" is not treated as an id
router.get('/papers/mine', protect, async (req, res) => {
  try {
    const items = await Paper.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'name _id')
      .sort({ createdAt: -1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch your papers' })
  }
})

const getPaperById = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id)
    if (!paper) return res.status(404).json({ message: 'Not found' })
    req.paper = paper
    next()
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch paper' })
  }
}

router.get('/papers/:id', getPaperById, async (req, res) => {
  try {
    await req.paper.populate('uploadedBy', 'name')
    res.json(req.paper)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.post('/papers/:id/download', async (req, res) => {
  try {
    console.log(`Incrementing downloads for paper: ${req.params.id}`)
    const item = await Paper.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.post('/papers/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { department, subject, year, semester, university } = req.body

    // Validate required fields
    if (!department || !subject || !year || !semester) {
      return res.status(400).json({ message: 'Department, subject, year, and semester are required' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary credentials missing')
      return res.status(500).json({ message: 'Cloudinary configuration missing' })
    }

    // Upload to Cloudinary
    let result
    try {
      result = await uploadToCloudinary(req.file.buffer)
      console.log('File uploaded to Cloudinary:', result.secure_url)
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError)
      return res.status(500).json({
        message: 'Failed to upload file to Cloudinary',
        error: process.env.NODE_ENV === 'development' ? cloudinaryError.message : undefined
      })
    }

    // Try AI service check (make it optional if service is not available)
    let aiResult = {
      isAuthentic: true,
      authenticityScore: 0,
      aiFeedback: 'AI service not available'
    }

    if (process.env.AI_SERVICE_URL) {
      try {
        // Fetch all existing papers' text to check for duplicates
        const allPapers = await Paper.find({}).select('extractedText')
        const existingTexts = allPapers.map(p => p.extractedText).filter(t => t)

        const payload = {
          metadata: { department, subject, year: Number(year), semester, university },
          file_url: result.secure_url,
          existing_texts: existingTexts
        }

        console.log(`Calling AI Service at: ${process.env.AI_SERVICE_URL}/check`)
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/check`, payload, {
          timeout: 60000
        })
        aiResult = aiResponse.data
        console.log('AI check completed successfully')
      } catch (aiError) {
        console.error('AI service error:', aiError.message)
        aiResult.aiFeedback = `Check failed: ${aiError.message}. Please verify AI service is running at ${process.env.AI_SERVICE_URL}`
        aiResult.authenticityScore = 0 // Keep at 0 to indicate check didn't complete
      }
    } else {
      console.log('AI_SERVICE_URL not found in environment variables')
      aiResult.aiFeedback = 'AI_SERVICE_URL not configured in environment'
    }

    // Create paper document
    try {
      const doc = await Paper.create({
        department,
        subject,
        year: Number(year),
        semester,
        university,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        uploadedBy: req.user.id,
        aiResult: {
          isAuthentic: aiResult.isAuthentic,
          authenticityScore: aiResult.authenticityScore,
          aiFeedback: aiResult.aiFeedback
        },
        extractedText: aiResult.extractedText || '',
        status: 'pending'
      })

      console.log('Paper created successfully:', doc._id)
      return res.json(doc)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({
        message: 'Failed to save paper to database',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }
  } catch (e) {
    console.error('Upload route error:', e)
    res.status(500).json({
      message: 'Upload failed',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    })
  }
})

router.put('/papers/:id', protect, getPaperById, checkOwnership, async (req, res) => {
  try {
    const up = await Paper.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(up)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.delete('/papers/:id', protect, getPaperById, checkOwnership, async (req, res) => {
  try {
    await Paper.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.get('/admin/papers', protect, requireRole('admin'), async (req, res) => {
  try {
    const { minScore } = req.query
    const q = {}
    if (minScore) q['aiResult.authenticityScore'] = { $gte: Number(minScore) }
    const items = await Paper.find(q).populate('uploadedBy', 'name _id').sort({ createdAt: -1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.put('/admin/papers/:id/approve', protect, requireRole('admin'), async (req, res) => {
  try {
    const up = await Paper.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
    // Check and award badges when paper is approved
    if (up && up.uploadedBy) {
      await checkAndAwardBadges(up.uploadedBy)
    }
    res.json(up)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.put('/admin/papers/:id/reject', protect, requireRole('admin'), async (req, res) => {
  try {
    const up = await Paper.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
    res.json(up)
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

router.delete('/admin/papers/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Paper.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: 'Failed' })
  }
})

export default router
