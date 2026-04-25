# ⚡ QUICK START GUIDE

Get your blockchain gaming platform running in under 10 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v16+ installed: `node --version`
- ✅ npm installed: `npm --version`
- ✅ MongoDB installed and running
- ✅ Ganache GUI or CLI installed
- ✅ MetaMask browser extension

## 🚀 Fast Setup (5 Steps)

### Step 1: Install All Dependencies (2 min)

```bash
# Run the automated setup script
chmod +x setup.sh
./setup.sh

# OR install manually:
npm run install-all
```

### Step 2: Start Services (1 min)

Open 3 terminal windows:

**Terminal 1 - MongoDB:**
```bash
# Linux/Mac
sudo systemctl start mongod

# Or manually
mongod

# Verify it's running
mongo --eval "db.version()"
```

**Terminal 2 - Ganache:**
```bash
# Start Ganache GUI and click "Quickstart"
# OR use Ganache CLI:
ganache-cli -p 8545
```

Make sure Ganache is running on `http://127.0.0.1:8545`

### Step 3: Deploy Smart Contracts (1 min)

```bash
cd blockchain

# Compile contracts
npx truffle compile

# Deploy to Ganache
npx truffle migrate --network development
```

✅ You should see: "✓ Game deployed successfully"

### Step 4: Start Backend (30 sec)

```bash
cd backend
npm start
```

✅ You should see: "🚀 Server running on port 5000"

### Step 5: Start Frontend (30 sec)

```bash
# Open a new terminal
cd frontend
npm start
```

✅ Browser opens automatically at `http://localhost:3000`

## 🦊 MetaMask Setup (2 min)

### Add Ganache Network

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add network manually"
3. Enter:
   - **Network Name**: `Ganache Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`

### Import Ganache Account

1. In Ganache, find the first account
2. Click the 🔑 key icon to see private key
3. Copy the private key
4. In MetaMask: Click account icon → "Import Account"
5. Paste private key → Import

✅ You should now have ETH in your MetaMask wallet!

## 🎮 Test the Platform (2 min)

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve in MetaMask
- ✅ Your address appears

### 2. Register as Player
- Click "Register" button
- Confirm transaction in MetaMask
- Wait for success message
- ✅ "Player registered" appears

### 3. Mint Your First NFT
- Click "Mint Asset" button
- Confirm transaction in MetaMask
- Wait for confirmation
- ✅ "Asset minted" appears

### 4. View Asset
- Click "Get Asset #1"
- ✅ Asset details card appears showing:
  - Name: Sword
  - Rarity: 2
  - Owner: Your address

### 5. Check Player Stats
- Click "Get My Player"
- ✅ Player info card appears showing:
  - Registered: Yes
  - Score: 0

## 🎉 Success!

You now have a fully functional blockchain gaming platform running locally!

## 📝 Common Issues

### "Contract not deployed" error
```bash
cd blockchain
npx truffle migrate --reset
```

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start it if needed
sudo systemctl start mongod
```

### "Port 5000 already in use"
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or change PORT in backend/.env
```

### MetaMask "Nonce too high" error
- Go to MetaMask Settings → Advanced
- Click "Clear activity tab data"
- Try transaction again

### "Failed to fetch" in frontend
- Ensure backend is running on port 5000
- Check backend terminal for errors
- Verify API URL in `frontend/src/App.js`

## 📚 Next Steps

### Explore Features
1. Try playing the game (triggers random rewards)
2. Update player scores
3. Transfer assets between accounts
4. Monitor events in Ganache

### Development
- Read `README.md` for detailed documentation
- Check `ARCHITECTURE.md` to understand the system
- See `TESTING.md` for testing guidelines
- Review `DEPLOYMENT.md` for production deployment

### Customize
- Modify smart contracts in `blockchain/contracts/`
- Add new backend routes in `backend/routes/`
- Enhance frontend UI in `frontend/src/`

## 🆘 Need Help?

1. Check the main `README.md`
2. Review error messages carefully
3. Check all three terminals for logs
4. Ensure all prerequisites are installed
5. Verify network configuration in MetaMask

## 🔄 Restart Everything

If things get messy, restart cleanly:

```bash
# Stop all running processes (Ctrl+C in each terminal)

# Kill any stuck processes
pkill -f "node"
lsof -ti:3000,5000,8545 | xargs kill -9

# Restart Ganache (creates fresh blockchain)
# Restart MongoDB
sudo systemctl restart mongod

# Redeploy contracts
cd blockchain
npx truffle migrate --reset

# Restart backend
cd backend
npm start

# Restart frontend
cd frontend
npm start

# Reset MetaMask: Settings → Advanced → Clear activity tab data
```

---

**Happy Gaming! 🎮 Now you're ready to build amazing blockchain games!**
