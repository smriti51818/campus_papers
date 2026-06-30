/**
 * Re-scores all existing papers in the database using Gemini AI.
 * For papers with extractedText already stored, uses that directly.
 * For papers with real Cloudinary URLs, downloads and re-extracts.
 *
 * Usage: node scripts/rescore-gemini.js
 * Requires: MONGO_URI, GEMINI_API_KEY in .env
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import axios from 'axios'
import Paper from '../models/Paper.js'
import { extractPdfTextFromBuffer, computeAuthenticityLocal } from '../utils/authenticityLocal.js'
import { checkAuthenticityWithGemini } from '../utils/geminiCheck.js'

dotenv.config()

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

async function tryDownloadPdf(url) {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (CampusPapers/1.0)' },
      maxRedirects: 5
    })
    return Buffer.from(res.data)
  } catch {
    return null
  }
}

async function run() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set. Add it to your .env and retry.')
    process.exit(1)
  }

  console.log('🔗 Connecting to MongoDB...')
  await mongoose.connect(fixMongoUri(process.env.MONGO_URI))
  console.log('✅ Connected\n')

  const papers = await Paper.find({}).lean()
  console.log(`📋 Found ${papers.length} papers to re-score\n`)

  let updated = 0
  let unchanged = 0
  let failed = 0

  for (const paper of papers) {
    const label = `${paper.subject} | ${paper.department} (${paper._id})`
    process.stdout.write(`🔄 ${label} ... `)

    let text = paper.extractedText || ''

    // If no stored text, try downloading from fileUrl (only real Cloudinary URLs)
    if (!text && paper.fileUrl && paper.fileUrl.includes('cloudinary.com')) {
      const buf = await tryDownloadPdf(paper.fileUrl)
      if (buf) {
        text = await extractPdfTextFromBuffer(buf)
      }
    }

    if (!text || text.trim().length < 50) {
      console.log('⚠  skipped (no usable text)')
      unchanged++
      continue
    }

    try {
      const aiResult = await checkAuthenticityWithGemini(text, {
        department: paper.department,
        subject: paper.subject,
        year: paper.year,
        semester: String(paper.semester),
        university: paper.university,
      })

      if (!aiResult) {
        console.log('⚠  Gemini returned null, skipping')
        unchanged++
        continue
      }

      await Paper.findByIdAndUpdate(paper._id, {
        'aiResult.isAuthentic': aiResult.isAuthentic,
        'aiResult.authenticityScore': aiResult.authenticityScore,
        'aiResult.aiFeedback': aiResult.aiFeedback,
        ...(text !== paper.extractedText ? { extractedText: text } : {}),
      })

      const prev = paper.aiResult?.authenticityScore ?? '?'
      console.log(`✅ ${prev} → ${aiResult.authenticityScore} | ${aiResult.aiFeedback.slice(0, 70)}`)
      updated++
    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
    }

    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\n' + '─'.repeat(55))
  console.log(`📊 Re-score complete: ${updated} updated, ${unchanged} skipped, ${failed} errors`)
  process.exit(0)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
