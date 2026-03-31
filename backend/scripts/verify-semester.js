import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Paper from '../models/Paper.js'

dotenv.config()

const verifySemester = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const papers = await Paper.find().select('department subject year semester')
    console.log('Sample papers with semester values:')
    papers.forEach(p => {
      console.log(`${p.subject} (${p.department}) - Year: ${p.year}, Semester: ${p.semester} (${typeof p.semester})`)
    })

    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

verifySemester()
