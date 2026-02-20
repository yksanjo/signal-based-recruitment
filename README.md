# Signal-Based Recruitment Sourcing Platform

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.javascript.com/) [![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/) [![GitHub last commit](https://img.shields.io/github/last-commit/yksanjo/signal-based-recruitment.svg)](https://github.com/yksanjo/signal-based-recruitment/commits/main) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> **Status**: MVP/Prototype - 22 commits of original work

## 🎯 What It Is

A high-velocity event stream system for recruitment intelligence that replaces traditional data-heavy scraping with a signal-based architecture. Instead of scraping everything, it monitors high-intent public signals and triggers actions only when meaningful patterns emerge.

## 🏗️ Architecture Overview

### 3-Layer Signal Processing System

```
┌─────────────────────────────────────────────────────────────┐
│                    Signal Ingestion Layer                    │
│  (The "Sensor") - Monitors high-intent public signals       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Logistics Engine                          │
│  (The "Sorter") - Groups signals into "Action Buckets"      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                       │
│  (The "Agent") - Triggers workflows when thresholds hit     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Signal Sources**: LinkedIn, Indeed, Glassdoor job postings
2. **Company Enrichment**: Apollo.io API integration
3. **ICP Filtering**: Ideal Customer Profile-based filtering
4. **Action Buckets**: Intelligent grouping of signals
5. **Candidate Generation**: On-demand profile generation
6. **Scoring Engine**: Likelihood-to-move scoring algorithm

## ✨ Features

### ✅ Implemented
- Multi-source job posting ingestion architecture
- Company enrichment via Apollo API (mock available)
- ICP-based filtering and compliance checking
- Action bucket assignment system
- Real-time dashboard and visualization
- PostgreSQL database with Prisma ORM
- Next.js 14 App Router with TypeScript

### 🔄 In Progress
- Production scraping integrations
- Advanced candidate scoring algorithms
- Workflow automation triggers
- Team collaboration features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) Apollo.io API key for company enrichment

### Installation

```bash
# Clone the repository
git clone https://github.com/yksanjo/signal-based-recruitment.git
cd signal-based-recruitment

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Set up database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Technical Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: (Planned) NextAuth.js
- **Deployment**: Vercel-ready configuration
- **API Integrations**: Apollo.io, Clay.com (mock implementations)

## 🏭 Project Structure

```
signal-based-recruitment/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── (dashboard)/       # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── db.ts             # Database client
│   ├── signals/          # Signal processing logic
│   └── enrichment/       # Company enrichment
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── public/               # Static assets
```

## 🔧 Development

### Database Operations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm test -- --coverage
```

### Building for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📈 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Connect your PostgreSQL database
5. Deploy!

The application includes:
- `vercel.json` configuration
- Serverless function optimization
- Edge middleware ready

### Self-Hosted
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Use PM2 or similar process manager
5. Set up reverse proxy (Nginx, Caddy)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js 14 and the App Router
- Database management with Prisma ORM
- UI components with Tailwind CSS
- Inspired by modern recruitment intelligence platforms

## 📞 Contact

Yoshi Kondo - [GitHub](https://github.com/yksanjo)

Project Link: [https://github.com/yksanjo/signal-based-recruitment](https://github.com/yksanjo/signal-based-recruitment)

---

**Note**: This is an MVP/prototype with 22 commits of original development work. The architecture is designed for scalability, with mock implementations where external APIs would be integrated in production.