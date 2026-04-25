# Architecture Documentation

## System Overview

The Blockchain Gaming Platform is a full-stack decentralized application (dApp) consisting of three main layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│              (React + Web3.js + MetaMask)               │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                         │
│            (Node.js + Express + Web3.js)                │
└─────────────────────────────────────────────────────────┘
          ↓ Mongoose                    ↓ Web3 RPC
┌──────────────────┐          ┌──────────────────────────┐
│    MongoDB       │          │   Ethereum Blockchain    │
│   (Off-chain     │          │   (Smart Contracts)      │
│   Database)      │          │   Game.sol (ERC721)      │
└──────────────────┘          └──────────────────────────┘
```

## Component Details

### 1. Frontend (React Application)

**Purpose**: User interface for interacting with the game platform

**Key Technologies**:
- React 19 - UI framework
- Web3.js 4.x - Blockchain interaction
- Axios - HTTP client
- MetaMask - Wallet connection

**Main Features**:
- Wallet connection management
- Transaction signing
- Real-time status updates
- Responsive UI

**Component Structure**:
```
App.js
├── Wallet Connection
├── Player Registration
├── Asset Management
│   ├── Mint Asset
│   ├── View Asset
│   └── Transfer Asset
└── Player Information Display
```

**State Management**:
- `account`: Connected wallet address
- `status`: Current operation status
- `asset`: Fetched asset data
- `playerInfo`: Player statistics

**API Communication**:
All backend communication goes through Axios to `http://localhost:5000/api/*`

### 2. Backend (Express.js Server)

**Purpose**: REST API server that bridges frontend and blockchain

**Key Technologies**:
- Express.js - Web framework
- Web3.js - Blockchain interaction
- Mongoose - MongoDB ODM
- CORS - Cross-origin requests

**Architecture Pattern**: MVC (Model-View-Controller)

**Directory Structure**:
```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── gameController.js  # Game operations (planned)
│   └── assetController.js # Asset management (planned)
├── models/
│   ├── User.js           # User schema
│   └── Asset.js          # Asset schema
├── routes/
│   ├── auth.js           # Auth routes
│   ├── game.js           # Game routes
│   └── assets.js         # Asset routes
├── blockchain.js          # Web3 initialization
└── server.js             # Express app setup
```

**blockchain.js Module**:
- Initializes Web3 provider
- Loads smart contract ABI
- Connects to deployed contract
- Provides contract instance to routes

**Key Functions**:
```javascript
const init = async () => {
  // 1. Load contract artifact
  // 2. Initialize Web3
  // 3. Get accounts
  // 4. Get network ID
  // 5. Create contract instance
  // 6. Return { web3, contract, accounts }
}
```

### 3. Blockchain Layer (Ethereum Smart Contracts)

**Purpose**: Decentralized game logic and NFT management

**Smart Contract**: Game.sol (Solidity 0.8.19)

**Inheritance**:
```
Game
├── ERC721 (OpenZeppelin)
│   ├── NFT standard implementation
│   └── Token metadata
└── Ownable (OpenZeppelin)
    └── Access control
```

**Contract Architecture**:

```solidity
contract Game is ERC721, Ownable {
    // State Variables
    uint256 _tokenIdCounter;
    mapping(address => Player) players;
    mapping(uint256 => Asset) assets;
    
    // Structs
    struct Player { bool registered; uint256 score; }
    struct Asset { string name; uint256 rarity; }
    
    // Events
    event PlayerRegistered(address);
    event AssetMinted(uint256, address, string, uint256);
    event ScoreUpdated(address, uint256);
    event AssetTransferred(uint256, address, address);
    
    // Functions
    registerPlayer()
    mintAsset(address, string, uint256)
    updateScore(address, uint256)
    transferAsset(uint256, address)
    playGame()
    getPlayer(address)
    getAsset(uint256)
}
```

**Access Control**:
- Public: `registerPlayer()`, `playGame()`, `getPlayer()`, `getAsset()`, `transferAsset()`
- Owner Only: `mintAsset()`, `updateScore()`

**Modifiers**:
- `onlyOwner`: Restricts to contract owner
- `onlyRegistered`: Requires player registration

### 4. Database Layer (MongoDB)

**Purpose**: Store off-chain data and user information

**Collections**:

**users**:
```javascript
{
  _id: ObjectId,
  address: String,      // Ethereum address
  username: String,
  email: String,
  createdAt: Date,
  updatedAt: Date
}
```

**assets** (planned for caching):
```javascript
{
  _id: ObjectId,
  tokenId: Number,      // On-chain token ID
  name: String,
  rarity: Number,
  owner: String,        // Ethereum address
  metadata: Object,
  createdAt: Date
}
```

## Data Flow

### Player Registration Flow

```
User (Frontend)
    ↓ [1] Click "Register"
    ↓
Frontend (App.js)
    ↓ [2] POST /api/game/register
    ↓
Backend (routes/game.js)
    ↓ [3] init() → Get Web3 & Contract
    ↓ [4] contract.methods.registerPlayer().send()
    ↓
Blockchain (Game.sol)
    ↓ [5] registerPlayer() function
    ↓ [6] Update players mapping
    ↓ [7] Emit PlayerRegistered event
    ↓
Backend
    ↓ [8] Return success response
    ↓
Frontend
    ↓ [9] Display success message
```

### Asset Minting Flow

```
User (Frontend)
    ↓ [1] Click "Mint Asset"
    ↓
Frontend (App.js)
    ↓ [2] POST /api/game/mint
    ↓
Backend (routes/game.js)
    ↓ [3] init() → Get Web3 & Contract
    ↓ [4] contract.methods.mintAsset(address, name, rarity).send()
    ↓
Blockchain (Game.sol)
    ↓ [5] mintAsset() function
    ↓ [6] Check: Only owner can mint
    ↓ [7] Check: Recipient is registered
    ↓ [8] Check: Valid rarity (1-3)
    ↓ [9] Increment token counter
    ↓ [10] _safeMint(to, tokenId)
    ↓ [11] Store asset metadata
    ↓ [12] Emit AssetMinted event
    ↓
Backend
    ↓ [13] Return transaction hash
    ↓
Frontend
    ↓ [14] Display success with tx hash
```

### Asset Retrieval Flow

```
User (Frontend)
    ↓ [1] Click "Get Asset #1"
    ↓
Frontend (App.js)
    ↓ [2] GET /api/game/asset/1
    ↓
Backend (routes/game.js)
    ↓ [3] init() → Get Contract
    ↓ [4] contract.methods.getAsset(tokenId).call()
    ↓
Blockchain (Game.sol)
    ↓ [5] getAsset() view function
    ↓ [6] Check: Token exists
    ↓ [7] Return (name, rarity, owner)
    ↓
Backend
    ↓ [8] Format response
    ↓
Frontend
    ↓ [9] Display asset card
```

## Security Architecture

### Smart Contract Security

1. **Access Control**:
   - Ownable pattern for privileged functions
   - Modifier-based permission checks

2. **Input Validation**:
   - Rarity range check (1-3)
   - Registration status verification
   - Token existence validation

3. **Safe Transfers**:
   - Uses `_safeMint` for ERC721 compliance
   - Checks ownership before transfer

4. **Event Emission**:
   - All state changes emit events
   - Enables transaction tracking

### Backend Security

1. **Environment Variables**:
   - Sensitive data in .env
   - Not committed to version control

2. **CORS Configuration**:
   - Configured for specific origins
   - Can be restricted in production

3. **Error Handling**:
   - Try-catch blocks
   - Meaningful error messages
   - No sensitive data in errors

### Frontend Security

1. **MetaMask Integration**:
   - User controls private keys
   - Transaction confirmation required

2. **Input Sanitization**:
   - Validate addresses
   - Check transaction parameters

## Scalability Considerations

### Current Limitations

1. **Blockchain**:
   - Gas costs per transaction
   - Transaction speed (block time)
   - Storage costs

2. **Backend**:
   - Single server instance
   - Synchronous blockchain calls
   - No caching layer

3. **Database**:
   - Single MongoDB instance
   - No replication

### Scaling Strategies

1. **Layer 2 Solutions**:
   - Polygon/Arbitrum for lower fees
   - Faster transaction finality

2. **Backend Optimization**:
   - Redis caching layer
   - Load balancer
   - Multiple instances
   - Queue system for blockchain operations

3. **Database Scaling**:
   - MongoDB sharding
   - Read replicas
   - Indexing optimization

4. **Frontend Optimization**:
   - CDN for static assets
   - Code splitting
   - Lazy loading
   - Service workers

## Future Enhancements

### Planned Features

1. **Authentication System**:
   - JWT-based auth
   - Session management
   - User profiles

2. **Advanced Game Mechanics**:
   - Multiple game modes
   - Leaderboards
   - Tournaments

3. **Marketplace**:
   - Buy/sell assets
   - Auction system
   - Trading history

4. **Social Features**:
   - Friend system
   - Chat
   - Guilds/Teams

5. **Analytics Dashboard**:
   - Player statistics
   - Asset analytics
   - Game metrics

### Technical Improvements

1. **GraphQL API**:
   - Replace REST with GraphQL
   - Better data fetching
   - Real-time subscriptions

2. **IPFS Integration**:
   - Decentralized asset storage
   - Metadata hosting
   - Image storage

3. **The Graph**:
   - Blockchain indexing
   - Fast queries
   - Historical data

4. **Multi-chain Support**:
   - Deploy to multiple networks
   - Cross-chain bridges
   - Network switching

## Monitoring & Observability

### Recommended Tools

1. **Smart Contract**:
   - Etherscan for transaction monitoring
   - Event logs tracking
   - Gas usage analytics

2. **Backend**:
   - PM2 for process management
   - Morgan for HTTP logging
   - Winston for application logging
   - Sentry for error tracking

3. **Frontend**:
   - Google Analytics
   - LogRocket for session replay
   - Performance monitoring

4. **Infrastructure**:
   - Datadog/New Relic for APM
   - MongoDB Atlas monitoring
   - Uptime monitoring

## Development Workflow

```
1. Write Solidity contracts
   ↓
2. Write contract tests
   ↓
3. Deploy to local Ganache
   ↓
4. Implement backend routes
   ↓
5. Test backend with Postman
   ↓
6. Implement frontend features
   ↓
7. Integration testing
   ↓
8. Deploy to testnet
   ↓
9. User acceptance testing
   ↓
10. Deploy to production
```

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 19.x | UI Framework |
| Frontend | Web3.js | 4.x | Blockchain Interaction |
| Frontend | Axios | 1.x | HTTP Client |
| Backend | Node.js | 16+ | Runtime |
| Backend | Express | 4.x | Web Framework |
| Backend | Mongoose | 7.x | MongoDB ODM |
| Backend | Web3.js | 1.x | Blockchain Interaction |
| Blockchain | Solidity | 0.8.19 | Smart Contracts |
| Blockchain | Truffle | Latest | Development Framework |
| Blockchain | OpenZeppelin | 4.9.x | Contract Libraries |
| Database | MongoDB | 5+ | NoSQL Database |
| Blockchain Network | Ganache | Latest | Local Blockchain |
| Wallet | MetaMask | Latest | Web3 Wallet |

---

This architecture provides a solid foundation for a blockchain gaming platform with room for growth and optimization.
