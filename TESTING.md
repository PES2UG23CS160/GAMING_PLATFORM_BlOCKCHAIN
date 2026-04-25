# Testing Guide

This guide covers testing for all components of the Blockchain Gaming Platform.

## 🧪 Testing Stack

- **Smart Contracts**: Truffle Test Framework (JavaScript/TypeScript)
- **Backend API**: Jest or Mocha (manual testing with curl/Postman)
- **Frontend**: React Testing Library

## 1. Smart Contract Testing

### Setup Test File

Create `blockchain/test/Game.test.js`:

```javascript
const Game = artifacts.require("Game");

contract("Game", (accounts) => {
  let game;
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];

  beforeEach(async () => {
    game = await Game.new({ from: owner });
  });

  describe("Player Registration", () => {
    it("should register a new player", async () => {
      await game.registerPlayer({ from: player1 });
      
      const playerInfo = await game.getPlayer(player1);
      assert.equal(playerInfo.registered, true, "Player should be registered");
      assert.equal(playerInfo.score, "0", "Initial score should be 0");
    });

    it("should not allow double registration", async () => {
      await game.registerPlayer({ from: player1 });
      
      try {
        await game.registerPlayer({ from: player1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Already registered");
      }
    });
  });

  describe("Asset Minting", () => {
    beforeEach(async () => {
      await game.registerPlayer({ from: player1 });
    });

    it("should mint asset to registered player", async () => {
      const result = await game.mintAsset(player1, "Sword", 2, { from: owner });
      
      const asset = await game.getAsset(1);
      assert.equal(asset.name, "Sword", "Asset name should match");
      assert.equal(asset.rarity, "2", "Rarity should match");
      assert.equal(asset.owner, player1, "Owner should be player1");
    });

    it("should only allow owner to mint", async () => {
      try {
        await game.mintAsset(player1, "Sword", 2, { from: player2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "caller is not the owner");
      }
    });

    it("should not mint to unregistered player", async () => {
      try {
        await game.mintAsset(player2, "Sword", 2, { from: owner });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not registered");
      }
    });

    it("should reject invalid rarity values", async () => {
      try {
        await game.mintAsset(player1, "Sword", 5, { from: owner });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Invalid rarity");
      }
    });
  });

  describe("Score Management", () => {
    beforeEach(async () => {
      await game.registerPlayer({ from: player1 });
    });

    it("should update player score", async () => {
      await game.updateScore(player1, 100, { from: owner });
      
      const playerInfo = await game.getPlayer(player1);
      assert.equal(playerInfo.score, "100", "Score should be updated");
    });

    it("should only allow owner to update score", async () => {
      try {
        await game.updateScore(player1, 100, { from: player2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "caller is not the owner");
      }
    });
  });

  describe("Asset Transfer", () => {
    beforeEach(async () => {
      await game.registerPlayer({ from: player1 });
      await game.registerPlayer({ from: player2 });
      await game.mintAsset(player1, "Sword", 2, { from: owner });
    });

    it("should transfer asset between registered players", async () => {
      await game.transferAsset(1, player2, { from: player1 });
      
      const asset = await game.getAsset(1);
      assert.equal(asset.owner, player2, "Asset should be owned by player2");
    });

    it("should not transfer to unregistered player", async () => {
      const player3 = accounts[3];
      
      try {
        await game.transferAsset(1, player3, { from: player1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not registered");
      }
    });

    it("should not allow non-owner to transfer", async () => {
      try {
        await game.transferAsset(1, player2, { from: player2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not asset owner");
      }
    });
  });

  describe("Play Game", () => {
    beforeEach(async () => {
      await game.registerPlayer({ from: player1 });
    });

    it("should allow registered player to play", async () => {
      const result = await game.playGame({ from: player1 });
      
      // Check that transaction was successful
      assert.isTrue(result.receipt.status, "Transaction should succeed");
    });

    it("should not allow unregistered player to play", async () => {
      try {
        await game.playGame({ from: player2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not registered");
      }
    });
  });

  describe("Events", () => {
    it("should emit PlayerRegistered event", async () => {
      const result = await game.registerPlayer({ from: player1 });
      
      const event = result.logs.find(log => log.event === "PlayerRegistered");
      assert.exists(event, "PlayerRegistered event should be emitted");
      assert.equal(event.args.player, player1, "Event should contain player address");
    });

    it("should emit AssetMinted event", async () => {
      await game.registerPlayer({ from: player1 });
      const result = await game.mintAsset(player1, "Sword", 2, { from: owner });
      
      const event = result.logs.find(log => log.event === "AssetMinted");
      assert.exists(event, "AssetMinted event should be emitted");
      assert.equal(event.args.to, player1, "Event should contain recipient");
      assert.equal(event.args.name, "Sword", "Event should contain asset name");
    });

    it("should emit ScoreUpdated event", async () => {
      await game.registerPlayer({ from: player1 });
      const result = await game.updateScore(player1, 50, { from: owner });
      
      const event = result.logs.find(log => log.event === "ScoreUpdated");
      assert.exists(event, "ScoreUpdated event should be emitted");
      assert.equal(event.args.player, player1, "Event should contain player");
      assert.equal(event.args.newScore.toString(), "50", "Event should contain new score");
    });
  });
});
```

### Run Contract Tests

```bash
cd blockchain

# Run all tests
npx truffle test

# Run specific test file
npx truffle test test/Game.test.js

# Run with verbose output
npx truffle test --show-events

# Run with network
npx truffle test --network development
```

## 2. Backend API Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register player
curl -X POST http://localhost:5000/api/game/register

# Mint asset
curl -X POST http://localhost:5000/api/game/mint

# Get asset by ID
curl http://localhost:5000/api/game/asset/1

# Get player info
curl http://localhost:5000/api/game/player/0xYourAddress

# Update score
curl -X POST http://localhost:5000/api/game/score \
  -H "Content-Type: application/json" \
  -d '{"player": "0xPlayerAddress", "score": 100}'
```

### Using Postman

1. Import collection: Create a new collection in Postman
2. Add requests for each endpoint
3. Save common variables (BASE_URL, addresses)
4. Create test scripts

Example Postman test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has message", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
});
```

### Integration Tests

Create `backend/tests/integration.test.js`:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Game API Integration Tests', () => {
  
  test('GET /api/health - should return ok status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('POST /api/game/register - should register player', async () => {
    const response = await request(app).post('/api/game/register');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  // Add more tests...
});
```

## 3. Frontend Testing

### Component Testing

Create `frontend/src/App.test.js`:

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('App Component', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders Game NFT Dashboard heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Game NFT Dashboard/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('displays Connect Wallet button', () => {
    render(<App />);
    const button = screen.getByText(/Connect Wallet/i);
    expect(button).toBeInTheDocument();
  });

  test('shows connected address after wallet connection', async () => {
    // Mock MetaMask
    global.window.ethereum = {
      request: jest.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890'])
    };

    render(<App />);
    const connectButton = screen.getByText(/Connect Wallet/i);
    
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/Connected: 0x1234/i)).toBeInTheDocument();
    });
  });

  test('displays player info when fetched', async () => {
    axios.get.mockResolvedValue({
      data: { registered: true, score: '100' }
    });

    render(<App />);
    const getPlayerButton = screen.getByText(/Get My Player/i);
    
    fireEvent.click(getPlayerButton);

    await waitFor(() => {
      expect(screen.getByText(/Player Info/i)).toBeInTheDocument();
      expect(screen.getByText(/Score: 100/i)).toBeInTheDocument();
    });
  });

  test('handles registration correctly', async () => {
    axios.post.mockResolvedValue({
      data: { message: 'Player registered' }
    });

    render(<App />);
    const registerButton = screen.getByText(/Register/i);
    
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/✅ Player registered/i)).toBeInTheDocument();
    });
  });

  test('displays error message on failed API call', async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: 'Registration failed' } }
    });

    render(<App />);
    const registerButton = screen.getByText(/Register/i);
    
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/❌.*Registration failed/i)).toBeInTheDocument();
    });
  });
});
```

### Run Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- App.test.js
```

## 4. End-to-End Testing

### Using Cypress

Install Cypress:
```bash
cd frontend
npm install --save-dev cypress
```

Create `frontend/cypress/e2e/game.cy.js`:

```javascript
describe('Blockchain Gaming Platform E2E', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should load the application', () => {
    cy.contains('Game NFT Dashboard').should('be.visible');
  });

  it('should display all action buttons', () => {
    cy.contains('button', 'Connect Wallet').should('be.visible');
    cy.contains('button', 'Register').should('be.visible');
    cy.contains('button', 'Mint Asset').should('be.visible');
  });

  it('should show player info after clicking Get My Player', () => {
    // Mock wallet connection first
    cy.window().then((win) => {
      win.ethereum = {
        request: () => Promise.resolve(['0x123...'])
      };
    });

    cy.contains('button', 'Get My Player').click();
    cy.contains('Player Info', { timeout: 10000 }).should('be.visible');
  });
});
```

Run Cypress tests:
```bash
npx cypress open  # Interactive mode
npx cypress run   # Headless mode
```

## 5. Load Testing

### Using Artillery

Install Artillery:
```bash
npm install -g artillery
```

Create `artillery-config.yml`:

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"

scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/health"
      - post:
          url: "/api/game/register"
      - get:
          url: "/api/game/asset/1"
```

Run load test:
```bash
artillery run artillery-config.yml
```

## 6. Gas Usage Testing

Check gas costs for contract operations:

```javascript
// In truffle console
truffle console --network development

const game = await Game.deployed()
const result = await game.registerPlayer({ from: accounts[1] })
console.log("Gas used:", result.receipt.gasUsed)
```

## 7. Security Testing

### Smart Contract Security

1. **Slither** (Static Analysis):
```bash
pip3 install slither-analyzer
slither blockchain/contracts/Game.sol
```

2. **Mythril** (Security Analysis):
```bash
pip3 install mythril
myth analyze blockchain/contracts/Game.sol
```

### API Security

1. Test for SQL injection (shouldn't affect MongoDB much)
2. Test CORS configuration
3. Test rate limiting
4. Check authentication (when implemented)

## 8. Coverage Reports

### Smart Contract Coverage

```bash
cd blockchain
npm install --save-dev solidity-coverage
npx truffle run coverage
```

### Backend Coverage

```bash
cd backend
npm test -- --coverage
```

### Frontend Coverage

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

## Best Practices

1. **Write tests before fixing bugs** (TDD approach)
2. **Test edge cases** (empty inputs, max values, etc.)
3. **Mock external dependencies** (blockchain, database)
4. **Use descriptive test names**
5. **Keep tests independent** (no shared state)
6. **Clean up after tests** (reset database, contracts)
7. **Test both success and failure paths**
8. **Maintain high code coverage** (aim for >80%)

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm run install-all
      
      - name: Run contract tests
        run: cd blockchain && npx truffle test
      
      - name: Run frontend tests
        run: cd frontend && npm test -- --watchAll=false
```

---

**Happy Testing! ✅**
