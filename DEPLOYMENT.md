# Production Deployment Guide

## Prerequisites for Production

- Ethereum testnet/mainnet RPC URL (Infura, Alchemy, etc.)
- MongoDB Atlas account (for cloud database)
- Hosting platform account (Heroku, Railway, Vercel, etc.)
- Domain name (optional)

## 1. Deploy Smart Contracts to Testnet

### Sepolia Testnet Deployment

1. Create `.env` file in `blockchain/` directory:

```env
MNEMONIC="your twelve word seed phrase here"
INFURA_KEY="your_infura_project_id"
```

2. Get Sepolia ETH from faucet:
   - https://sepoliafaucet.com/
   - https://sepolia-faucet.pk910.de/

3. Deploy contracts:

```bash
cd blockchain
npx truffle migrate --network sepolia
```

4. Note the deployed contract address from the output.

## 2. Deploy Backend

### Option A: Railway

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

3. Login and initialize:
   ```bash
   railway login
   cd backend
   railway init
   ```

4. Set environment variables in Railway dashboard:
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/gameDB
   WEB3_PROVIDER=https://sepolia.infura.io/v3/YOUR_KEY
   PORT=5000
   ```

5. Deploy:
   ```bash
   railway up
   ```

### Option B: Heroku

1. Install Heroku CLI
2. Login and create app:
   ```bash
   heroku login
   cd backend
   heroku create your-app-name
   ```

3. Set environment variables:
   ```bash
   heroku config:set MONGO_URI="mongodb+srv://..."
   heroku config:set WEB3_PROVIDER="https://sepolia.infura.io/v3/..."
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

## 3. Setup MongoDB Atlas

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all, or specific IPs)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gameDB?retryWrites=true&w=majority
   ```

## 4. Deploy Frontend

### Option A: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Update `frontend/src/App.js` - change API URL:
   ```javascript
   const API = "https://your-backend-url.com";
   ```

3. Deploy:
   ```bash
   cd frontend
   vercel
   ```

### Option B: Netlify

1. Build the app:
   ```bash
   cd frontend
   npm run build
   ```

2. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=build
   ```

## 5. Update Smart Contract Reference

After deploying contracts to testnet, update the backend to use the new contract address:

1. Copy the `build/` folder from blockchain to backend:
   ```bash
   cp -r blockchain/build backend/
   ```

2. Or update the CONTRACT_PATH in `backend/blockchain.js` if needed.

## 6. Configure Frontend for Testnet

Update MetaMask instructions in your app:

1. Network Name: Sepolia
2. RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
3. Chain ID: 11155111
4. Currency Symbol: ETH
5. Block Explorer: https://sepolia.etherscan.io

## 7. Environment Variables Summary

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/gameDB
PORT=5000
WEB3_PROVIDER=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NODE_ENV=production
```

### Blockchain (.env)
```env
MNEMONIC=your twelve word mnemonic phrase
INFURA_KEY=your_infura_project_id
```

### Frontend
Update in code:
- API URL to production backend
- Contract address if hardcoded
- Network configuration

## 8. Security Checklist

- [ ] Never commit .env files
- [ ] Use environment variables for sensitive data
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS for all connections
- [ ] Implement rate limiting on API
- [ ] Add authentication/authorization
- [ ] Validate all user inputs
- [ ] Use secure MongoDB connection (TLS)
- [ ] Regular security audits of smart contracts
- [ ] Monitor contract events

## 9. Monitoring & Maintenance

### Backend Monitoring
- Use Railway/Heroku logs
- Set up error tracking (Sentry)
- Monitor API response times

### Blockchain Monitoring
- Use Etherscan to track transactions
- Monitor gas prices
- Track contract events

### Database Monitoring
- MongoDB Atlas provides built-in monitoring
- Set up alerts for storage limits
- Regular backups

## 10. Scaling Considerations

### Backend
- Use load balancer for multiple instances
- Implement caching (Redis)
- Database indexing
- CDN for static assets

### Smart Contracts
- Gas optimization
- Batch operations where possible
- Consider Layer 2 solutions for lower fees

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service workers for offline support

## 11. Mainnet Deployment

⚠️ **WARNING**: Deploying to mainnet requires real ETH and has permanent consequences.

### Before Mainnet:
1. Thoroughly test on testnet
2. Get smart contract audited
3. Have sufficient ETH for gas
4. Triple-check all addresses
5. Implement emergency stop/pause mechanism

### Mainnet Deployment:
```bash
# Update truffle-config.js with mainnet configuration
cd blockchain
npx truffle migrate --network mainnet
```

## 12. Cost Estimates

### Testnet (Sepolia)
- Smart contract deployment: ~$0 (testnet ETH is free)
- Transactions: ~$0 (testnet ETH is free)

### Mainnet (Ethereum)
- Contract deployment: $50-$500 (varies with gas prices)
- Each transaction: $5-$50 (varies with gas prices)
- Consider Layer 2 or sidechains for lower costs

### Hosting
- Backend: $5-$25/month (Railway/Heroku)
- Database: $0-$50/month (MongoDB Atlas)
- Frontend: $0-$20/month (Vercel/Netlify)

## 13. Helpful Commands

```bash
# Check deployment status
truffle networks

# Verify contract on Etherscan
truffle run verify ContractName --network sepolia

# Interact with deployed contract
truffle console --network sepolia

# Monitor backend logs
railway logs  # or heroku logs --tail

# Test production API
curl https://your-api.com/api/health
```

## 14. Troubleshooting Production

### Contract not found
- Ensure build/ artifacts are deployed with backend
- Check WEB3_PROVIDER is correct
- Verify contract is deployed on correct network

### Database connection failed
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check database user permissions

### CORS errors
- Add frontend domain to CORS whitelist
- Use proper headers

### Transaction failures
- Insufficient gas limit
- Wrong network in MetaMask
- Contract reverted (check error message)

## Support Resources

- Truffle Docs: https://trufflesuite.com/docs/
- Infura: https://infura.io/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Railway: https://docs.railway.app/
- Vercel: https://vercel.com/docs

---

**Good luck with your deployment! 🚀**
