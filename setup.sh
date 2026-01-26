#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Daugherty Inc - Ultra-Premium Setup Script         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed or not in PATH."
    echo "   Please install MongoDB and ensure it's running."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
    echo ""
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo ""

cd ..

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Setup Complete! 🎉                                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Update backend/.env with your configuration"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "For more information, see FULLSTACK_README.md"
echo ""
