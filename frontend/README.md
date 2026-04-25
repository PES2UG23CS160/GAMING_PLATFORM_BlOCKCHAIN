# Frontend - Blockchain Gaming Platform

React-based frontend for the Blockchain Gaming Platform with Web3 wallet integration.

## Features

- MetaMask wallet connection
- Player registration
- NFT asset minting
- Asset viewing
- Player stats display
- Real-time transaction feedback

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

Create a `.env` file (optional):

```env
REACT_APP_API_URL=http://localhost:5000
```

## Project Structure

```
src/
├── App.js          # Main application component
├── App.css         # Application styles
├── index.js        # Entry point
└── index.css       # Global styles
```

## Technologies

- React 19
- Web3.js 4.x
- Axios
- MetaMask

## Available Scripts

- `npm start` - Run development server (http://localhost:3000)
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app (one-way operation)

## MetaMask Configuration

1. Install MetaMask browser extension
2. Add Ganache network:
   - Network Name: Ganache Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency: ETH

## Connecting to Backend

Make sure the backend server is running on http://localhost:5000

## Building for Production

1. Update API URL in `App.js`:
   ```javascript
   const API = "https://your-production-api.com";
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy the `build/` folder to your hosting platform

## Troubleshooting

**MetaMask not detected:**
- Ensure MetaMask extension is installed
- Refresh the page
- Check browser console for errors

**Transaction failed:**
- Check you're on the correct network
- Ensure you have sufficient ETH
- Check backend server is running

**API errors:**
- Verify backend URL in `App.js`
- Check backend server logs
- Ensure contracts are deployed

## Learn More

- [React Documentation](https://react.dev/)
- [MetaMask Docs](https://docs.metamask.io/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
