const Asset = require("../models/Asset");

exports.getAssets = async (req, res) => {
    const { walletAddress } = req.params;

    try {
        const assets = await Asset.find({ owner: walletAddress });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addAsset = async (req, res) => {
    const { tokenId, owner, metadata } = req.body;

    try {
        const asset = await Asset.create({ tokenId, owner, metadata });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};