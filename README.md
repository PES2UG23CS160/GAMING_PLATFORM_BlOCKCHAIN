# 🎮 Blockchain Gaming Platform

A full-stack decentralized gaming platform with NFT asset management, built with React, Node.js/Express, MongoDB, and Ethereum smart contracts.

## 📋 Project Structure

```
blockchain-gaming-platform/
├── backend/              # Express.js API server
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── blockchain.js    # Web3 integration
│   ├── server.js        # Main server file
│   └── package.json     # Backend dependencies
│
├── blockchain/          # Truffle smart contracts
│   ├── contracts/       # Solidity contracts
│   │   ├── Game.sol    # Main game contract (ERC721)
│   │   └── Migrations.sol
│   ├── migrations/      # Deployment scripts
│   ├── truffle-config.js
│   └── package.json     # Blockchain dependencies
│
└── frontend/            # React application
    ├── public/          # Static files
    ├── src/            # React components
    │   ├── App.js      # Main application
    │   └── index.js    # Entry point
    └── package.json     # Frontend dependencies
```

## 🚀 Features

- **Player Registration**: Register players on the blockchain
- **NFT Minting**: Create unique game assets as ERC721 tokens
- **Score Tracking**: Update and track player scores
- **Asset Management**: View and transfer game assets
- **Wallet Integration**: Connect with MetaMask
- **MongoDB Storage**: Store off-chain game data
- **RESTful API**: Complete backend API for game operations

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Web3.js for blockchain interaction
- CORS enabled

### Blockchain
- Solidity ^0.8.19
- Truffle Framework
- OpenZeppelin Contracts (ERC721, Ownable)
- Ganache for local blockchain

### Frontend
- React 19
- Web3.js 4.x
- Axios for API calls
- MetaMask integration

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Ganache** - [Download](https://trufflesuite.com/ganache/)
- **MetaMask** browser extension - [Install](https://metamask.io/)
- **Truffle** (install globally): `npm install -g truffle`

## 🔧 Installation & Setup

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install blockchain dependencies
cd ../blockchain
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Linux/Mac
sudo systemctl start mongod

# Or start manually
mongod

# On Windows (if installed as service)
net start MongoDB
```

### Step 3: Start Ganache

1. Open Ganache application
2. Click "Quickstart" or create a new workspace
3. Ensure it's running on `http://127.0.0.1:8545`
4. Note down the first account address (you'll need this)

### Step 4: Configure Environment

The backend `.env` file is already configured with default values:

```env
MONGO_URI=mongodb://127.0.0.1:27017/gameDB
PORT=5000
WEB3_PROVIDER=http://127.0.0.1:8545
```

If you need to change these values, edit `backend/.env`

### Step 5: Compile and Deploy Smart Contracts

```bash
cd blockchain

# Compile the contracts
npx truffle compile

# Deploy to local Ganache
npx truffle migrate --network development

# You should see output like:
# > contract address: 0x...
# > transaction hash: 0x...
```

**Important**: The deployment creates a `build/` folder with contract artifacts that the backend needs.

### Step 6: Configure MetaMask

1. Open MetaMask extension
2. Click network dropdown → Add Network → Add a network manually
3. Enter these details:
   - **Network Name**: Ganache Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337 (or 5777 depending on Ganache)
   - **Currency Symbol**: ETH

4. Import Ganache account:
   - In Ganache, click the key icon next to the first account
   - Copy the private key
   - In MetaMask: Account menu → Import Account → Paste private key

### Step 7: Start the Backend Server

```bash
cd backend
npm start

# You should see:
# 🚀 Server running on port 5000
# Connected to MongoDB
```

### Step 8: Start the Frontend

```bash
cd frontend
npm start

# React app will open at http://localhost:3000
```

## 🎯 How to Use

### 1. Connect Wallet
- Click "Connect Wallet" button
- Approve MetaMask connection
- Your address will be displayed

### 2. Register Player
- Click "Register" button
- Confirm transaction in MetaMask
- Wait for confirmation

### 3. Mint NFT Asset
- Click "Mint Asset" button
- Confirm transaction in MetaMask
- Asset will be minted to your address

### 4. View Asset
- Click "Get Asset #1" button
- View asset details (name, rarity, owner)

### 5. Check Player Info
- Click "Get My Player" button
- View registration status and score

## 🔌 API Endpoints

### Game Routes (`/api/game`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new player |
| POST | `/mint` | Mint a new game asset |
| GET | `/asset/:id` | Get asset details by token ID |
| POST | `/score` | Update player score |
| GET | `/player/:address` | Get player information |

### Auth Routes (`/api/auth`)
Authentication routes (ready for implementation)

### Asset Routes (`/api/assets`)
Asset management routes (ready for implementation)

## 🧪 Testing

### Test Smart Contract

```bash
cd blockchain
npx truffle test
```

### Test Backend API

```bash
# With server running, use curl or Postman

# Register player
curl -X POST http://localhost:5000/api/game/register

# Get player info
curl http://localhost:5000/api/game/player/0xYourAddress

# Get asset
curl http://localhost:5000/api/game/asset/1
```

## 📝 Smart Contract Details

### Game.sol Contract

**Token Standard**: ERC721 (NFT)

**Main Functions**:
- `registerPlayer()` - Register as a player
- `mintAsset(address, name, rarity)` - Mint new asset (owner only)
- `updateScore(address, score)` - Update player score (owner only)
- `transferAsset(tokenId, to)` - Transfer asset to another player
- `playGame()` - Play game and earn rewards
- `getPlayer(address)` - Get player details
- `getAsset(tokenId)` - Get asset details

**Events**:
- `PlayerRegistered(address)`
- `AssetMinted(tokenId, address, name, rarity)`
- `ScoreUpdated(address, score)`
- `AssetTransferred(tokenId, from, to)`

## 🔐 Security Notes

- Private keys are managed by MetaMask
- Backend uses Ganache's first account as contract owner
- Never commit `.env` files or private keys to git
- For production, use environment variables and secure key management

## 🐛 Troubleshooting

### "Contract not deployed" error
```bash
cd blockchain
npx truffle migrate --reset --network development
```

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `backend/.env`

### "MetaMask transaction failed"
- Ensure you're on the Ganache network in MetaMask
- Check that you have ETH in your account
- Reset MetaMask account: Settings → Advanced → Clear activity tab data

### "CORS error" in frontend
- Ensure backend server is running
- Check that API URL in `frontend/src/App.js` matches backend port

### Port already in use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in backend/.env
```

## 🚀 Deployment

### Deploy to Testnet (Sepolia)

1. Get Sepolia ETH from [faucet](https://sepoliafaucet.com/)
2. Create `.env` in blockchain folder:
   ```
   MNEMONIC="your twelve word mnemonic"
   INFURA_KEY="your infura project id"
   ```
3. Deploy:
   ```bash
   cd blockchain
   npx truffle migrate --network sepolia
   ```

### Deploy Backend (Heroku/Railway)
1. Set environment variables
2. Connect MongoDB Atlas
3. Update `WEB3_PROVIDER` to testnet/mainnet RPC

### Deploy Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `build/` folder
3. Update API URL to production backend

## 📚 Additional Resources

- [Truffle Documentation](https://trufflesuite.com/docs/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [React Documentation](https://react.dev/)
- [MetaMask Documentation](https://docs.metamask.io/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

ISC License - feel free to use this project for learning and development.

## 👥 Support

For issues and questions:
- Check the Troubleshooting section
- Review Ganache and Truffle logs
- Check browser console for frontend errors
- Review backend server logs

---

**Happy Gaming! 🎮**
