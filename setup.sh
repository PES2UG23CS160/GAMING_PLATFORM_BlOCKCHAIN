#!/bin/bash

# Blockchain Gaming Platform - Quick Setup Script
# This script helps you set up the entire project quickly

echo "🎮 Blockchain Gaming Platform Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v16 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB not found. Please ensure MongoDB is installed and running.${NC}"
else
    echo -e "${GREEN}✓ MongoDB found${NC}"
fi

# Check Truffle
if ! command -v truffle &> /dev/null; then
    echo -e "${YELLOW}⚠️  Truffle not found. Installing globally...${NC}"
    npm install -g truffle
fi
echo -e "${GREEN}✓ Truffle found${NC}"

echo ""
echo "📥 Installing dependencies..."
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..

# Install blockchain dependencies
echo "Installing blockchain dependencies..."
cd blockchain && npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Blockchain dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install blockchain dependencies${NC}"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

echo ""
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Start Ganache (GUI or CLI) on http://127.0.0.1:8545"
echo "2. Compile and deploy contracts:"
echo "   ${YELLOW}cd blockchain && npx truffle compile && npx truffle migrate${NC}"
echo ""
echo "3. Start MongoDB:"
echo "   ${YELLOW}sudo systemctl start mongod${NC}  (Linux)"
echo "   ${YELLOW}brew services start mongodb-community${NC}  (Mac)"
echo ""
echo "4. Start backend server:"
echo "   ${YELLOW}cd backend && npm start${NC}"
echo ""
echo "5. Start frontend (in new terminal):"
echo "   ${YELLOW}cd frontend && npm start${NC}"
echo ""
echo "6. Configure MetaMask:"
echo "   - Network: http://127.0.0.1:8545"
echo "   - Chain ID: 1337"
echo "   - Import Ganache account using private key"
echo ""
echo -e "${GREEN}Happy Gaming! 🎮${NC}"
