const express     = require("express");
const router      = express.Router();
const init        = require("../blockchain");
const requireAuth = require("../middleware/auth");

// ─── Register player ──────────────────────────────────────────────────────
router.post("/register", requireAuth, async (req, res) => {
  try {
    const address = req.body.address || req.walletAddress;
    if (!address) return res.status(400).json({ error: "address required" });
    const { contract } = await init();
    await contract.methods.registerPlayer().send({ from: address, gas: 3000000 });
    res.json({ message: "Player registered", address });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Mint asset (NFT) ─────────────────────────────────────────────────────
router.post("/mint", requireAuth, async (req, res) => {
  try {
    const address = req.body.address || req.walletAddress;
    const { name = "Sword", rarity = 2 } = req.body;
    if (!address) return res.status(400).json({ error: "address required" });
    const { contract } = await init();
    const tx = await contract.methods.mintAsset(address, name, rarity).send({ from: address, gas: 3000000 });
    res.json({ message: "Asset minted", tx: tx.transactionHash });
  } catch (err) {
    console.error("MINT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Provably fair game round ─────────────────────────────────────────────
router.post("/play", requireAuth, async (req, res) => {
  try {
    const address = req.body.address || req.walletAddress;
    if (!address) return res.status(400).json({ error: "address required" });
    const { contract } = await init();
    const result = await contract.methods.playGame(address).send({ from: address, gas: 3000000 });
    res.json({
      message: "Game played",
      txHash: result.transactionHash,
      gameResult: result.gameResult,
    });
  } catch (err) {
    console.error("PLAY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Marketplace: List asset for sale ─────────────────────────────────────
router.post("/market/list", requireAuth, async (req, res) => {
  try {
    const { tokenId, priceEth } = req.body;
    const address = req.body.address || req.walletAddress;
    if (!tokenId || !priceEth) return res.status(400).json({ error: "tokenId and priceEth required" });
    const priceWei = Math.floor(parseFloat(priceEth) * 1e18).toString();
    const { contract } = await init();
    const tx = await contract.methods.listAssetForSale(tokenId, priceWei).send({ from: address, gas: 3000000 });
    res.json({ message: "Asset listed for sale", tx: tx.transactionHash });
  } catch (err) {
    console.error("LIST ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Marketplace: Buy asset ────────────────────────────────────────────────
router.post("/market/buy", requireAuth, async (req, res) => {
  try {
    const { tokenId } = req.body;
    const address = req.body.address || req.walletAddress;
    if (!tokenId) return res.status(400).json({ error: "tokenId required" });
    const { contract } = await init();
    const tx = await contract.methods.buyAsset(tokenId).send({ from: address, gas: 3000000 });
    res.json({ message: "Asset purchased", tx: tx.transactionHash });
  } catch (err) {
    console.error("BUY ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Community: Post message ──────────────────────────────────────────────
router.post("/community/post", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const address = req.body.address || req.walletAddress;
    if (!message) return res.status(400).json({ error: "message required" });
    const { contract } = await init();
    const tx = await contract.methods.postMessage(message).send({ from: address, gas: 3000000 });
    res.json({ message: "Message posted", tx: tx.transactionHash });
  } catch (err) {
    console.error("CHAT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Community: Get messages ───────────────────────────────────────────────
router.get("/community/messages", async (req, res) => {
  try {
    const { getChatMessages } = require("../blockchain");
    res.json({ messages: getChatMessages() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Marketplace listings ─────────────────────────────────────────────────
router.get("/market", async (req, res) => {
  try {
    const { getMarketplace } = require("../blockchain");
    res.json({ listings: getMarketplace() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Provably fair game history ───────────────────────────────────────────
router.get("/history", async (req, res) => {
  try {
    const { getGameHistory } = require("../blockchain");
    res.json({ history: getGameHistory() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get player NFTs ──────────────────────────────────────────────────────
router.get("/player/:address/nfts", async (req, res) => {
  try {
    const { contract } = await init();
    const nfts = await contract.methods.getPlayerNFTs(req.params.address).call();
    res.json({ nfts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get player full profile ──────────────────────────────────────────────
router.get("/player/:address", async (req, res) => {
  try {
    const { getPlayerFull } = require("../blockchain");
    const player = getPlayerFull(req.params.address);
    if (!player) {
      const { contract } = await init();
      const data = await contract.methods.getPlayer(req.params.address).call();
      return res.json({ registered: data[0], score: data[1].toString() });
    }
    res.json({ registered: player.registered, score: player.score, gamesPlayed: player.gamesPlayed, nftDetails: player.nftDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get asset by ID ──────────────────────────────────────────────────────
router.get("/asset/:id", async (req, res) => {
  try {
    const { contract } = await init();
    const tokenId = parseInt(req.params.id);
    if (isNaN(tokenId) || tokenId < 1) return res.status(400).json({ error: "Invalid token ID" });
    const data = await contract.methods.getAsset(tokenId).call();
    res.json({ name: data[0], rarity: data[1].toString(), owner: data[2] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Score update ──────────────────────────────────────────────────────────
router.post("/score", requireAuth, async (req, res) => {
  try {
    const { contract } = await init();
    const { player, score } = req.body;
    if (!player || score === undefined) return res.status(400).json({ error: "player and score required" });
    await contract.methods.updateScore(player, score).send({ from: req.walletAddress, gas: 3000000 });
    res.json({ message: "Score updated", player, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
