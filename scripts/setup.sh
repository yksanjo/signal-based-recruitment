#!/bin/bash

echo "🚀 Setting up Signal-Based Recruitment Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your DATABASE_URL and API keys"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database is configured
if grep -q "postgresql://user:password@localhost" .env 2>/dev/null; then
    echo "⚠️  Please update DATABASE_URL in .env before running migrations"
else
    echo "🗄️  Running database migrations..."
    npx prisma migrate dev --name init || echo "⚠️  Migration failed. Please check your DATABASE_URL"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your DATABASE_URL and API keys"
echo "2. Run 'npx prisma migrate dev' if you haven't already"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Open http://localhost:3000 in your browser"

