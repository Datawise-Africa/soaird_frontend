#!/bin/bash

# Datawise Frontend - Quick Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Datawise Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API configuration"
else
    echo "✅ .env file already exists"
fi

# Run type checking
echo "🔍 Running type check..."
pnpm typecheck

echo ""
echo "✨ Setup complete! You can now:"
echo "  • Run 'pnpm dev' to start the development server"
echo "  • Run 'pnpm test' to run tests"
echo "  • Run 'pnpm build' to build for production"
echo ""
echo "📖 For more information, see:"
echo "  • README.md - General documentation"
echo "  • CONTRIBUTING.md - Contributing guidelines"
echo "  • TESTING.md - Testing guide"
echo "  • DEPLOYMENT.md - Deployment guide"
echo ""
echo "Happy coding! 🎉"
