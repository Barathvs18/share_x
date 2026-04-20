# 🔗 MetaMask → Local Hardhat Conversion Guide
## Secure Share X — Blockchain Migration

> **Scope:** Only `web3.js` was changed. Zero other files were touched.  
> **Result:** Full blockchain features work locally with no browser wallet, no testnet, no internet.

---

## 📋 What Changed vs. What Stayed the Same

| Item | Status | Notes |
|---|---|---|
| `frontend/src/services/web3.js` | ✅ **Modified** | MetaMask → JsonRpcProvider + Wallet |
| `hardhat.config.js` | ✅ **New** | Hardhat configuration |
| `scripts/deploy.js` | ✅ **New** | Local deployment script |
| `package.json` (root) | ✅ **New** | Hardhat npm scripts |
| `backend/utils/blockchain.py` | ✅ **New** | Optional backend-signing alternative |
| `backend/.env.example` | ✅ **Updated** | Added blockchain env variables |
| All other frontend pages | 🔒 **Untouched** | UploadFile, ShareFile, VerifyFile, etc. |
| All backend routes | 🔒 **Untouched** | files.py, user.py, database.py, etc. |
| Smart contract | 🔒 **Untouched** | SecureFileShare.sol unchanged |

---

## 🆚 What Actually Changed in web3.js

### BEFORE — MetaMask (Polygon)
```javascript
// Required MetaMask browser extension
const provider = new ethers.BrowserProvider(window.ethereum);  // ❌ window.ethereum
const signer = await provider.getSigner();                       // ❌ MetaMask popup
```

### AFTER — Local Hardhat
```javascript
// Connects directly to local node — no browser extension needed
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");  // ✅
const wallet = new ethers.Wallet(HARDHAT_PRIVATE_KEY, provider);        // ✅ no popup
```

The function signature of `getContractInstance()` is **identical** — so `UploadFile.jsx` works with zero changes.

---

## 📁 New Files Created

```
secure_share_x/
├── hardhat.config.js              ← Hardhat configuration
├── package.json                   ← Root-level Hardhat npm scripts
├── scripts/
│   └── deploy.js                  ← Deploy contract to local node
├── artifacts/                     ← Auto-generated after compile (DO NOT EDIT)
│   └── contracts/
│       └── SecureFileShare.sol/
│           └── SecureFileShare.json  ← ABI + bytecode
├── backend/
│   └── utils/
│       └── blockchain.py          ← Optional: backend-side signing
└── frontend/src/services/
    └── web3.js                    ← ✏️ Only modified file
```

---

## 🚀 PHASE 1 — One-Time Setup

> **Node.js must be installed.** Run `node --version` to check.

### Install Hardhat (already done for you ✅)

```powershell
cd C:\Users\V.S.BARATH\Desktop\sceure_share_x
npm install
```

### Compile the Smart Contract (already done ✅)

```powershell
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully (evm target: paris).
```

---

## 🚀 PHASE 2 — Deploy Contract & Update Address

### Step 1: Start the Hardhat local node (Terminal 1)

```powershell
npx hardhat node
```

You'll see output like this — **keep this terminal open the entire time**:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

> ℹ️ Account #0 is already hardcoded in `web3.js` and `blockchain.py` — nothing to change.

### Step 2: Deploy the Contract (Terminal 2)

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

You'll see:
```
🚀 Deploying SecureFileShare contract to local Hardhat node...

✅ Contract deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Contract Address : 0x5FbDB2315678afecb367f032d93F642f64180aa3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 NEXT STEP:
   Open frontend/src/services/web3.js
   Replace CONTRACT_ADDRESS with: "0x5FbDB2315678afecb367f032d93F642f64180aa3"

💾 Saved deployment info to: deployed.json
```

### Step 3: Update CONTRACT_ADDRESS in web3.js

Open `frontend/src/services/web3.js` and update line 13:

```javascript
// ✏️  Paste your deployed contract address here
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
//                                ^ paste your actual address from Step 2
```

> ⚠️ **Important:** Every time you restart the Hardhat node, the blockchain resets and you must redeploy + update this address.

---

## 🚀 PHASE 3 — Two Signing Approaches

### Approach A: Frontend Signing (Default — Already Active)

The updated `web3.js` handles this automatically. When `UploadFile.jsx` calls:
```javascript
const contract = await getContractInstance(true); // needSigner = true
await contract.uploadFile(data.file_hash);
```
The Wallet signs silently — **no popup, no MetaMask**. ✅

**Pros:** Simple, no backend changes needed  
**Cons:** Private key is visible in browser DevTools (acceptable for local dev)

---

### Approach B: Backend Signing (More Secure — Optional)

The file `backend/utils/blockchain.py` handles this. The backend signs transactions using Python's `web3` library.

**Setup:**
```powershell
cd backend
pip install web3
```

**How to use it in a route** (example — modify `routes/files.py` optionally):
```python
from utils.blockchain import anchor_file_hash

# After saving the file to MongoDB...
blockchain_result = await anchor_file_hash(file_hash)
print(f"Blockchain: {blockchain_result}")
```

**Pros:** Private key stays on the server, not exposed to browser  
**Cons:** Requires `pip install web3`, and backend must be running alongside Hardhat node

### 🏆 Recommendation

| Scenario | Use |
|---|---|
| Local development / portfolio demo | **Approach A** (frontend, simpler) |
| Staging / production-like environment | **Approach B** (backend, more secure) |

---

## 🚀 PHASE 4 — ABI Stays the Same

Your `CONTRACT_ABI` in `web3.js` is the **human-readable ABI** (ethers.js format):
```javascript
export const CONTRACT_ABI = [
    "function uploadFile(string _fileHash) returns (uint256)",
    "function shareFile(uint256 _fileId, address _userAddress, uint256 _expiryTime)",
    ...
];
```

This does **not need to change** unless you modify `SecureFileShare.sol`. The Solidity contract is unchanged, so the ABI is unchanged.

> If you ever DO change `SecureFileShare.sol`:
> 1. Run `npx hardhat compile`
> 2. Open `artifacts/contracts/SecureFileShare.sol/SecureFileShare.json`
> 3. Copy the `abi` array from that file
> 4. Update `CONTRACT_ABI` in `web3.js`

---

## 🚀 PHASE 5 — Running Everything Together

Open **4 terminals** and run in this exact order:

```
TERMINAL 1                          TERMINAL 2
─────────────────────────────────   ─────────────────────────────────
cd secure_share_x                   cd secure_share_x
npx hardhat node                    npx hardhat run scripts/deploy.js --network localhost
                                    (run AFTER Terminal 1 is ready)
                                    → Copy the contract address printed
                                    → Paste into web3.js CONTRACT_ADDRESS

TERMINAL 3                          TERMINAL 4
─────────────────────────────────   ─────────────────────────────────
cd secure_share_x/backend           cd secure_share_x/frontend
venv\Scripts\activate               npm run dev
uvicorn main:app --reload
```

### Order Matters:
1. ✅ **T1 first** — Hardhat node must be running before deploy
2. ✅ **T2 second** — Deploy contract, get address, paste into web3.js
3. ✅ **T3 & T4 anytime** — Backend and frontend are independent of chain

---

## ❌ Common Errors & Fixes

### Error: `connect ECONNREFUSED 127.0.0.1:8545`
```
Cause:  Hardhat node is not running
Fix:    Start it → npx hardhat node (Terminal 1)
```

### Error: `Blockchain skipped or rejected` (toast in UI)
```
Cause:  CONTRACT_ADDRESS is still the placeholder "0xYourDeployedContractAddress"
Fix:    Redeploy → npx hardhat run scripts/deploy.js --network localhost
        Paste the printed address into frontend/src/services/web3.js
```

### Error: `transaction reverted` or `invalid contract`
```
Cause:  Hardhat node was restarted (blockchain reset) but old address is still in web3.js
Fix:    Redeploy the contract and update CONTRACT_ADDRESS again
```

### Error: `nonce too high`
```
Cause:  Hardhat node was restarted but the in-memory nonce is stale
Fix:    Restart the Hardhat node — npx hardhat node (it resets automatically)
```

### Error: `could not detect network`
```
Cause:  Wrong RPC URL
Fix:    Ensure Hardhat is running on port 8545 (default)
        Check web3.js: const LOCAL_RPC_URL = "http://127.0.0.1:8545";
```

### Error: `File doesn't exist` (contract call)
```
Cause:  fileId 0 — contract was reset when Hardhat node restarted
Fix:    Redeploy and re-upload files after restarting the chain
```

---

## 💡 Key Things to Remember

> **Every time you restart `npx hardhat node`, the blockchain data resets from zero.**  
> You must redeploy the contract and update `CONTRACT_ADDRESS` in `web3.js`.

> **The Hardhat private key (`0xac0974...`) is a well-known dev key.**  
> It is safe to use locally. NEVER use it on Ethereum/Polygon mainnet.

> **Your company/portfolio demonstration works 100% offline.**  
> No internet, no MetaMask, no testnet faucet needed. Just 4 terminals.

---

## 📊 Before vs. After Comparison

| Feature | Before (MetaMask) | After (Hardhat) |
|---|---|---|
| Browser extension required | ✅ MetaMask needed | ❌ Not needed |
| Internet connection needed | ✅ For Polygon RPC | ❌ All local |
| Testnet MATIC needed | ✅ Faucet required | ❌ Free 10000 ETH |
| Transaction popup | ✅ Every upload | ❌ Silent, automatic |
| Network switching | ✅ Must be on Polygon | ❌ Auto localhost |
| Works offline | ❌ No | ✅ Yes |
| Setup time | High (install, faucet, configure) | Low (one npm install) |
| Code changed | — | Only web3.js (1 file) |
