import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Paper from '../models/Paper.js'

dotenv.config()

const seedDemoData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Connected to MongoDB')

    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('Clearing existing demo data...')
    await User.deleteMany({ email: { $ne: 'admin@campuspapers.com' } }) // Keep admin
    await Paper.deleteMany({})

    // Create sample users
    const sampleUsers = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.cs@college.edu',
        password: 'Student@123',
        role: 'student',
        department: 'Computer Science'
      },
      {
        name: 'Priya Patel',
        email: 'priya.ece@college.edu', 
        password: 'Student@123',
        role: 'student',
        department: 'Electronics & Communication'
      },
      {
        name: 'Amit Kumar',
        email: 'amit.me@college.edu',
        password: 'Student@123',
        role: 'student',
        department: 'Mechanical Engineering'
      },
      {
        name: 'Neha Gupta',
        email: 'neha.it@college.edu',
        password: 'Student@123',
        role: 'student',
        department: 'Information Technology'
      },
      {
        name: 'Vikram Singh',
        email: 'vikram.ce@college.edu',
        password: 'Student@123',
        role: 'student',
        department: 'Civil Engineering'
      }
    ]

    console.log('Creating sample users...')
    const createdUsers = []

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        stats: {
          totalUploads: 0,
          totalViews: 0,
          approvedPapers: 0
        },
        badges: []
      })
      createdUsers.push(user)
      console.log(`✅ Created user: ${user.name} (${user.email})`)
    }

    // Create sample papers
    console.log('\nCreating sample papers...')
    const samplePapers = [
      {
        department: 'Computer Science',
        subject: 'Data Structures & Algorithms',
        year: 2023,
        semester: 1,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-cs-dsa.pdf',
        publicId: 'sample-cs-dsa',
        uploadedBy: createdUsers[0]._id, // Rahul
        aiResult: {
          isAuthentic: true,
          authenticityScore: 95,
          aiFeedback: 'Original content with high academic quality'
        },
        extractedText: 'Data Structures and Algorithms Exam\n\nQuestion 1: Explain the time complexity of Quick Sort algorithm...\n\nQuestion 2: Implement a binary search tree...\n\nQuestion 3: Compare different sorting algorithms...',
        status: 'approved',
        downloads: 45
      },
      {
        department: 'Computer Science',
        subject: 'Database Management Systems',
        year: 2023,
        semester: 1,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-cs-dbms.pdf',
        publicId: 'sample-cs-dbms',
        uploadedBy: createdUsers[0]._id, // Rahul
        aiResult: {
          isAuthentic: true,
          authenticityScore: 88,
          aiFeedback: 'Good content with relevant database concepts'
        },
        extractedText: 'Database Management Systems Exam\n\nQuestion 1: Normalize the given table to 3NF...\n\nQuestion 2: Write SQL queries for complex joins...\n\nQuestion 3: Explain ACID properties...',
        status: 'approved',
        downloads: 32
      },
      {
        department: 'Electronics & Communication',
        subject: 'Digital Signal Processing',
        year: 2023,
        semester: 2,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-ece-dsp.pdf',
        publicId: 'sample-ece-dsp',
        uploadedBy: createdUsers[1]._id, // Priya
        aiResult: {
          isAuthentic: true,
          authenticityScore: 92,
          aiFeedback: 'Comprehensive coverage of DSP topics'
        },
        extractedText: 'Digital Signal Processing Exam\n\nQuestion 1: Explain Fourier Transform and its applications...\n\nQuestion 2: Design a digital filter...\n\nQuestion 3: Compare analog and digital signal processing...',
        status: 'approved',
        downloads: 28
      },
      {
        department: 'Mechanical Engineering',
        subject: 'Thermodynamics',
        year: 2022,
        semester: 1,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-me-thermo.pdf',
        publicId: 'sample-me-thermo',
        uploadedBy: createdUsers[2]._id, // Amit
        aiResult: {
          isAuthentic: true,
          authenticityScore: 85,
          aiFeedback: 'Standard thermodynamics problems and solutions'
        },
        extractedText: 'Thermodynamics Exam\n\nQuestion 1: Explain the laws of thermodynamics...\n\nQuestion 2: Calculate efficiency of Carnot cycle...\n\nQuestion 3: Analyze heat transfer processes...',
        status: 'approved',
        downloads: 19
      },
      {
        department: 'Information Technology',
        subject: 'Computer Networks',
        year: 2023,
        semester: 2,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-it-networks.pdf',
        publicId: 'sample-it-networks',
        uploadedBy: createdUsers[3]._id, // Neha
        aiResult: {
          isAuthentic: true,
          authenticityScore: 90,
          aiFeedback: 'Well-structured networking concepts'
        },
        extractedText: 'Computer Networks Exam\n\nQuestion 1: Explain OSI model layers...\n\nQuestion 2: Design a network topology...\n\nQuestion 3: Compare TCP and UDP protocols...',
        status: 'approved',
        downloads: 37
      },
      {
        department: 'Civil Engineering',
        subject: 'Structural Analysis',
        year: 2023,
        semester: 1,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-ce-structures.pdf',
        publicId: 'sample-ce-structures',
        uploadedBy: createdUsers[4]._id, // Vikram
        aiResult: {
          isAuthentic: true,
          authenticityScore: 87,
          aiFeedback: 'Good coverage of structural analysis topics'
        },
        extractedText: 'Structural Analysis Exam\n\nQuestion 1: Analyze determinate structures...\n\nQuestion 2: Calculate bending moments and shear forces...\n\nQuestion 3: Design beam elements...',
        status: 'pending', // This one needs admin approval
        downloads: 0
      },
      {
        department: 'Computer Science',
        subject: 'Operating Systems',
        year: 2022,
        semester: 2,
        university: 'Technical University',
        fileUrl: 'https://res.cloudinary.com/dvr9qnzew/image/upload/v1/sample-cs-os.pdf',
        publicId: 'sample-cs-os',
        uploadedBy: createdUsers[0]._id, // Rahul
        aiResult: {
          isAuthentic: true,
          authenticityScore: 93,
          aiFeedback: 'Comprehensive OS concepts covered'
        },
        extractedText: 'Operating Systems Exam\n\nQuestion 1: Explain process scheduling algorithms...\n\nQuestion 2: Describe memory management techniques...\n\nQuestion 3: Compare different file systems...',
        status: 'approved',
        downloads: 52
      }
    ]

    // Create papers
    for (const paperData of samplePapers) {
      const paper = await Paper.create(paperData)
      console.log(`✅ Created paper: ${paper.subject} (${paper.department})`)
    }

    // Update user stats
    console.log('\nUpdating user statistics...')
    for (const user of createdUsers) {
      const userPapers = await Paper.find({ uploadedBy: user._id })
      const approvedPapers = await Paper.find({ uploadedBy: user._id, status: 'approved' })
      const totalDownloads = userPapers.reduce((sum, paper) => sum + paper.downloads, 0)

      await User.findByIdAndUpdate(user._id, {
        'stats.totalUploads': userPapers.length,
        'stats.approvedPapers': approvedPapers.length,
        'stats.totalViews': totalDownloads
      })
    }

    // Award badges based on achievements
    console.log('\nAwarding badges...')
    for (const user of createdUsers) {
      const userStats = await User.findById(user._id).select('stats')
      const badges = []

      if (userStats.stats.totalUploads >= 3) badges.push('Prolific Contributor')
      if (userStats.stats.totalViews >= 50) badges.push('Popular Uploader')
      if (userStats.stats.approvedPapers >= 2) badges.push('Quality Contributor')
      if (userStats.stats.totalUploads >= 1) badges.push('First Upload')

      await User.findByIdAndUpdate(user._id, { badges })
      if (badges.length > 0) {
        console.log(`🏆 ${user.name} earned badges: ${badges.join(', ')}`)
      }
    }

    console.log('\n🎉 Demo data created successfully!')
    console.log('\n📊 Sample Users Created:')
    createdUsers.forEach(user => {
      console.log(`   ${user.name} - ${user.email} (Password: Student@123)`)
    })

    console.log('\n📚 Sample Papers Created:', samplePapers.length, 'papers')
    console.log('\n🔑 Login Credentials:')
    console.log('   Admin: admin@campuspapers.com / Admin@123')
    console.log('   Students: All use password: Student@123')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding demo data:', error.message)
    process.exit(1)
  }
}

seedDemoData()
