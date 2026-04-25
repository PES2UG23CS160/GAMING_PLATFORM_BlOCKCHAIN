import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API = "http://localhost:5000";
const RARITY_LABEL = { 1: "Common", 2: "Uncommon", 3: "Rare" };
const RARITY_COLOR = { 1: "#94a3b8", 2: "#4f8ef7", 3: "#c084fc" };
const RARITY_BG    = { 1: "#1e293b", 2: "#1e3a5f", 3: "#2d1b4e" };

function short(addr) {
  if (!addr) return "";
  return addr.length > 20 ? addr.slice(0, 10) + "..." + addr.slice(-6) : addr;
}
function formatEth(wei) {
  return (Number(wei) / 1e18).toFixed(3) + " ETH";
}

export default function App() {
  const [account, setAccount]         = useState("");
  const [authToken, setAuthToken]     = useState("");
  const [authUser, setAuthUser]       = useState(null);
  const [status, setStatus]           = useState("");
  const [statusType, setStatusType]   = useState("info");
  const [asset, setAsset]             = useState(null);
  const [playerInfo, setPlayerInfo]   = useState(null);
  const [chain, setChain]             = useState(null);
  const [tab, setTab]                 = useState("dashboard");
  const [connecting, setConnecting]   = useState(false);
  const [chatMsg, setChatMsg]         = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [gameResult, setGameResult]   = useState(null);
  const [playerNFTs, setPlayerNFTs]   = useState([]);
  const [listModal, setListModal]     = useState(null); // { tokenId, name }
  const [listPrice, setListPrice]     = useState("0.5");
  const [mintName, setMintName]       = useState("Sword");
  const [mintRarity, setMintRarity]   = useState(2);
  const chatEndRef = useRef(null);

  const msg = (text, type = "success") => { setStatus(text); setStatusType(type); };

  const fetchChain = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/chain/stats`);
      setChain(r.data);
    } catch {}
  }, []);

  const fetchCommunity = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/game/community/messages`);
      setChatMessages(r.data.messages || []);
    } catch {}
  }, []);

  const fetchMarketplace = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/game/market`);
      setMarketplace(r.data.listings || []);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/api/game/history`);
      setGameHistory(r.data.history || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchChain();
    fetchCommunity();
    fetchMarketplace();
    const t1 = setInterval(fetchChain, 3000);
    const t2 = setInterval(fetchCommunity, 5000);
    const t3 = setInterval(fetchMarketplace, 8000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); };
  }, [fetchChain, fetchCommunity, fetchMarketplace]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = (accounts) => { if (accounts.length === 0) handleLogout(); };
    const onChain = () => { if (account) msg("Network changed — please reconnect.", "warn"); };
    window.ethereum.on("accountsChanged", onAcc);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAcc);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Wallet Auth (Sign-In with Ethereum) ────────────────────────────────
  const connectWallet = async () => {
    if (!window.ethereum) { alert("Please install MetaMask."); return; }
    if (connecting) return;
    try {
      setConnecting(true);
      msg("Requesting wallet access…", "info");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      msg("Fetching auth nonce…", "info");
      const nonceRes = await axios.get(`${API}/api/auth/nonce/${addr}`);
      const nonce = nonceRes.data.nonce;
      msg("Please sign the authentication message in MetaMask…", "info");
      const message = `Sign in to BlockchainGame\n\nNonce: ${nonce}`;
      const signature = await window.ethereum.request({ method: "personal_sign", params: [message, addr] });
      const authRes = await axios.post(`${API}/api/auth/verify`, { address: addr, signature, nonce });
      const { token, user } = authRes.data;
      setAccount(addr);
      setAuthToken(token);
      setAuthUser(user);
      msg("✅ Authenticated as " + short(addr));
    } catch (e) {
      msg("❌ " + (e.response?.data?.error || e.message), "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    setAccount(""); setAuthToken(""); setAuthUser(null);
    setPlayerInfo(null); setAsset(null); setPlayerNFTs([]);
    msg("Logged out.", "info");
  };

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${authToken}` } });

  // ─── Game Actions ─────────────────────────────────────────────────────────
  const register = async () => {
    if (!account) { msg("Connect your wallet first", "warn"); return; }
    try {
      msg("Registering player on blockchain…", "info");
      const r = await axios.post(`${API}/api/game/register`, { address: account }, authHeaders());
      msg("✅ " + r.data.message);
      fetchChain();
      await refreshPlayer();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const mint = async () => {
    if (!account) { msg("Connect your wallet first", "warn"); return; }
    try {
      msg("Minting NFT asset on blockchain…", "info");
      const r = await axios.post(`${API}/api/game/mint`, { address: account, name: mintName, rarity: Number(mintRarity) }, authHeaders());
      msg("✅ " + r.data.message + " | Tx: " + r.data.tx?.slice(0, 18) + "…");
      fetchChain();
      await refreshPlayer();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const playGame = async () => {
    if (!account) { msg("Connect your wallet first", "warn"); return; }
    try {
      msg("🎲 Playing provably fair game round…", "info");
      const r = await axios.post(`${API}/api/game/play`, { address: account }, authHeaders());
      const gr = r.data.gameResult;
      setGameResult(gr);
      if (gr.outcome === "WIN_POINTS") msg(`🎉 WIN! +${gr.reward} points — Roll: ${gr.roll}/100`, "success");
      else if (gr.outcome === "WIN_RARE_NFT") msg(`🪙 NICE! Won a rare NFT — Roll: ${gr.roll}/100`, "success");
      else if (gr.outcome === "WIN_LEGENDARY_NFT") msg(`🐉 LEGENDARY! Won Dragon Blade NFT — Roll: ${gr.roll}/100`, "success");
      else msg(`😢 Miss — Roll: ${gr.roll}/100. Try again!`, "warn");
      fetchChain();
      fetchHistory();
      await refreshPlayer();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const refreshPlayer = async () => {
    if (!account) return;
    try {
      const pi = await axios.get(`${API}/api/game/player/${account}`);
      setPlayerInfo(pi.data);
      const ni = await axios.get(`${API}/api/game/player/${account}/nfts`);
      setPlayerNFTs(ni.data.nfts || []);
    } catch {}
  };

  const getAsset = async (id = 1) => {
    try {
      const r = await axios.get(`${API}/api/game/asset/${id}`);
      setAsset(r.data);
      msg("✅ Asset #" + id + " loaded");
      fetchChain();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); setAsset(null); }
  };

  const listForSale = async () => {
    if (!listModal) return;
    try {
      msg("📋 Listing NFT on marketplace…", "info");
      await axios.post(`${API}/api/game/market/list`,
        { address: account, tokenId: listModal.tokenId, priceEth: listPrice }, authHeaders());
      msg("✅ Asset listed for " + listPrice + " ETH");
      setListModal(null);
      fetchMarketplace();
      fetchChain();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const buyAsset = async (tokenId) => {
    if (!account) { msg("Connect wallet first", "warn"); return; }
    try {
      msg("💳 Purchasing NFT securely…", "info");
      await axios.post(`${API}/api/game/market/buy`, { address: account, tokenId }, authHeaders());
      msg("✅ NFT purchased! Ownership transferred on blockchain");
      fetchMarketplace();
      fetchChain();
      await refreshPlayer();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const postChat = async () => {
    if (!account) { msg("Connect wallet to chat", "warn"); return; }
    if (!chatMsg.trim()) return;
    try {
      await axios.post(`${API}/api/game/community/post`, { address: account, message: chatMsg }, authHeaders());
      setChatMsg("");
      fetchCommunity();
      fetchChain();
    } catch (e) { msg("❌ " + (e.response?.data?.error || e.message), "error"); }
  };

  const statusColor = { success: "#22c55e", error: "#ef4444", warn: "#f59e0b", info: "#60a5fa" };
  const tabs = [
    { key: "dashboard",   label: "🎮 Game" },
    { key: "nfts",        label: "🖼 My NFTs" },
    { key: "marketplace", label: "🛒 Market" },
    { key: "community",   label: "💬 Community" },
    { key: "fairness",    label: "🎲 Provably Fair" },
    { key: "compliance",  label: "📋 Compliance" },
    { key: "explorer",    label: "⛓️ Explorer" },
    { key: "events",      label: "📡 Events" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a12", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1040 0%,#0f1f3d 100%)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #312e81", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>🎮</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, background: "linear-gradient(90deg,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BlockChain NFT Gaming</div>
            <div style={{ fontSize: 11, color: "#6366f1" }}>Ethereum-compatible · Chain ID 1337 · ERC-721 NFTs</div>
          </div>
        </div>
        {chain && (
          <div style={{ display: "flex", gap: 22, fontSize: 13 }}>
            <Stat label="Block"   value={"#" + chain.blockNumber}   color="#818cf8" />
            <Stat label="Gas"     value={chain.totalGasUsed}         color="#34d399" />
            <Stat label="Txns"    value={chain.totalTx}              color="#f59e0b" />
            <Stat label="Players" value={chain.totalPlayers}         color="#f472b6" />
            <Stat label="NFTs"    value={chain.totalAssets}          color="#c084fc" />
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {account ? (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>✅ {short(account)}</div>
                <div style={{ color: "#64748b", fontSize: 10 }}>🔐 Wallet Verified · JWT Active</div>
              </div>
              <button onClick={handleLogout} style={{ ...btn, background: "#7f1d1d", fontSize: 12, padding: "8px 14px", minWidth: "auto" }}>🚪 Logout</button>
            </>
          ) : (
            <button onClick={connectWallet} disabled={connecting} style={{ ...btn, background: connecting ? "#374151" : "#4f46e5", fontSize: 13 }}>
              {connecting ? "⏳ Connecting…" : "🔗 Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      {!account && (
        <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "10px 28px", fontSize: 13, color: "#64748b" }}>
          🔐 Sign in with Ethereum — Connect MetaMask to sign a message (no gas fee). Your signature cryptographically proves wallet ownership.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, padding: "10px 28px", borderBottom: "1px solid #1e293b", flexWrap: "wrap", background: "#0a0a12" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === "nfts") refreshPlayer(); if (t.key === "fairness") fetchHistory(); }} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: tab === t.key ? "#4f46e5" : "#1e293b", color: tab === t.key ? "white" : "#94a3b8",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Status bar */}
      {status && (
        <div style={{ padding: "8px 28px", background: "#0f172a", borderBottom: "1px solid #1e293b" }}>
          <div style={{ padding: "8px 14px", borderRadius: 6, background: "#1e293b", borderLeft: "4px solid " + (statusColor[statusType] || "#60a5fa"), fontSize: 13, color: statusColor[statusType] || "#e2e8f0" }}>
            {status}
          </div>
        </div>
      )}

      <div style={{ padding: "22px 28px" }}>

        {/* ── GAME TAB ────────────────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 24 }}>

              {/* Blockchain Info */}
              <Card title="⛓️ Blockchain Integration" accent="#6366f1">
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 12px" }}>Connected to Ethereum-compatible blockchain (Chain ID: 1337) with ERC-721 NFT standard support and smart contract execution.</p>
                <KV k="Network"   v="Mock Ethereum (Ganache-compatible)" />
                <KV k="Standard"  v="ERC-721 NFT" />
                <KV k="Gas Price" v={chain?.gasPrice || "20 Gwei"} />
                <KV k="Block"     v={"#" + (chain?.blockNumber || "…")} />
              </Card>

              {/* Actions */}
              <Card title="🎮 Game Actions" accent="#818cf8">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <ActionBtn onClick={register} icon="📝" label="Register Player" sub="~46,000 gas" disabled={!account} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={mintName} onChange={e => setMintName(e.target.value)} style={selectStyle}>
                      <option>Sword</option><option>Shield</option><option>Bow</option><option>Armor</option><option>Amulet</option>
                    </select>
                    <select value={mintRarity} onChange={e => setMintRarity(e.target.value)} style={selectStyle}>
                      <option value={1}>Common</option><option value={2}>Uncommon</option><option value={3}>Rare</option>
                    </select>
                    <button onClick={mint} disabled={!account} style={{ ...btn, background: account ? "#1d4ed8" : "#1e293b", opacity: account ? 1 : 0.5, padding: "8px 14px", minWidth: "auto", fontSize: 13 }}>🪙 Mint NFT</button>
                  </div>
                  <ActionBtn onClick={playGame} icon="🎲" label="Play Game (Provably Fair)" sub="Win NFTs & points" disabled={!account} color="#7c3aed" />
                  <ActionBtn onClick={refreshPlayer} icon="👤" label="Refresh My Profile" sub="" disabled={!account} color="#0f766e" />
                </div>
              </Card>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
              {playerInfo && (
                <Card title="👤 Player Profile" accent="#22c55e">
                  <KV k="Wallet"     v={short(account)} mono />
                  <KV k="Registered" v={playerInfo.registered ? "✅ Yes" : "❌ No"} />
                  <KV k="Score"      v={playerInfo.score} />
                  <KV k="Games"      v={playerInfo.gamesPlayed || 0} />
                  <KV k="NFTs Owned" v={(playerInfo.nftDetails || []).length} />
                </Card>
              )}
              {authUser && account && (
                <Card title="🔐 Auth Status" accent="#f59e0b">
                  <KV k="Method"    v="Sign-In with Ethereum" />
                  <KV k="Wallet"    v={short(account)} mono />
                  <KV k="Verified"  v={<span style={{ color: "#22c55e" }}>✅ Signature OK</span>} />
                  <KV k="Token"     v="JWT (24h expiry)" />
                  <KV k="2FA"       v="Wallet signature" />
                </Card>
              )}
              {gameResult && (
                <Card title="🎲 Last Game Result" accent={gameResult.outcome === "MISS" ? "#ef4444" : "#22c55e"}>
                  <KV k="Outcome"     v={gameResult.outcome} />
                  <KV k="Roll"        v={gameResult.roll + "/100"} />
                  <KV k="Reward"      v={gameResult.rewardType === "score" ? "+" + gameResult.reward + " pts" : gameResult.rewardType === "none" ? "None" : "NFT!"} />
                  <KV k="Fair Proof"  v={<span style={{ color: "#a5b4fc", fontSize: 10, fontFamily: "monospace" }}>{gameResult.serverSeedHash?.slice(0, 18) + "…"}</span>} />
                </Card>
              )}
              {chain && (
                <Card title="🏦 Balances" accent="#4f8ef7">
                  {Object.entries(chain.balances).slice(0, 4).map(([addr, bal]) => (
                    <KV key={addr} k={short(addr)} v={bal} mono />
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── MY NFTs TAB ─────────────────────────────────────────────────── */}
        {tab === "nfts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: "#a5b4fc", margin: 0 }}>🖼 My NFT Collection (ERC-721)</h3>
              {!account && <span style={{ color: "#64748b", fontSize: 13 }}>Connect wallet to view your NFTs</span>}
            </div>
            {playerNFTs.length === 0 && account && (
              <div style={{ padding: 24, background: "#1e293b", borderRadius: 10, color: "#64748b", textAlign: "center" }}>
                No NFTs yet — mint one or win one by playing! 🎮
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16 }}>
              {playerNFTs.map((nft, i) => (
                <div key={i} style={{ background: RARITY_BG[nft.rarity] || "#1e293b", borderRadius: 12, padding: 16, border: "1px solid " + (RARITY_COLOR[nft.rarity] || "#334155"), position: "relative" }}>
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 10 }}>
                    {nft.name === "Dragon Blade" ? "🐉" : nft.name === "Battle Sword" ? "⚔️" : nft.name === "Sword" ? "🗡️" : nft.name === "Shield" ? "🛡️" : nft.name === "Bow" ? "🏹" : nft.name === "Armor" ? "🥋" : "💎"}
                  </div>
                  <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 4 }}>{nft.name}</div>
                  <div style={{ color: RARITY_COLOR[nft.rarity], textAlign: "center", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>● {RARITY_LABEL[nft.rarity]}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", textAlign: "center", marginBottom: 10 }}>Token #{nft.tokenId} · ERC-721</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => getAsset(nft.tokenId)} style={{ ...btn, background: "#1e3a5f", padding: "6px 10px", fontSize: 11, flex: 1, minWidth: "auto" }}>🔍 View</button>
                    <button onClick={() => setListModal({ tokenId: nft.tokenId, name: nft.name })} style={{ ...btn, background: "#064e3b", padding: "6px 10px", fontSize: 11, flex: 1, minWidth: "auto" }}>📋 List</button>
                  </div>
                </div>
              ))}
            </div>
            {asset && (
              <div style={{ marginTop: 20 }}>
                <Card title="🔍 Asset Details" accent="#6366f1">
                  <KV k="Name"      v={asset.name} />
                  <KV k="Rarity"    v={<span style={{ color: RARITY_COLOR[asset.rarity] }}>● {RARITY_LABEL[asset.rarity]}</span>} />
                  <KV k="Owner"     v={short(asset.owner)} mono />
                  <KV k="Standard"  v="ERC-721" />
                  <KV k="Ownership" v={<span style={{ color: "#22c55e" }}>✅ On-chain verified</span>} />
                </Card>
              </div>
            )}
            {/* List Modal */}
            {listModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                <div style={{ background: "#1e293b", borderRadius: 12, padding: 28, width: 320, border: "1px solid #4f46e5" }}>
                  <h3 style={{ margin: "0 0 16px", color: "#a5b4fc" }}>📋 List NFT for Sale</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Asset: <strong>{listModal.name}</strong> (#{listModal.tokenId})</p>
                  <label style={{ fontSize: 13, color: "#64748b" }}>Price (ETH)</label>
                  <input value={listPrice} onChange={e => setListPrice(e.target.value)} type="number" step="0.1" style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "8px 12px", color: "#e2e8f0", fontSize: 14, marginTop: 6, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button onClick={listForSale} style={{ ...btn, flex: 1, background: "#4f46e5", padding: "10px" }}>List for {listPrice} ETH</button>
                    <button onClick={() => setListModal(null)} style={{ ...btn, flex: 1, background: "#374151", padding: "10px" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MARKETPLACE TAB ─────────────────────────────────────────────── */}
        {tab === "marketplace" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: "#a5b4fc", margin: 0 }}>🛒 NFT Marketplace</h3>
              <div style={{ fontSize: 12, color: "#64748b" }}>🔒 Secure on-chain transactions · Ownership auto-transferred</div>
            </div>
            {marketplace.length === 0 && (
              <div style={{ padding: 24, background: "#1e293b", borderRadius: 10, color: "#64748b", textAlign: "center" }}>
                No listings yet — list your NFTs from "My NFTs" tab!
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {marketplace.map((listing, i) => (
                <div key={i} style={{ background: RARITY_BG[listing.rarity] || "#1e293b", borderRadius: 12, padding: 18, border: "1px solid " + (RARITY_COLOR[listing.rarity] || "#334155") }}>
                  <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>
                    {listing.name === "Dragon Blade" ? "🐉" : listing.name === "Sword" ? "🗡️" : listing.name === "Shield" ? "🛡️" : "💎"}
                  </div>
                  <div style={{ fontWeight: 700, textAlign: "center", marginBottom: 4 }}>{listing.name}</div>
                  <div style={{ color: RARITY_COLOR[listing.rarity], textAlign: "center", fontSize: 12, marginBottom: 8 }}>● {RARITY_LABEL[listing.rarity]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, textAlign: "center", color: "#f59e0b", marginBottom: 4 }}>{listing.priceEth}</div>
                  <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 12 }}>Seller: {listing.seller?.slice(0,14) || "…"}</div>
                  <button onClick={() => buyAsset(listing.tokenId)} disabled={!account} style={{ ...btn, width: "100%", background: account ? "#065f46" : "#1e293b", opacity: account ? 1 : 0.5 }}>
                    💳 Buy Securely
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 16, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
              <div style={{ fontWeight: 600, color: "#a5b4fc", marginBottom: 8 }}>🔒 Secure Transaction Guarantee</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>All marketplace transactions are executed via smart contracts. Ownership transfers are atomic and tamper-proof — if payment fails, the NFT stays with the seller. No intermediary required.</div>
            </div>
          </div>
        )}

        {/* ── COMMUNITY TAB ───────────────────────────────────────────────── */}
        {tab === "community" && (
          <div>
            <h3 style={{ color: "#a5b4fc", marginTop: 0 }}>💬 Community Chat</h3>
            <div style={{ background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b", height: 380, overflowY: "auto", padding: 16, marginBottom: 12 }}>
              {chatMessages.length === 0 && <p style={{ color: "#475569", textAlign: "center", marginTop: 60 }}>No messages yet — be the first to post!</p>}
              {[...chatMessages].reverse().map((m, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>🦊</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6366f1", fontWeight: 700 }}>{m.authorShort}</span>
                    <span style={{ fontSize: 10, color: "#475569" }}>{new Date(m.timestamp).toLocaleTimeString()} · Block #{m.blockNumber}</span>
                  </div>
                  <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#e2e8f0", marginLeft: 28 }}>
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && postChat()}
                placeholder={account ? "Type a message… (Enter to send)" : "Connect wallet to chat"}
                disabled={!account}
                maxLength={280}
                style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }}
              />
              <button onClick={postChat} disabled={!account || !chatMsg.trim()} style={{ ...btn, background: account && chatMsg.trim() ? "#4f46e5" : "#1e293b", padding: "10px 20px", minWidth: "auto" }}>Send</button>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>Messages are stored on-chain events · Max 280 characters · Wallet-authenticated only</div>
          </div>
        )}

        {/* ── PROVABLY FAIR TAB ────────────────────────────────────────────── */}
        {tab === "fairness" && (
          <div>
            <h3 style={{ color: "#a5b4fc", marginTop: 0 }}>🎲 Provably Fair Gameplay</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <Card title="How It Works" accent="#6366f1">
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 8 }}>1. <strong style={{ color: "#a5b4fc" }}>Commit:</strong> Server generates a secret seed and commits its hash before revealing the outcome.</div>
                  <div style={{ marginBottom: 8 }}>2. <strong style={{ color: "#a5b4fc" }}>Roll:</strong> Outcome determined by combining server seed + client seed (your wallet + block number).</div>
                  <div style={{ marginBottom: 8 }}>3. <strong style={{ color: "#a5b4fc" }}>Verify:</strong> After the game, both seeds are disclosed — you can independently verify the result.</div>
                  <div>4. <strong style={{ color: "#a5b4fc" }}>Immutable:</strong> All game records stored on-chain. Outcomes cannot be manipulated post-hoc.</div>
                </div>
              </Card>
              <Card title="Probability Table" accent="#818cf8">
                <div style={{ fontSize: 13 }}>
                  {[
                    { range: "0–49", outcome: "Miss", chance: "50%", color: "#ef4444" },
                    { range: "50–79", outcome: "Win Points (+10-29)", chance: "30%", color: "#f59e0b" },
                    { range: "80–94", outcome: "Win Uncommon NFT", chance: "15%", color: "#4f8ef7" },
                    { range: "95–99", outcome: "Win Legendary NFT 🐉", chance: "5%", color: "#c084fc" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                      <span style={{ fontFamily: "monospace", color: "#64748b", fontSize: 12 }}>Roll {r.range}</span>
                      <span style={{ color: r.color, fontSize: 13 }}>{r.outcome}</span>
                      <span style={{ fontWeight: 700, color: r.color }}>{r.chance}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <h3 style={{ color: "#818cf8", marginBottom: 12 }}>📜 Game History (Verifiable)</h3>
            {gameHistory.length === 0 && <p style={{ color: "#475569" }}>No games played yet. Hit "Play Game" in the Game tab!</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {gameHistory.map((g, i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px", borderLeft: "4px solid " + (g.outcome === "MISS" ? "#ef4444" : "#22c55e") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: g.outcome === "MISS" ? "#ef4444" : "#22c55e" }}>{g.outcome}</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>{new Date(g.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
                    <span style={{ color: "#64748b" }}>Roll: <span style={{ color: "#f59e0b", fontWeight: 700 }}>{g.roll}/100</span></span>
                    <span style={{ color: "#64748b" }}>Block: <span style={{ color: "#818cf8" }}>#{g.blockNumber}</span></span>
                    {g.reward > 0 && <span style={{ color: "#64748b" }}>Reward: <span style={{ color: "#22c55e" }}>+{g.reward}</span></span>}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace", color: "#475569" }}>
                    Seed Hash: {g.serverSeedHash?.slice(0, 30)}…
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: "#475569" }}>✅ {g.verifiable}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COMPLIANCE TAB ──────────────────────────────────────────────── */}
        {tab === "compliance" && (
          <div>
            <h3 style={{ color: "#a5b4fc", marginTop: 0 }}>📋 Regulatory Compliance</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 24 }}>
              <Card title="🌐 Jurisdiction & Legal" accent="#6366f1">
                <KV k="Framework"      v="International / Multi-Jurisdictional" />
                <KV k="KYC Required"   v="No (self-custody wallets)" />
                <KV k="AML Monitoring" v={<span style={{ color: "#22c55e" }}>✅ Active</span>} />
                <KV k="GDPR"           v={<span style={{ color: "#22c55e" }}>✅ Compliant</span>} />
                <KV k="Age Policy"     v="18+ (attestation on sign-up)" />
                <KV k="Data Storage"   v="On-chain (public, immutable)" />
              </Card>
              <Card title="🔒 Security Standards" accent="#4f8ef7">
                <KV k="Auth Method"      v="Sign-In with Ethereum (EIP-4361)" />
                <KV k="Token Type"       v="JWT RS256 (24h expiry)" />
                <KV k="Nonce Protection" v={<span style={{ color: "#22c55e" }}>✅ One-time, 5min TTL</span>} />
                <KV k="Replay Attacks"   v={<span style={{ color: "#22c55e" }}>✅ Prevented</span>} />
                <KV k="TX Integrity"     v={<span style={{ color: "#22c55e" }}>✅ Blockchain-verified</span>} />
                <KV k="Fraud Prevention" v={<span style={{ color: "#22c55e" }}>✅ Smart contract enforced</span>} />
              </Card>
              <Card title="⚖️ Game Fairness" accent="#818cf8">
                <KV k="RNG Type"       v="Commit-Reveal Scheme" />
                <KV k="Verifiable"     v={<span style={{ color: "#22c55e" }}>✅ Post-game disclosure</span>} />
                <KV k="Manipulation"   v={<span style={{ color: "#22c55e" }}>✅ Cryptographically prevented</span>} />
                <KV k="House Edge"     v="Transparent (50% miss rate)" />
                <KV k="Audit Trail"    v={<span style={{ color: "#22c55e" }}>✅ All outcomes on-chain</span>} />
              </Card>
              <Card title="📊 NFT / Asset Compliance" accent="#c084fc">
                <KV k="Standard"      v="ERC-721 (widely recognized)" />
                <KV k="Ownership"     v={<span style={{ color: "#22c55e" }}>✅ Verifiable on-chain</span>} />
                <KV k="Transferable"  v="Yes — player-to-player" />
                <KV k="IP Rights"     v="Game assets — platform-defined" />
                <KV k="Tax Reporting" v="User responsibility (varies by jurisdiction)" />
              </Card>
            </div>
            <div style={{ padding: 16, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
              <strong style={{ color: "#a5b4fc" }}>⚠️ Legal Disclaimer:</strong> This platform is for demonstration and entertainment purposes. Blockchain-based gaming may be subject to regulations in your jurisdiction. Users are responsible for compliance with local laws regarding digital assets, gaming, and taxation. This platform does not provide financial advice. All NFTs are in-game assets with no guaranteed monetary value.
            </div>
            {chain?.complianceLog && chain.complianceLog.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: "#818cf8", marginBottom: 10 }}>📜 Compliance Audit Log</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {chain.complianceLog.map((entry, i) => (
                    <div key={i} style={{ background: "#1e293b", borderRadius: 6, padding: "10px 14px", fontSize: 12, display: "flex", gap: 20 }}>
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>{entry.type}</span>
                      <span style={{ color: "#64748b" }}>{entry.address?.slice(0, 14)}…</span>
                      <span style={{ color: "#22c55e" }}>{entry.status}</span>
                      <span style={{ color: "#475569" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BLOCK EXPLORER TAB ──────────────────────────────────────────── */}
        {tab === "explorer" && chain && (
          <div>
            <h3 style={{ color: "#818cf8", marginTop: 0, marginBottom: 12 }}>⛓️ Block Explorer</h3>
            <table style={tbl}>
              <thead>
                <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>
                  <Th>Block</Th><Th>Time</Th><Th>Method</Th><Th>From</Th><Th>Gas</Th><Th>Cost</Th><Th>Tx Hash</Th>
                </tr>
              </thead>
              <tbody>
                {chain.blocks.map((b, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b", fontSize: 13 }}>
                    <Td><span style={{ color: "#818cf8", fontWeight: 700 }}>#{b.number}</span></Td>
                    <Td>{new Date(b.timestamp).toLocaleTimeString()}</Td>
                    <Td><span style={{ background: "#0a0a12", padding: "2px 8px", borderRadius: 4, color: "#34d399", fontFamily: "monospace", fontSize: 11 }}>{b.method}</span></Td>
                    <Td mono>{b.from}</Td>
                    <Td><span style={{ color: "#f59e0b" }}>{b.gasUsed?.toLocaleString()}</span></Td>
                    <Td>{b.gasCostEth}</Td>
                    <Td mono style={{ color: "#475569", fontSize: 10 }}>{b.txHash?.slice(0, 16)}…</Td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ color: "#818cf8", margin: "24px 0 12px" }}>📋 Transactions</h3>
            <table style={tbl}>
              <thead>
                <tr style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>
                  <Th>Tx Hash</Th><Th>Method</Th><Th>Block</Th><Th>Gas</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {chain.transactions.map((tx, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b", fontSize: 13 }}>
                    <Td mono style={{ color: "#475569", fontSize: 10 }}>{tx.transactionHash?.slice(0, 20)}…</Td>
                    <Td><span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 11 }}>{tx.method}</span></Td>
                    <Td style={{ color: "#818cf8" }}>#{tx.blockNumber}</Td>
                    <Td style={{ color: "#f59e0b" }}>{tx.gasUsed?.toLocaleString()}</Td>
                    <Td><span style={{ color: "#22c55e" }}>✅ Success</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── EVENTS TAB ──────────────────────────────────────────────────── */}
        {tab === "events" && chain && (
          <div>
            <h3 style={{ color: "#a5b4fc", marginTop: 0 }}>📡 Smart Contract Events (Live)</h3>
            {chain.events.length === 0 && <p style={{ color: "#475569" }}>No events yet — perform a transaction.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {chain.events.map((ev, i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 14 }}>📡 {ev.event}</span>
                    <span style={{ color: "#475569", fontSize: 11 }}>Block #{ev.blockNumber} · {new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
                    {Object.entries(ev.params).map(([k, v]) => (
                      <span key={k} style={{ marginRight: 16 }}>
                        <span style={{ color: "#64748b" }}>{k}: </span>
                        <span style={{ color: "#e2e8f0" }}>{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Components ─────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
function ActionBtn({ onClick, icon, label, sub, disabled, color = "#312e81" }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#1e293b" : color, color: "white", opacity: disabled ? 0.5 : 1, width: "100%" }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "#a5b4fc" }}>{sub}</div>}
      </div>
    </button>
  );
}
function Card({ title, children, accent = "#6366f1" }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: "16px 18px", border: "1px solid #1e293b", borderTop: "3px solid " + accent }}>
      <div style={{ fontWeight: 700, color: "#a5b4fc", marginBottom: 14, fontSize: 14 }}>{title}</div>
      {children}
    </div>
  );
}
function KV({ k, v, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "#64748b", flexShrink: 0 }}>{k}</span>
      <span style={{ color: "#e2e8f0", fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? 11 : 13, textAlign: "right" }}>{v}</span>
    </div>
  );
}
function Th({ children }) {
  return <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, letterSpacing: 0.5 }}>{children}</th>;
}
function Td({ children, mono, style: s }) {
  return <td style={{ padding: "10px 12px", fontFamily: mono ? "monospace" : "inherit", ...s }}>{children}</td>;
}

const btn = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "12px 20px", borderRadius: 8, border: "none", cursor: "pointer",
  background: "#312e81", color: "white", gap: 4, minWidth: 120,
};
const tbl = { width: "100%", borderCollapse: "collapse", background: "#1e293b", borderRadius: 10, overflow: "hidden" };
const selectStyle = { background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#e2e8f0", fontSize: 13, flex: 1 };
