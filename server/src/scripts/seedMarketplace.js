import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import DeveloperProfile from '../models/DeveloperProfile.js';
import Category from '../models/Category.js';
import App from '../models/App.js';

/**
 * Seed script for Phase 3 Public App Marketplace.
 * Creates categories, realistic developers, and 10 production-quality published apps,
 * plus 2 hidden test apps (Draft & Private) for automated security assertions.
 */
const seedMarketplace = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Seeding script is strictly forbidden in production mode.');
    process.exit(1);
  }

  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB database.');

    // 1. SEED CATEGORIES
    const categoriesData = [
      {
        name: 'Education',
        slug: 'education',
        description: 'Interactive learning, academic management, and micro-skills platforms.',
        icon: '🎓',
        order: 1,
        status: 'ACTIVE',
      },
      {
        name: 'Productivity',
        slug: 'productivity',
        description: 'Tools, planners, and automated workflows designed for maximum output.',
        icon: '⚡',
        order: 2,
        status: 'ACTIVE',
      },
      {
        name: 'Health',
        slug: 'health',
        description: 'Cardiovascular tracking, telemetry monitors, and fitness diagnostics.',
        icon: '❤️',
        order: 3,
        status: 'ACTIVE',
      },
      {
        name: 'Finance',
        slug: 'finance',
        description: 'Decentralized ledgers, budget trackers, and automated expense analysts.',
        icon: '💳',
        order: 4,
        status: 'ACTIVE',
      },
      {
        name: 'Utilities',
        slug: 'utilities',
        description: 'IoT device controllers, smart meters, network testers, and system tools.',
        icon: '🛠️',
        order: 5,
        status: 'ACTIVE',
      },
      {
        name: 'AI',
        slug: 'ai',
        description: 'Machine learning, on-device neural inferencing, and generative models.',
        icon: '🤖',
        order: 6,
        status: 'ACTIVE',
      },
      {
        name: 'Developer Tools',
        slug: 'developer-tools',
        description: 'APIs, code reviewers, Android telemetry loggers, and SDK sandboxes.',
        icon: '💻',
        order: 7,
        status: 'ACTIVE',
      },
      {
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Low-latency media players, visualizers, and interactive experiences.',
        icon: '🎮',
        order: 8,
        status: 'ACTIVE',
      },
    ];

    const categoryMap = {};
    for (const catData of categoriesData) {
      let cat = await Category.findOne({ slug: catData.slug });
      if (!cat) {
        cat = await Category.create(catData);
      } else {
        cat.name = catData.name;
        cat.description = catData.description;
        cat.icon = catData.icon;
        cat.order = catData.order;
        cat.status = catData.status;
        await cat.save();
      }
      categoryMap[cat.slug] = cat._id;
    }
    console.log(`[Seed] Seeded ${Object.keys(categoryMap).length} categories.`);

    // 2. SEED DEVELOPERS
    const developersData = [
      {
        email: 'dev.aura@apporbit.io',
        name: 'AuraHealth Labs',
        password: 'Password123!',
        bio: 'Biomedical engineering group specializing in real-time Android wearable telemetry.',
        companyName: 'AuraHealth Technologies Inc.',
        website: 'https://aurahealth.io',
        githubProfile: 'https://github.com/aurahealth',
        verificationStatus: 'VERIFIED',
      },
      {
        email: 'dev.aquaflow@apporbit.io',
        name: 'AquaFlow Dynamics',
        password: 'Password123!',
        bio: 'Developing low-power IoT telemetry apps for smart water management and utilities.',
        companyName: 'AquaFlow IoT Systems',
        website: 'https://aquaflow.io',
        githubProfile: 'https://github.com/aquaflow-iot',
        verificationStatus: 'VERIFIED',
      },
      {
        email: 'dev.edusphere@apporbit.io',
        name: 'EduSphere Technologies',
        password: 'Password123!',
        bio: 'Next-generation EdTech platform building accessible academic tools across developing regions.',
        companyName: 'EduSphere Global',
        website: 'https://edusphere.learn',
        githubProfile: 'https://github.com/edusphere-tech',
        verificationStatus: 'VERIFIED',
      },
      {
        email: 'dev.pulsedev@apporbit.io',
        name: 'PulseDev Studios',
        password: 'Password123!',
        bio: 'Independent Android studio engineering high-performance productivity and utility software.',
        companyName: 'PulseDev Studios LLC',
        website: 'https://pulsedev.org',
        githubProfile: 'https://github.com/pulsedev',
        verificationStatus: 'VERIFIED',
      },
    ];

    const devMap = {};
    for (const d of developersData) {
      let user = await User.findOne({ email: d.email });
      if (!user) {
        user = await User.create({
          name: d.name,
          email: d.email,
          password: d.password,
          role: 'DEVELOPER',
          accountStatus: 'ACTIVE',
          emailVerified: true,
          bio: d.bio,
          profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(d.name)}`,
          githubUrl: d.githubProfile,
        });
      }

      let profile = await DeveloperProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = await DeveloperProfile.create({
          userId: user._id,
          developerStatus: 'ACTIVE',
          verificationStatus: d.verificationStatus,
          companyName: d.companyName,
          website: d.website,
          githubProfile: d.githubProfile,
          developerBio: d.bio,
        });
      }
      devMap[d.email] = user._id;
    }
    console.log(`[Seed] Seeded ${Object.keys(devMap).length} verified developers.`);

    // 3. SEED PRODUCTION APPLICATIONS
    const appsData = [
      {
        name: 'PulseGuard',
        slug: 'pulseguard',
        shortDescription: 'AI-driven cardiac telemetry and real-time vital signs monitor.',
        description:
          'PulseGuard is an advanced Android medical companion that pairs with wearable Bluetooth sensors to track arrhythmia, blood oxygen, and heart rate variability with clinical-grade accuracy.\n\n### Key Capabilities\n- Continuous real-time PPG waveform telemetry\n- Neural inferencing engine executed locally on device\n- Zero-latency notification triggers for abnormal cardiac events\n- Secure, encrypted HL7/FHIR compliant medical report exports',
        icon: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.aura@apporbit.io'],
        category: categoryMap['health'],
        tags: ['Health', 'Cardiology', 'AI', 'Bluetooth', 'Sensors'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Continuous PPG waveform sensor telemetry',
          'Offline emergency detection neural model',
          'Encrypted HL7/FHIR compliant medical export',
          'Low energy background sensor synchronization',
        ],
        technologies: ['Kotlin', 'TensorFlow Lite', 'Bluetooth BLE', 'Room DB', 'Coroutines'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
            alt: 'PulseGuard Live Telemetry Dashboard',
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80',
            alt: 'Cardiac Waveform Analysis View',
            order: 2,
          },
          {
            url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
            alt: 'Historical Trend Graph',
            order: 3,
          },
        ],
        demoVideo: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          provider: 'youtube',
        },
        githubUrl: 'https://github.com/aurahealth/pulseguard-android',
        demoUrl: 'https://pulseguard.aurahealth.io',
        currentVersion: {
          version: '2.4.0',
          versionCode: 24,
          releaseNotes: 'Optimized BLE sensor sync latency and added dark mode clinical view.',
          releaseDate: new Date('2026-08-20'),
          fileSize: '24.8 MB',
          minAndroid: 'Android 9.0 (API 28)',
        },
        downloadCount: 48500,
        viewCount: 142000,
        ratingAverage: 4.9,
        ratingCount: 1420,
        featured: true,
        featuredOrder: 1,
        publishedAt: new Date('2026-08-01'),
      },
      {
        name: 'SmartWater',
        slug: 'smartwater',
        shortDescription: 'Industrial and residential IoT flow telemetry and leak detection.',
        description:
          'SmartWater connects directly with smart flow meters and ultrasound acoustic sensors to monitor water consumption patterns, detect silent underground leaks, and automate shutoff valves.\n\n### Highlights\n- Micro-leak acoustic vibration threshold analysis\n- Automated emergency shutoff triggering\n- Municipal tariff estimation and conservation advice\n- Comprehensive battery & mesh network status diagnostics',
        icon: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.aquaflow@apporbit.io'],
        category: categoryMap['utilities'],
        tags: ['IoT', 'Utilities', 'Smart Home', 'Sensors', 'Water'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Micro-leak acoustic threshold monitoring',
          'Remote motorized shutoff valve triggering',
          'Tiered municipal billing consumption predictor',
          'Solar battery status and wireless signal heatmaps',
        ],
        technologies: ['Flutter', 'MQTT', 'Node-RED', 'SQLite', 'Bloc'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80',
            alt: 'SmartWater Flow Analytics',
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
            alt: 'Valve Controller Interface',
            order: 2,
          },
        ],
        demoVideo: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          provider: 'youtube',
        },
        githubUrl: 'https://github.com/aquaflow-iot/smartwater-app',
        demoUrl: 'https://smartwater.aquaflow.io',
        currentVersion: {
          version: '1.4.2',
          versionCode: 14,
          releaseNotes: 'Introduced automated shutoff protocol for catastrophic bursts.',
          releaseDate: new Date('2026-08-15'),
          fileSize: '18.4 MB',
          minAndroid: 'Android 8.0 (API 26)',
        },
        downloadCount: 21900,
        viewCount: 68000,
        ratingAverage: 4.7,
        ratingCount: 830,
        featured: true,
        featuredOrder: 2,
        publishedAt: new Date('2026-07-28'),
      },
      {
        name: 'School Saathi',
        slug: 'school-saathi',
        shortDescription: 'Integrated K-12 academic administration and hybrid classrooms.',
        description:
          'School Saathi bridges educators, students, and parents with real-time biometric attendance notifications, digital report cards, syllabus planners, and localized micro-learning modules.\n\n### Core Modules\n- Biometric and QR attendance check-in\n- Instant SMS and push alerts for parents\n- Homework submission portal with voice note annotations\n- Offline-first cache architecture for low-connectivity regions',
        icon: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.edusphere@apporbit.io'],
        category: categoryMap['education'],
        tags: ['Education', 'Schools', 'Teachers', 'Attendance', 'Offline'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Biometric and QR-code attendance logging',
          'Instant bilingual parent notification relays',
          'Encrypted gradebook with exportable state-board transcripts',
          'Offline curriculum sync with auto-reconnect upload',
        ],
        technologies: ['React Native', 'Node.js', 'Redux Toolkit', 'SQLite', 'WebRTC'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
            alt: 'Student Attendance Dashboard',
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
            alt: 'Digital Homework Planner',
            order: 2,
          },
        ],
        demoVideo: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          provider: 'youtube',
        },
        githubUrl: 'https://github.com/edusphere-tech/school-saathi',
        demoUrl: 'https://schoolsaathi.edusphere.learn',
        currentVersion: {
          version: '3.0.1',
          versionCode: 30,
          releaseNotes: 'Added multilingual UI localization and speech-to-text assignment notes.',
          releaseDate: new Date('2026-08-10'),
          fileSize: '32.1 MB',
          minAndroid: 'Android 7.0 (API 24)',
        },
        downloadCount: 35000,
        viewCount: 94000,
        ratingAverage: 4.8,
        ratingCount: 1150,
        featured: true,
        featuredOrder: 3,
        publishedAt: new Date('2026-07-15'),
      },
      {
        name: 'HostelEase',
        slug: 'hostelease',
        shortDescription: 'Digital resident check-in, mess management, and curfew compliance.',
        description:
          'HostelEase modernizes university accommodation facilities. Manage hostel room allocation, digital out-passes, biometric curfew tracking, and weekly mess menu feedback seamlessly.',
        icon: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.pulsedev@apporbit.io'],
        category: categoryMap['productivity'],
        tags: ['Productivity', 'Campus', 'Hostel', 'Management'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Curfew geofence check-ins',
          'Digital warden out-pass approvals',
          'Mess meal QR scanner',
          'Emergency panic trigger',
        ],
        technologies: ['Flutter', 'Firebase', 'Cloud Functions', 'Provider'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80',
            alt: 'HostelEase Resident Dashboard',
            order: 1,
          },
        ],
        demoVideo: {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          provider: 'youtube',
        },
        githubUrl: 'https://github.com/pulsedev/hostelease-app',
        demoUrl: 'https://hostelease.pulsedev.org',
        currentVersion: {
          version: '1.2.0',
          versionCode: 12,
          releaseNotes: 'Fixed GPS beacon drift in dense concrete hostel blocks.',
          releaseDate: new Date('2026-08-05'),
          fileSize: '16.5 MB',
          minAndroid: 'Android 8.0 (API 26)',
        },
        downloadCount: 14200,
        viewCount: 42000,
        ratingAverage: 4.6,
        ratingCount: 410,
        featured: true,
        featuredOrder: 4,
        publishedAt: new Date('2026-08-02'),
      },
      {
        name: 'FinTrack Pro',
        slug: 'fintrack-pro',
        shortDescription: 'Zero-knowledge personal finance engine and automated SMS parser.',
        description:
          'FinTrack Pro runs completely client-side to parse banking SMS alerts, categorize spending, forecast utility bills, and generate visual balance sheets without sending your financial data to any external server.',
        icon: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.pulsedev@apporbit.io'],
        category: categoryMap['finance'],
        tags: ['Finance', 'Privacy', 'Offline', 'Budget', 'Money'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          '100% offline SMS transaction parsing',
          'Biometric app locker & AES-256 local database',
          'Recurring bill prediction algorithm',
          'Custom budget envelopes with alert thresholds',
        ],
        technologies: ['Kotlin', 'Jetpack Compose', 'SQLCipher', 'Coroutines'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
            alt: 'FinTrack Expense Breakdown',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/pulsedev/fintrack-pro',
        demoUrl: 'https://fintrack.pulsedev.org',
        currentVersion: {
          version: '2.1.0',
          versionCode: 21,
          releaseNotes: 'Enhanced regex patterns for 45 international banking institutions.',
          releaseDate: new Date('2026-08-18'),
          fileSize: '14.2 MB',
          minAndroid: 'Android 9.0 (API 28)',
        },
        downloadCount: 28900,
        viewCount: 79000,
        ratingAverage: 4.8,
        ratingCount: 960,
        featured: true,
        featuredOrder: 5,
        publishedAt: new Date('2026-08-12'),
      },
      {
        name: 'NeuralSketch AI',
        slug: 'neuralsketch-ai',
        shortDescription: 'On-device generative vector illustration and doodle enhancement.',
        description:
          'Turn rough finger sketches into photorealistic renders or clean SVG vector art in milliseconds using lightweight, on-device neural diffusion models designed for modern Android NPUs.',
        icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.aura@apporbit.io'],
        category: categoryMap['ai'],
        tags: ['AI', 'Creativity', 'Neural Network', 'Drawing', 'Design'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'On-device PyTorch Mobile inferencing',
          'Unlimited offline SVG and 4K PNG exports',
          'Pressure sensitive stylus support (S-Pen)',
          'Zero cloud roundtrip latency',
        ],
        technologies: ['Flutter', 'PyTorch Mobile', 'Skia Engine', 'C++ NDK'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            alt: 'NeuralSketch Canvas Preview',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/aurahealth/neuralsketch-ai',
        demoUrl: 'https://neuralsketch.aurahealth.io',
        currentVersion: {
          version: '1.0.5',
          versionCode: 10,
          releaseNotes: 'Added Snapdragon NPU acceleration kernel.',
          releaseDate: new Date('2026-08-22'),
          fileSize: '45.0 MB',
          minAndroid: 'Android 10.0 (API 29)',
        },
        downloadCount: 52000,
        viewCount: 165000,
        ratingAverage: 4.9,
        ratingCount: 1890,
        featured: true,
        featuredOrder: 6,
        publishedAt: new Date('2026-08-16'),
      },
      {
        name: 'StudyFlow',
        slug: 'studyflow',
        shortDescription: 'Spaced repetition flashcards with Pomodoro study intervals.',
        description:
          'StudyFlow helps medical and engineering candidates retain complex formulas and vocabulary with scientifically calibrated SM-2 spaced repetition algorithms and distraction-free audio timers.',
        icon: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.edusphere@apporbit.io'],
        category: categoryMap['education'],
        tags: ['Education', 'Flashcards', 'Pomodoro', 'Learning'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Adaptive SM-2 scheduling algorithm',
          'Markdown and LaTeX formula syntax rendering',
          'Ambient white-noise generator',
          'Cross-device peer-to-peer sync',
        ],
        technologies: ['Kotlin', 'Jetpack Compose', 'Room', 'Koin'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
            alt: 'StudyFlow Flashcard Deck',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/edusphere-tech/studyflow',
        demoUrl: 'https://studyflow.edusphere.learn',
        currentVersion: {
          version: '1.8.0',
          versionCode: 18,
          releaseNotes: 'Enabled LaTeX mathematical rendering inside flashcard cards.',
          releaseDate: new Date('2026-08-01'),
          fileSize: '12.8 MB',
          minAndroid: 'Android 8.0 (API 26)',
        },
        downloadCount: 18400,
        viewCount: 49000,
        ratingAverage: 4.5,
        ratingCount: 520,
        featured: false,
        publishedAt: new Date('2026-07-20'),
      },
      {
        name: 'CodeMate',
        slug: 'codemate',
        shortDescription: 'Offline Git repository viewer, diff inspector, and syntax highlighter.',
        description:
          'Review pull requests, inspect commit history, and examine source code right from your Android tablet or phone with full offline tree caching and syntax themes.',
        icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.pulsedev@apporbit.io'],
        category: categoryMap['developer-tools'],
        tags: ['Developer Tools', 'Git', 'Code', 'Open Source'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Side-by-side unified git diff inspector',
          'Syntax highlighting for 60+ programming languages',
          'SSH key pair generation and management',
          'Direct cherry-pick and commit creation',
        ],
        technologies: ['React Native', 'Golang Mobile', 'libgit2', 'SQLite'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            alt: 'CodeMate Repository Inspector',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/pulsedev/codemate-mobile',
        demoUrl: 'https://codemate.pulsedev.org',
        currentVersion: {
          version: '2.0.2',
          versionCode: 22,
          releaseNotes: 'Upgraded libgit2 binding for 3x faster blame parsing.',
          releaseDate: new Date('2026-08-14'),
          fileSize: '21.0 MB',
          minAndroid: 'Android 8.1 (API 27)',
        },
        downloadCount: 41200,
        viewCount: 98000,
        ratingAverage: 4.9,
        ratingCount: 1380,
        featured: false,
        publishedAt: new Date('2026-07-22'),
      },
      {
        name: 'BudgetWise',
        slug: 'budgetwise',
        shortDescription: 'Collaborative household expense split and shared groceries tally.',
        description:
          'Split rent, groceries, and weekend utility bills with roommates or family members without awkward conversations. Automated monthly settlements via local payment apps.',
        icon: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.aquaflow@apporbit.io'],
        category: categoryMap['finance'],
        tags: ['Finance', 'Budget', 'Splitting', 'Roommates'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Group expense splitting with unequal shares',
          'Receipt camera OCR scanning',
          'Offline receipt caching',
          'One-click UPI payment deep links',
        ],
        technologies: ['Flutter', 'SQLite', 'Tesseract OCR', 'Riverpod'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80',
            alt: 'BudgetWise Group Balances',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/aquaflow-iot/budgetwise-app',
        demoUrl: 'https://budgetwise.aquaflow.io',
        currentVersion: {
          version: '1.3.1',
          versionCode: 13,
          releaseNotes: 'Introduced camera auto-focus optimization for receipt scanning.',
          releaseDate: new Date('2026-07-30'),
          fileSize: '17.3 MB',
          minAndroid: 'Android 8.0 (API 26)',
        },
        downloadCount: 12500,
        viewCount: 36000,
        ratingAverage: 4.4,
        ratingCount: 310,
        featured: false,
        publishedAt: new Date('2026-07-10'),
      },
      {
        name: 'TravelEase',
        slug: 'travelease',
        shortDescription: 'Offline topographic trail navigation and emergency SOS beacon.',
        description:
          'Explore wilderness trails, national parks, and mountain passes without cellular connectivity. Pre-download vector topological maps and track elevation profiles in real-time.',
        icon: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&auto=format&fit=crop&q=80',
        developer: devMap['dev.aquaflow@apporbit.io'],
        category: categoryMap['utilities'],
        tags: ['Utilities', 'Travel', 'Navigation', 'Offline Maps', 'Hiking'],
        platform: 'ANDROID',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        features: [
          'Offline vector topographic map renderer',
          'Barometric sensor altitude calibration',
          'Emergency SOS strobe and satellite message relay',
          'Waypoints GPX import and export',
        ],
        technologies: ['Kotlin', 'MapLibre Native', 'Room DB', 'Sensors API'],
        screenshots: [
          {
            url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
            alt: 'TravelEase Topo Map View',
            order: 1,
          },
        ],
        demoVideo: null,
        githubUrl: 'https://github.com/aquaflow-iot/travelease-mobile',
        demoUrl: 'https://travelease.aquaflow.io',
        currentVersion: {
          version: '1.9.0',
          versionCode: 19,
          releaseNotes: 'Enhanced GPS battery optimization for 18+ hours continuous tracking.',
          releaseDate: new Date('2026-08-11'),
          fileSize: '29.4 MB',
          minAndroid: 'Android 8.1 (API 27)',
        },
        downloadCount: 16800,
        viewCount: 51000,
        ratingAverage: 4.6,
        ratingCount: 480,
        featured: false,
        publishedAt: new Date('2026-07-29'),
      },
    ];

    // 4. HIDDEN TEST APPLICATIONS (For verifying security barriers)
    const hiddenAppsData = [
      {
        name: 'DraftApp Sandbox',
        slug: 'draftapp-sandbox',
        shortDescription: 'Internal draft application under staging testing.',
        description: 'This is a DRAFT app and must never appear in public discovery.',
        icon: '',
        developer: devMap['dev.pulsedev@apporbit.io'],
        category: categoryMap['developer-tools'],
        status: 'DRAFT',
        visibility: 'PUBLIC',
        platform: 'ANDROID',
      },
      {
        name: 'Secret Enterprise Suite',
        slug: 'secret-enterprise-suite',
        shortDescription: 'Private enterprise distribution build.',
        description: 'This is a PRIVATE app and must never appear in public discovery.',
        icon: '',
        developer: devMap['dev.aura@apporbit.io'],
        category: categoryMap['productivity'],
        status: 'PUBLISHED',
        visibility: 'PRIVATE',
        platform: 'ANDROID',
      },
    ];

    const allApps = [...appsData, ...hiddenAppsData];
    for (const app of allApps) {
      await App.findOneAndUpdate({ slug: app.slug }, app, { upsert: true, new: true });
    }
    console.log(`[Seed] Seeded ${allApps.length} total applications (10 public + 2 hidden).`);

    // 5. UPDATE CATEGORY APP COUNTS
    for (const slug of Object.keys(categoryMap)) {
      const catId = categoryMap[slug];
      const count = await App.countDocuments({
        category: catId,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      });
      await Category.updateOne({ _id: catId }, { appCount: count });
    }
    console.log('[Seed] Synchronized category application counts.');

    console.log('\n==============================================');
    console.log(' Phase 3 Marketplace Seeding Complete!');
    console.log(' Categories Seeded: 8');
    console.log(' Developers Seeded: 4');
    console.log(' Public Apps Seeded: 10');
    console.log(' Hidden Test Apps:  2 (1 DRAFT, 1 PRIVATE)');
    console.log('==============================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed marketplace: ${error.message}`);
    process.exit(1);
  }
};

seedMarketplace();
