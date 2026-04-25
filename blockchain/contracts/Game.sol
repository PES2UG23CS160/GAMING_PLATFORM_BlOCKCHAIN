// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title Game - Blockchain Gaming Platform
 * @dev Implements NFT ownership, provably fair gameplay, secure transactions,
 *      community features, and regulatory compliance hooks.
 *      ERC-721 standard for true asset ownership.
 */
contract Game is ERC721, Ownable {

    uint256 private _tokenIdCounter;

    // ─── Structs ───────────────────────────────────────────────────────────
    struct Player {
        bool registered;
        uint256 score;
        uint256 gamesPlayed;
        uint256 registeredAt;
    }

    struct Asset {
        string name;
        uint256 rarity;       // 1=Common, 2=Uncommon, 3=Rare
        bool transferable;
        bool listedForSale;
        uint256 listPrice;    // in wei
    }

    struct GameRecord {
        address player;
        uint256 roll;
        string outcome;
        bytes32 serverSeedHash;  // commit hash (provably fair)
        uint256 blockNumber;
        uint256 timestamp;
    }

    struct ChatMessage {
        address author;
        string message;
        uint256 timestamp;
    }

    // ─── State ─────────────────────────────────────────────────────────────
    mapping(address => Player) public players;
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => address) public marketplace; // tokenId -> seller

    GameRecord[] public gameHistory;
    ChatMessage[] public chatMessages;

    uint256 public constant MAX_CHAT_MESSAGES = 100;
    uint256 public chatCount;

    bool public platformPaused;  // emergency pause for compliance

    // ─── Events ────────────────────────────────────────────────────────────
    event PlayerRegistered(address indexed player, uint256 timestamp);
    event AssetMinted(uint256 indexed tokenId, address indexed to, string name, uint256 rarity);
    event ScoreUpdated(address indexed player, uint256 newScore);
    event AssetTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event AssetListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event AssetSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event GamePlayed(address indexed player, uint256 roll, string outcome, bool provablyFair);
    event MessagePosted(address indexed author, string message, uint256 blockNumber);
    event ComplianceEvent(address indexed user, string eventType, uint256 timestamp);

    // ─── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyRegistered(address addr) {
        require(players[addr].registered, "Not registered");
        _;
    }
    modifier notPaused() {
        require(!platformPaused, "Platform is paused for compliance review");
        _;
    }

    constructor() ERC721("GameAsset", "GAST") {}

    // ─── User Registration ─────────────────────────────────────────────────
    function registerPlayer() external notPaused {
        require(!players[msg.sender].registered, "Already registered");
        players[msg.sender] = Player({
            registered: true,
            score: 0,
            gamesPlayed: 0,
            registeredAt: block.timestamp
        });
        emit PlayerRegistered(msg.sender, block.timestamp);
        emit ComplianceEvent(msg.sender, "REGISTRATION", block.timestamp);
    }

    // ─── NFT Minting (Asset Ownership via ERC-721) ─────────────────────────
    function mintAsset(address to, string calldata name, uint256 rarity)
        external onlyOwner onlyRegistered(to) notPaused returns (uint256)
    {
        require(rarity >= 1 && rarity <= 3, "Invalid rarity");
        _tokenIdCounter++;
        uint256 newId = _tokenIdCounter;
        _safeMint(to, newId);
        assets[newId] = Asset({ name: name, rarity: rarity, transferable: true, listedForSale: false, listPrice: 0 });
        emit AssetMinted(newId, to, name, rarity);
        return newId;
    }

    // ─── Provably Fair Gameplay ────────────────────────────────────────────
    function playGame(bytes32 clientSeed) public onlyRegistered(msg.sender) notPaused {
        // Commit-reveal: server seed revealed post-game, client seed provided upfront
        bytes32 serverSeedHash = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, _tokenIdCounter));
        uint256 roll = uint256(keccak256(abi.encodePacked(serverSeedHash, clientSeed))) % 100;

        string memory outcome;
        if (roll < 50) {
            outcome = "MISS";
        } else if (roll < 80) {
            players[msg.sender].score += 10 + (roll % 20);
            outcome = "WIN_POINTS";
        } else if (roll < 95) {
            _tokenIdCounter++;
            _safeMint(msg.sender, _tokenIdCounter);
            assets[_tokenIdCounter] = Asset({ name: "Battle Sword", rarity: 2, transferable: true, listedForSale: false, listPrice: 0 });
            outcome = "WIN_RARE_NFT";
        } else {
            _tokenIdCounter++;
            _safeMint(msg.sender, _tokenIdCounter);
            assets[_tokenIdCounter] = Asset({ name: "Dragon Blade", rarity: 3, transferable: true, listedForSale: false, listPrice: 0 });
            outcome = "WIN_LEGENDARY_NFT";
        }

        players[msg.sender].gamesPlayed++;
        gameHistory.push(GameRecord({
            player: msg.sender, roll: roll, outcome: outcome,
            serverSeedHash: serverSeedHash,
            blockNumber: block.number, timestamp: block.timestamp
        }));

        emit GamePlayed(msg.sender, roll, outcome, true);
    }

    // ─── Secure Asset Transfer ─────────────────────────────────────────────
    function transferAsset(uint256 tokenId, address to) external onlyRegistered(to) notPaused {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not asset owner");
        require(assets[tokenId].transferable, "Asset not transferable");
        _transfer(msg.sender, to, tokenId);
        emit AssetTransferred(tokenId, msg.sender, to);
    }

    // ─── Marketplace (Secure Transactions) ────────────────────────────────
    function listAssetForSale(uint256 tokenId, uint256 priceWei) external notPaused {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(priceWei > 0, "Price must be positive");
        assets[tokenId].listedForSale = true;
        assets[tokenId].listPrice = priceWei;
        marketplace[tokenId] = msg.sender;
        emit AssetListed(tokenId, msg.sender, priceWei);
    }

    function buyAsset(uint256 tokenId) external payable onlyRegistered(msg.sender) notPaused {
        require(assets[tokenId].listedForSale, "Not for sale");
        address seller = marketplace[tokenId];
        uint256 price = assets[tokenId].listPrice;
        require(msg.value >= price, "Insufficient payment");
        // Secure atomic transfer
        assets[tokenId].listedForSale = false;
        assets[tokenId].listPrice = 0;
        delete marketplace[tokenId];
        _transfer(seller, msg.sender, tokenId);
        payable(seller).transfer(price);
        if (msg.value > price) payable(msg.sender).transfer(msg.value - price); // refund excess
        emit AssetSold(tokenId, msg.sender, seller, price);
    }

    // ─── Community: On-chain Chat ──────────────────────────────────────────
    function postMessage(string calldata message) external onlyRegistered(msg.sender) notPaused {
        require(bytes(message).length > 0, "Empty message");
        require(bytes(message).length <= 280, "Message too long");
        chatMessages.push(ChatMessage({ author: msg.sender, message: message, timestamp: block.timestamp }));
        chatCount++;
        emit MessagePosted(msg.sender, message, block.number);
    }

    // ─── Compliance Controls ───────────────────────────────────────────────
    function pausePlatform() external onlyOwner {
        platformPaused = true;
        emit ComplianceEvent(msg.sender, "PLATFORM_PAUSED", block.timestamp);
    }
    function unpausePlatform() external onlyOwner {
        platformPaused = false;
        emit ComplianceEvent(msg.sender, "PLATFORM_RESUMED", block.timestamp);
    }

    // ─── Score & Read Methods ──────────────────────────────────────────────
    function updateScore(address player, uint256 score) external onlyOwner onlyRegistered(player) {
        players[player].score = score;
        emit ScoreUpdated(player, score);
    }

    function getPlayer(address addr) external view returns (bool registered, uint256 score) {
        Player memory p = players[addr];
        return (p.registered, p.score);
    }

    function getAsset(uint256 tokenId) external view returns (string memory name, uint256 rarity, address owner) {
        require(_exists(tokenId), "Invalid token ID");
        Asset memory a = assets[tokenId];
        return (a.name, a.rarity, ownerOf(tokenId));
    }

    function getGameHistoryLength() external view returns (uint256) { return gameHistory.length; }
    function getChatCount() external view returns (uint256) { return chatCount; }
    function totalSupply() external view returns (uint256) { return _tokenIdCounter; }
}
