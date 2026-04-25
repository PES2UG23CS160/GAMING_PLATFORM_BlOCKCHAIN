const express = require("express");
const router = express.Router();
const {
    getAssets,
    addAsset,
} = require("../controllers/assetController");

router.get("/:walletAddress", getAssets);
router.post("/add", addAsset);

module.exports = router;