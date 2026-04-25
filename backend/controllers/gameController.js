exports.playGame = async (req, res) => {
    const { walletAddress, choice } = req.body;

    try {
        const result = Math.random() < 0.5 ? "win" : "lose";

        res.json({
            player: walletAddress,
            choice,
            result,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};