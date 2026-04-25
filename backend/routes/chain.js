const express = require("express");
const router  = express.Router();
const init    = require("../blockchain");

router.get("/stats", async (req, res) => {
  try {
    const { getStats } = require("../blockchain");
    res.json(getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/player/:address", async (req, res) => {
  try {
    const { getPlayerFull } = require("../blockchain");
    const player = getPlayerFull(req.params.address);
    res.json(player || { error: "Player not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
