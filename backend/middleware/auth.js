const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "blockchain-game-secret-change-in-prod";

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.walletAddress = payload.address;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
