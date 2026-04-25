/**
 * authController.js
 * Wallet-based authentication via signed nonces (Sign-In with Ethereum pattern).
 * No password needed — the wallet signature proves identity.
 */

const jwt    = require("jsonwebtoken");
const ethers = require("ethers");

const JWT_SECRET = process.env.JWT_SECRET || "blockchain-game-secret-change-in-prod";

// In-memory nonce store (use Redis in production)
const pendingNonces = new Map(); // address -> { nonce, expiresAt }

function generateNonce() {
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
}

// GET /api/auth/nonce/:address
exports.getNonce = (req, res) => {
  const address = req.params.address?.toLowerCase();
  if (!address || !/^0x[0-9a-f]{40}$/i.test(address)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }
  const nonce = generateNonce();
  pendingNonces.set(address, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min TTL
  res.json({ nonce });
};

// POST /api/auth/verify  { address, signature, nonce }
exports.verifySignature = (req, res) => {
  try {
    const { address, signature, nonce } = req.body;
    if (!address || !signature || !nonce) {
      return res.status(400).json({ error: "address, signature, and nonce are required" });
    }

    const key = address.toLowerCase();
    const record = pendingNonces.get(key);

    if (!record) return res.status(401).json({ error: "No pending nonce for this address — request a new one" });
    if (Date.now() > record.expiresAt) {
      pendingNonces.delete(key);
      return res.status(401).json({ error: "Nonce expired — request a new one" });
    }
    if (record.nonce !== nonce) {
      return res.status(401).json({ error: "Nonce mismatch" });
    }

    // Recover signer from signature
    const message = `Sign in to BlockchainGame\n\nNonce: ${nonce}`;
    let recovered;
    try {
      recovered = ethers.verifyMessage(message, signature).toLowerCase();
    } catch {
      return res.status(401).json({ error: "Invalid signature" });
    }

    if (recovered !== key) {
      return res.status(401).json({ error: "Signature does not match wallet address" });
    }

    // One-time nonce — delete after use
    pendingNonces.delete(key);

    // Issue JWT
    const token = jwt.sign({ address: key }, JWT_SECRET, { expiresIn: "24h" });
    res.json({
      token,
      user: { walletAddress: key, username: key.slice(0, 8) + "…" + key.slice(-4) },
    });
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};
