/**
 * Downloads real question paper PDFs from public university sources,
 * uploads them to Cloudinary, scores with Gemini, and saves to MongoDB.
 * Also creates 10 new student users.
 *
 * Usage: node scripts/seed-real-papers.js
 * Requires: MONGO_URI, CLOUDINARY_*, GEMINI_API_KEY in .env
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import axios from 'axios'
import User from '../models/User.js'
import Paper from '../models/Paper.js'
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js'
import { extractPdfTextFromBuffer, computeAuthenticityLocal } from '../utils/authenticityLocal.js'
import { checkAuthenticityWithGemini } from '../utils/geminiCheck.js'

dotenv.config()

// URL-encode special characters in the password portion of the MongoDB URI
function fixMongoUri(uri) {
  if (!uri) throw new Error('MONGO_URI not set in .env')
  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
    (_, proto, user, pass) => {
      const decoded = (() => { try { return decodeURIComponent(pass) } catch { return pass } })()
      return `${proto}${user}:${encodeURIComponent(decoded)}@`
    }
  )
}

async function downloadPdf(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 60000,
    headers: { 'User-Agent': 'Mozilla/5.0 (CampusPapers/1.0; +https://campuspapers.vercel.app)' },
    maxRedirects: 5
  })
  return Buffer.from(response.data)
}

// ─── New users to create ─────────────────────────────────────────────────────
const NEW_USERS = [
  { name: 'Arjun Mehta',     email: 'arjun.mehta@vtu.edu',     dept: 'Computer Science' },
  { name: 'Divya Krishnan',  email: 'divya.krishnan@vtu.edu',  dept: 'Electronics & Communication' },
  { name: 'Sanjay Reddy',    email: 'sanjay.reddy@jntu.edu',   dept: 'Mechanical Engineering' },
  { name: 'Kavya Nair',      email: 'kavya.nair@annauniv.edu', dept: 'Information Technology' },
  { name: 'Rohan Desai',     email: 'rohan.desai@annauniv.edu',dept: 'Civil Engineering' },
  { name: 'Ananya Sharma',   email: 'ananya.sharma@vtu.edu',   dept: 'Computer Science' },
  { name: 'Kiran Kumar',     email: 'kiran.kumar@vtu.edu',     dept: 'Electrical Engineering' },
  { name: 'Meera Iyer',      email: 'meera.iyer@annauniv.edu', dept: 'Data Science' },
  { name: 'Suresh Babu',     email: 'suresh.babu@jntu.edu',    dept: 'Computer Science' },
  { name: 'Pooja Singh',     email: 'pooja.singh@annauniv.edu',dept: 'Electronics & Communication' },
]

// ─── Real question paper PDFs from public university sources ─────────────────
const REAL_PAPERS = [
  {
    url: 'https://vtu.ac.in/pdf/QP/BCS304.pdf',
    department: 'Computer Science',
    subject: 'Data Structures and Applications',
    year: 2024, semester: 3,
    university: 'Visvesvaraya Technological University',
    uploaderIdx: 0,
  },
  {
    url: 'https://vtu.ac.in/pdf/QP/BCS401.pdf',
    department: 'Computer Science',
    subject: 'Analysis and Design of Algorithms',
    year: 2024, semester: 4,
    university: 'Visvesvaraya Technological University',
    uploaderIdx: 5,
  },
  {
    url: 'https://vtu.ac.in/pdf/QP/22ESC142set1.pdf',
    department: 'Electrical Engineering',
    subject: 'Introduction to Electrical Engineering',
    year: 2023, semester: 1,
    university: 'Visvesvaraya Technological University',
    uploaderIdx: 6,
  },
  {
    url: 'https://jeppiaarcollege.org/wp-content/uploads/2019/02/II-YEAR-IV-SEM-CS8493-OPERATING-SYSTEMS.pdf',
    department: 'Computer Science',
    subject: 'Operating Systems',
    year: 2022, semester: 4,
    university: 'Anna University',
    uploaderIdx: 0,
  },
  {
    url: 'https://mrcet.com/pdf/Question%20Banks/CSEDS/COMPUTER%20NETWORKS.pdf',
    department: 'Computer Science',
    subject: 'Computer Networks',
    year: 2023, semester: 5,
    university: 'JNTU Hyderabad',
    uploaderIdx: 1,
  },
  {
    url: 'https://mrcet.com/pdf/Question%20Banks/CSECS/SOFTWARE%20ENGINEERING.pdf',
    department: 'Computer Science',
    subject: 'Software Engineering',
    year: 2023, semester: 5,
    university: 'JNTU Hyderabad',
    uploaderIdx: 5,
  },
  {
    url: 'https://srmvalliammai.ac.in/wp-content/uploads/2022/05/1909302-engineering-thermodynamics.pdf',
    department: 'Mechanical Engineering',
    subject: 'Engineering Thermodynamics',
    year: 2022, semester: 3,
    university: 'Anna University',
    uploaderIdx: 2,
  },
  {
    url: 'https://srmvalliammai.ac.in/wp-content/uploads/2022/05/1909301-engineering-mechanics.pdf',
    department: 'Civil Engineering',
    subject: 'Engineering Mechanics',
    year: 2022, semester: 2,
    university: 'Anna University',
    uploaderIdx: 4,
  },
  {
    url: 'https://srmvalliammai.ac.in/wp-content/uploads/2022/05/1904003-computer-networks.pdf',
    department: 'Information Technology',
    subject: 'Computer Networks',
    year: 2022, semester: 5,
    university: 'Anna University',
    uploaderIdx: 3,
  },
  {
    url: 'https://jeppiaarcollege.org/wp-content/uploads/2019/02/II-YEAR-III-SEM-CS8351-DATA-STRUCTURES.pdf',
    department: 'Computer Science',
    subject: 'Data Structures',
    year: 2022, semester: 3,
    university: 'Anna University',
    uploaderIdx: 8,
  },
]

async function run() {
  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(fixMongoUri(process.env.MONGO_URI))
  console.log('✅ Connected\n')

  // ── 1. Create users ────────────────────────────────────────────────────────
  console.log('👥 Creating new users...')
  const createdUsers = []
  for (const u of NEW_USERS) {
    const existing = await User.findOne({ email: u.email })
    if (existing) {
      console.log(`   ↩  Skipped (exists): ${u.email}`)
      createdUsers.push(existing)
      continue
    }
    const hash = await bcrypt.hash('Student@123', 10)
    const user = await User.create({ name: u.name, email: u.email, password: hash, role: 'student' })
    createdUsers.push(user)
    console.log(`   ✅ Created: ${u.name} (${u.email})`)
  }

  const hasGemini = !!process.env.GEMINI_API_KEY
  console.log(`\n🤖 AI scoring: ${hasGemini ? 'Gemini' : 'local TF-IDF fallback'}\n`)

  // ── 2. Upload papers ───────────────────────────────────────────────────────
  console.log('📄 Downloading and uploading question papers...\n')
  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const paper of REAL_PAPERS) {
    const label = `${paper.subject} (${paper.university})`

    // Skip if a paper with this URL already exists
    const exists = await Paper.findOne({ fileUrl: paper.url })
    if (exists) {
      console.log(`   ↩  Skipped (already in DB): ${label}`)
      skipped++
      continue
    }

    try {
      // Download PDF
      process.stdout.write(`   ⬇  Downloading: ${label} ... `)
      const buffer = await downloadPdf(paper.url)
      console.log(`${Math.round(buffer.length / 1024)} KB`)

      // Upload to Cloudinary
      process.stdout.write(`   ☁  Uploading to Cloudinary ... `)
      const cloudResult = await uploadToCloudinary(buffer)
      console.log('done')

      // Extract text
      const extractedText = await extractPdfTextFromBuffer(buffer)

      // AI score
      process.stdout.write(`   🤖 Scoring ... `)
      let aiResult = null
      if (hasGemini) {
        aiResult = await checkAuthenticityWithGemini(extractedText, {
          department: paper.department,
          subject: paper.subject,
          year: paper.year,
          semester: String(paper.semester),
          university: paper.university,
        })
      }
      if (!aiResult) {
        const allTexts = await Paper.find({}).select('extractedText').lean()
        const existing_texts = allTexts.map(p => p.extractedText).filter(Boolean)
        aiResult = computeAuthenticityLocal(extractedText, existing_texts)
      }
      console.log(`score=${aiResult.authenticityScore} authentic=${aiResult.isAuthentic}`)

      const uploader = createdUsers[paper.uploaderIdx]
      await Paper.create({
        department: paper.department,
        subject: paper.subject,
        year: paper.year,
        semester: paper.semester,
        university: paper.university,
        fileUrl: cloudResult.secure_url,
        publicId: cloudResult.public_id,
        uploadedBy: uploader._id,
        aiResult: {
          isAuthentic: aiResult.isAuthentic,
          authenticityScore: aiResult.authenticityScore,
          aiFeedback: aiResult.aiFeedback,
        },
        extractedText: extractedText || '',
        status: 'approved',
        downloads: Math.floor(Math.random() * 60),
      })

      // Update uploader stats
      await User.findByIdAndUpdate(uploader._id, {
        $inc: { 'stats.totalUploads': 1, 'stats.approvedPapers': 1 }
      })

      console.log(`   ✅ Saved: ${label}\n`)
      uploaded++
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err))
      console.log(`\n   ❌ Failed: ${label} — ${msg}\n`)
      failed++
    }
  }

  console.log('─'.repeat(55))
  console.log(`📊 Done: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`)
  console.log(`👥 Users: ${createdUsers.filter(u => u.isNew !== false).length} created / ${NEW_USERS.length} total`)
  console.log('\nAll new users password: Student@123')
  process.exit(0)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
