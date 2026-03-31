import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

/**
 * Extract plain text from a PDF buffer (used when the Python AI service is unavailable).
 */
export async function extractPdfTextFromBuffer(buffer) {
  if (!buffer || !buffer.length) return ''
  try {
    const data = await pdfParse(buffer)
    return (data.text || '').trim()
  } catch (e) {
    console.error('Local PDF extract failed:', e.message)
    return ''
  }
}

function termFreq(text) {
  const words = (text || '').toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  const freq = new Map()
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1)
  return freq
}

function cosineSimTf(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (const v of a.values()) na += v * v
  for (const v of b.values()) nb += v * v
  if (!na || !nb) return 0
  for (const [w, va] of a) {
    if (b.has(w)) dot += va * b.get(w)
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * Same idea as ai-service compute_authenticity: compare new text to existing corpus via similarity.
 */
export function computeAuthenticityLocal(newText, existingTexts) {
  const list = (existingTexts || []).filter((t) => t && String(t).trim())
  if (!newText || !String(newText).trim()) {
    return {
      isAuthentic: true,
      authenticityScore: 95,
      aiFeedback: 'Could not extract text from PDF; default score applied.',
      extractedText: ''
    }
  }
  if (list.length === 0) {
    return {
      isAuthentic: true,
      authenticityScore: 95,
      aiFeedback: 'No references provided; treating as authentic by default.',
      extractedText: newText
    }
  }
  const newTf = termFreq(newText)
  let maxSim = 0
  for (const ex of list) {
    const sim = cosineSimTf(termFreq(ex), newTf)
    if (sim > maxSim) maxSim = sim
  }
  const score = Math.max(0, Math.min(100, Math.round((1 - maxSim) * 100)))
  const isAuthentic = maxSim < 0.7
  return {
    isAuthentic,
    authenticityScore: score,
    aiFeedback: isAuthentic ? 'Low similarity to existing items.' : 'Duplication detected',
    extractedText: newText
  }
}
