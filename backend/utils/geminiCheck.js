import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_TEXT_CHARS = 4000

function buildPrompt(text, metadata) {
  const snippet = text.slice(0, MAX_TEXT_CHARS)
  return `You are an academic document validator. Analyze the extracted text below and determine if it is a legitimate exam question paper.

Document Metadata:
- Subject: ${metadata.subject}
- Department: ${metadata.department}
- Year: ${metadata.year}
- Semester: ${metadata.semester}${metadata.university ? `\n- University: ${metadata.university}` : ''}

Extracted Text:
${snippet}

Evaluate on these criteria:
1. Is this a real exam/question paper? (has numbered questions, marks allocation, exam instructions)
2. Are the questions actually relevant to "${metadata.subject}" in "${metadata.department}"?
3. Is it an academic exam format — not a textbook, notes, syllabus, or random document?

Respond ONLY with a valid JSON object, no markdown, no explanation outside JSON:
{
  "isAuthentic": true or false,
  "authenticityScore": number between 0 and 100,
  "aiFeedback": "one or two sentence explanation"
}

Score guide:
- 85-100: Clearly a legitimate question paper, highly relevant to stated subject
- 60-84: Likely a question paper but partially relevant or minor format issues
- 40-59: Questionable — may not be a proper question paper or relevance is unclear
- 0-39: Not a question paper, or completely irrelevant to stated subject`
}

export async function checkAuthenticityWithGemini(extractedText, metadata) {
  if (!process.env.GEMINI_API_KEY) return null

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(buildPrompt(extractedText || '', metadata))
    const raw = result.response.text().trim()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON object found in Gemini response')

    const parsed = JSON.parse(jsonMatch[0])

    const score = Number(parsed.authenticityScore)
    if (Number.isNaN(score)) throw new Error('Invalid authenticityScore in response')

    return {
      isAuthentic: Boolean(parsed.isAuthentic),
      authenticityScore: Math.max(0, Math.min(100, Math.round(score))),
      aiFeedback: String(parsed.aiFeedback || 'Gemini AI check completed').trim(),
      extractedText: extractedText || ''
    }
  } catch (e) {
    console.error('Gemini check error:', e.message)
    return null
  }
}
