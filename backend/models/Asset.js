const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
    },
    owner: {
        type: String, // wallet address
        required: true,
    },
    metadata: {
        name: String,
        image: String,
    },
});

module.exports = mongoose.model("Asset", assetSchema);