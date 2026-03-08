# 🔐 Secure Share X — Complete Project Guide

> A **Decentralized Secure File Sharing Platform** combining a traditional backend (FastAPI + MongoDB) with Blockchain-powered integrity verification (Solidity + MetaMask + Polygon).

---

## 📑 Table of Contents

1. [What Is This Project?](#-what-is-this-project)
2. [Architecture Overview](#-architecture-overview)
3. [Tech Stack](#-tech-stack)
4. [Folder Structure](#-folder-structure)
5. [How Each Layer Works](#-how-each-layer-works)
   - [Backend (FastAPI)](#1-backend-fastapi--mongodb)
   - [Frontend (React + Vite)](#2-frontend-react--vite)
   - [Smart Contract (Solidity)](#3-smart-contract-solidity--polygon)
6. [Complete User Flow](#-complete-user-flow)
7. [MetaMask — What, Why, and How](#-metamask--what-why-and-how)
8. [Smart Contract Deployment Guide](#-smart-contract-deployment-guide)
9. [How to Run the Project](#-how-to-run-the-project)
10. [API Reference](#-api-reference)
11. [Common Errors & Fixes](#-common-errors--fixes)

---

## 🧠 What Is This Project?

**Secure Share X** is a file-sharing platform where:

- Users can **upload** files securely.
- Files are **hashed using SHA-256** (a cryptographic fingerprint).
- The hash is **stored on a Blockchain** (Polygon network) making it **impossible to tamper**.
- Users can **share** files with other registered users with a **time-limited access token**.
- File owners can **revoke** access at any time — even before the time limit expires.
- Anyone with access can **verify** a file's integrity by comparing the live hash with the blockchain-anchored hash.

### Why is this special?

| Traditional File Sharing | Secure Share X |
|---|---|
| Files can be silently modified on the server | SHA-256 hash detects any changes instantly |
| No proof the file wasn't tampered with | Blockchain provides immutable proof |
| Shared links live forever | Time-based expiry + instant revoke |
| Trust the server blindly | Zero-trust verification via blockchain |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │  React App   │    │   MetaMask   │    │   ethers.js      │  │
│   │  (Vite)      │◄──►│   Wallet     │◄──►│   (Web3 Bridge)  │  │
│   └──────┬───────┘    └──────────────┘    └────────┬─────────┘  │
│          │                                         │            │
└──────────┼─────────────────────────────────────────┼────────────┘
           │ REST API (HTTP)                         │ Smart Contract Calls
           ▼                                         ▼
┌──────────────────┐                    ┌─────────────────────────┐
│   FastAPI Server │                    │   Polygon Blockchain    │
│   (Port 8000)    │                    │   (Amoy Testnet or      │
│                  │                    │    Mainnet)             │
│  ┌────────────┐  │                    │                         │
│  │  Routes    │  │                    │  ┌───────────────────┐  │
│  │  /users    │  │                    │  │ SecureFileShare.sol│ │
│  │  /files    │  │                    │  │                   │  │
│  └──────┬─────┘  │                    │  │ - uploadFile()    │  │
│         │        │                    │  │ - shareFile()     │  │
│  ┌──────▼─────┐  │                    │  │ - revokeFile()    │  │
│  │  MongoDB   │  │                    │  │ - verifyFile()    │  │
│  │  Atlas     │  │                    │  └───────────────────┘  │
│  └────────────┘  │                    └─────────────────────────┘
└──────────────────┘
```

**Two parallel systems work together:**

1. **Backend (FastAPI + MongoDB)** — Handles user auth, file storage, sharing logic, file downloads.
2. **Blockchain (Solidity + Polygon)** — Stores file hashes on-chain for tamper-proof verification.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React + Vite | UI, routing, user interaction |
| **Styling** | Vanilla CSS + Framer Motion | Dark theme, animations, glassmorphism |
| **Backend** | FastAPI (Python) | REST API, auth, file management |
| **Database** | MongoDB Atlas (Motor driver) | User accounts, file records, share records |
| **Auth** | JWT (JSON Web Tokens) | Stateless user authentication |
| **Hashing** | SHA-256 (hashlib) | Cryptographic file fingerprinting |
| **Blockchain** | Solidity ^0.8.19 | Smart contract for immutable hash storage |
| **Network** | Polygon (Amoy Testnet) | Low-cost Ethereum-compatible chain |
| **Wallet** | MetaMask | Signs blockchain transactions from the browser |
| **Web3 Bridge** | ethers.js v6 | Connects React app to the smart contract via MetaMask |

---

## 📁 Folder Structure

```
secure_share_x/
├── backend/                    # FastAPI Python server
│   ├── main.py                 # App entry point, lifespan, CORS
│   ├── database.py             # MongoDB connection (Motor async)
│   ├── models.py               # Pydantic schemas (User, Share, Revoke, Verify)
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # 🔑 Secret keys (MONGO_URL, SECRET_KEY)
│   ├── .env.example            # Template for .env
│   ├── routes/
│   │   ├── user.py             # /register, /login
│   │   └── files.py            # /upload, /share, /revoke, /verify, /myfiles, /shared, /myshares, /download
│   ├── utils/
│   │   ├── auth.py             # JWT creation, password hashing (bcrypt), token verification
│   │   └── hashing.py          # SHA-256 hash generation
│   └── uploads/                # Physical file storage directory
│
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # React root, AuthProvider, Toaster
│   │   ├── App.css             # Global styles
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state (login, logout, token)
│   │   ├── services/
│   │   │   ├── api.js          # Axios API calls to backend
│   │   │   └── web3.js         # ethers.js — MetaMask + smart contract bridge
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Top navigation bar
│   │   │   ├── Sidebar.jsx     # Side navigation
│   │   │   ├── Layout.jsx      # Authenticated page wrapper
│   │   │   └── FileCard.jsx    # Reusable file display card
│   │   ├── pages/
│   │   │   ├── Login.jsx       # Login form
│   │   │   ├── Register.jsx    # Registration form
│   │   │   ├── Dashboard.jsx   # Overview of uploads + received shares
│   │   │   ├── UploadFile.jsx  # File upload with drag-and-drop + blockchain anchor
│   │   │   ├── ShareFile.jsx   # Share a file with another user (email + time limit)
│   │   │   ├── SharedFiles.jsx # View received shares + manage active shares (revoke)
│   │   │   └── VerifyFile.jsx  # Verify file integrity (hash comparison)
│   │   └── styles/             # Additional CSS files
│   └── vite.config.js          # Vite configuration
│
└── contracts/
    └── SecureFileShare.sol      # Solidity smart contract
```

---

## ⚙ How Each Layer Works

### 1. Backend (FastAPI + MongoDB)

#### Authentication Flow

```
Register → Password hashed with bcrypt → Stored in MongoDB
Login    → Password verified → JWT token generated → Sent to frontend
```

- Every protected route uses `Depends(get_current_user)` which decodes the JWT token.
- Token expires in **60 minutes** (configurable in `auth.py`).

#### File Upload Flow

```
1. User selects file (max 50MB)
2. File bytes are read
3. SHA-256 hash is computed (this is the "fingerprint")
4. File is saved to /uploads/ with a unique name
5. File metadata (filename, hash, owner, size) is stored in MongoDB
6. File ID + hash are returned to the frontend
```

#### Sharing Flow

```
1. Owner provides: file_id + recipient_email + expiry_time (Unix timestamp)
2. Backend validates: file exists, owner matches, recipient exists, expiry is in future
3. A share record is created/updated in MongoDB with is_active: true
```

#### Revoke Flow

```
1. Owner sends: file_id + revoked_user_email
2. Backend sets: is_active = false, expiry_time = 0
3. User instantly loses access — even if original timer hasn't expired
```

#### Verify Flow

```
1. User sends: file_id
2. Backend reads the file from disk, recomputes SHA-256
3. Compares live hash vs. stored hash
4. Returns: match = SECURE, mismatch = TAMPERED
```

#### MongoDB Collections

| Collection | Fields | Purpose |
|---|---|---|
| `users` | `username`, `email`, `password` (hashed) | User accounts |
| `files` | `filename`, `stored_filename`, `path`, `hash`, `owner_email`, `size`, `uploaded_at` | File metadata |
| `shares` | `file_id`, `owner_email`, `shared_with_email`, `expiry_time`, `filename`, `is_active` | Share records |

---

### 2. Frontend (React + Vite)

#### Page Routes

| Route | Page | Description |
|---|---|---|
| `/login` | Login.jsx | Email + password login |
| `/register` | Register.jsx | Create new account |
| `/dashboard` | Dashboard.jsx | Overview: my files + shared files count + stats |
| `/upload` | UploadFile.jsx | Drag-and-drop upload + blockchain anchoring |
| `/shared` | SharedFiles.jsx | "Received" tab (files shared with me) + "My Files" tab (manage/revoke shares) |
| `/share/:id` | ShareFile.jsx | Share a specific file: enter email + duration |
| `/verify/:id?` | VerifyFile.jsx | Verify file integrity against stored hash |

#### Auth State

Managed by `AuthContext.jsx`:
- On login → `token` and `user` are stored in `localStorage`
- `api.js` interceptor automatically attaches `Authorization: Bearer <token>` to every request
- On logout → localStorage is cleared, state reset

#### Web3 Integration (`web3.js`)

This file connects the React app to the **Solidity smart contract** via **MetaMask**:

```javascript
// Key exports:
getProviderOrSigner()    // Gets MetaMask provider or signer
getContractInstance()    // Returns a contract object you can call functions on
```

---

### 3. Smart Contract (Solidity + Polygon)

The smart contract `SecureFileShare.sol` lives on the Polygon blockchain and provides **on-chain proof** of file integrity.

#### Contract Functions

| Function | What It Does | Who Can Call |
|---|---|---|
| `uploadFile(hash)` | Stores the file hash on-chain, returns a fileId | Anyone (becomes owner) |
| `shareFile(fileId, address, expiryTime)` | Grants time-limited on-chain access | File owner only |
| `revokeFile(fileId, address)` | Revokes on-chain access immediately | File owner only |
| `verifyFile(fileId, hash)` | Compares provided hash with stored hash | Owner or authorized user |

#### Contract Events (logged on-chain)

```solidity
event FileUploaded(uint256 indexed fileId, string fileHash, address indexed owner);
event FileShared(uint256 indexed fileId, address indexed sharedWith, uint256 expiryTime);
event FileRevoked(uint256 indexed fileId, address indexed revokedFrom);
```

#### Data Structures

```solidity
struct File {
    uint256 fileId;
    string fileHash;      // SHA-256 hash of the file
    address owner;        // Ethereum address of uploader
}

struct ShareAccess {
    bool isShared;
    uint256 expiryTime;   // Unix timestamp
}
```

---

## 🔄 Complete User Flow

Here's the **end-to-end journey** of how the app works:

### Step 1: Register & Login

```
User → Register with email + password
     → Password is bcrypt-hashed → saved to MongoDB
     → Login → receive JWT token → stored in browser localStorage
```

### Step 2: Upload a File

```
User → Picks a file (drag or browse)
     → Frontend sends file to backend POST /api/files/upload
     → Backend: saves file, computes SHA-256, stores in MongoDB
     → Backend returns: { file_id, file_hash }

     → Frontend THEN calls smart contract via MetaMask:
        contract.uploadFile(file_hash)
     → MetaMask pops up asking to confirm the transaction
     → User clicks "Confirm" → hash is permanently stored on Polygon blockchain
     → If MetaMask is not installed or user rejects → file is still saved on server,
        but blockchain anchoring is skipped (toast shows "Blockchain skipped")
```

### Step 3: Share a File

```
User → Goes to /share/:fileId
     → Enters recipient email + time duration (e.g., 24 hours)
     → Frontend sends POST /api/files/share with { file_id, email, expiry_time }
     → Backend creates share record in MongoDB with is_active: true
```

### Step 4: Revoke Access

```
Owner → Goes to /shared → "My Files" tab
      → Sees list of files with active shares displayed beneath each one
      → Clicks "Revoke" next to any recipient
      → POST /api/files/revoke → sets is_active: false, expiry_time: 0
      → Recipient IMMEDIATELY loses access
```

### Step 5: Verify Integrity

```
User → Goes to /verify/:fileId or enters file ID manually
     → Frontend calls POST /api/files/verify
     → Backend re-reads file from disk, computes fresh SHA-256
     → Compares with hash stored at upload time
     → Returns: SECURE (hashes match) or COMPROMISED (hashes differ)
```

---

## 🦊 MetaMask — What, Why, and How

### What is MetaMask?

MetaMask is a **browser extension wallet** that lets you:
- Store and manage Ethereum/Polygon accounts (addresses)
- **Sign transactions** — when your app wants to write data to the blockchain, MetaMask asks your permission
- Connect to different networks (Ethereum mainnet, Polygon, testnets, etc.)

### Why do we need MetaMask in this project?

The smart contract lives on the **Polygon blockchain**. To write data to the blockchain (e.g., "save this file hash"), someone needs to **pay a tiny gas fee** and **sign the transaction** with their private key. MetaMask handles both of these:

1. **Signing** — proves it's really you making the transaction
2. **Gas payment** — pays the small network fee (in MATIC/POL tokens)

### How to Set Up MetaMask

#### Step 1: Install MetaMask

1. Go to [https://metamask.io/download/](https://metamask.io/download/)
2. Install the browser extension (Chrome, Firefox, Brave, or Edge)
3. Create a new wallet — **save your Secret Recovery Phrase safely!**

#### Step 2: Add Polygon Amoy Testnet

For development/testing, use the **Amoy Testnet** (free test MATIC):

1. Open MetaMask → click the network dropdown (top-left, says "Ethereum Mainnet")
2. Click **"Add Network"** → **"Add a network manually"**
3. Fill in these details:

| Field | Value |
|---|---|
| **Network Name** | Polygon Amoy Testnet |
| **New RPC URL** | `https://rpc-amoy.polygon.technology/` |
| **Chain ID** | `80002` |
| **Currency Symbol** | `MATIC` |
| **Block Explorer URL** | `https://amoy.polygonscan.com/` |

4. Click **Save** → switch to this network

#### Step 3: Get Free Test MATIC

You need a small amount of MATIC to pay for transaction gas fees:

1. Go to [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
2. Or try [https://www.alchemy.com/faucets/polygon-amoy](https://www.alchemy.com/faucets/polygon-amoy)
3. Paste your MetaMask wallet address (click your address to copy it in MetaMask)
4. Request test MATIC — it should arrive in ~30 seconds

#### Step 4: How MetaMask Works in this App

When you **upload a file**, after the file is saved on the server, the app will:

1. **Automatically call MetaMask** — a popup appears
2. The popup shows the transaction details (calling `uploadFile` on the smart contract)
3. You click **"Confirm"** → the transaction is sent to the Polygon network
4. The file hash is now **permanently stored on the blockchain**! 🎉

> **If you click "Reject"** or **MetaMask is not installed**: The file is still safely uploaded to the backend server. The blockchain part is optional but recommended for maximum security.

---

## 📜 Smart Contract Deployment Guide

Your smart contract (`contracts/SecureFileShare.sol`) needs to be deployed to the Polygon network before the app can use blockchain features.

### Option A: Deploy via Remix IDE (Easiest)

1. Go to [https://remix.ethereum.org/](https://remix.ethereum.org/)
2. Create a new file → paste the contents of `SecureFileShare.sol`
3. **Compile:**
   - Go to the **Solidity Compiler** tab (left sidebar)
   - Select compiler version: `0.8.19`
   - Click **"Compile SecureFileShare.sol"**
4. **Deploy:**
   - Go to the **Deploy & Run** tab
   - **Environment**: Select `"Injected Provider - MetaMask"`
   - Make sure MetaMask is on **Polygon Amoy Testnet**
   - Click **"Deploy"**
   - MetaMask will popup → **Confirm** the transaction
   - Wait for the transaction to be confirmed
5. **Copy the Contract Address:**
   - After deployment, you'll see the contract under "Deployed Contracts"
   - Copy the address (starts with `0x...`)

### Option B: Deploy via Hardhat (Advanced)

```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npx hardhat compile
npx hardhat run scripts/deploy.js --network amoy
```

### After Deployment — Update the Frontend

Open `frontend/src/services/web3.js` and replace the placeholder:

```javascript
// BEFORE (placeholder):
export const CONTRACT_ADDRESS = "0xYourSmartContractAddress";

// AFTER (your real address):
export const CONTRACT_ADDRESS = "0xAbCdEf1234567890..."; // Your deployed contract address
```

> ⚠️ **Until you deploy the contract and update this address**, blockchain features will show "Blockchain skipped or rejected" — which is normal. The server-side features (upload, share, revoke, verify) still work perfectly without blockchain.

---

## 🚀 How to Run the Project

### Prerequisites

- **Python 3.9+** installed
- **Node.js 18+** installed
- **MongoDB Atlas** account with a cluster (free tier works)
- **MetaMask** browser extension (optional, for blockchain features)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
copy .env.example .env
# Then edit .env with your actual values:
#   SECRET_KEY=your-random-secret-key
#   MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
```

**Start the backend:**

```bash
uvicorn main:app --reload
```

> ✅ You should see: `Successfully connected to MongoDB!`
> The server runs at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

> The app runs at `http://localhost:5173`

### 3. Both Running Together

You need **two terminals** running simultaneously:

| Terminal | Directory | Command |
|---|---|---|
| Terminal 1 | `backend/` | `uvicorn main:app --reload` |
| Terminal 2 | `frontend/` | `npm run dev` |

---

## 📡 API Reference

All endpoints are prefixed with `http://localhost:8000/api`

### Auth Endpoints

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| POST | `/users/register` | `{ username, email, password }` | ❌ | Create account |
| POST | `/users/login` | `{ email, password }` | ❌ | Get JWT token |

### File Endpoints

| Method | Endpoint | Body / Params | Auth | Description |
|---|---|---|---|---|
| POST | `/files/upload` | `FormData (file)` | ✅ | Upload a file |
| GET | `/files/myfiles` | — | ✅ | List your uploaded files |
| GET | `/files/shared` | — | ✅ | List files shared with you |
| GET | `/files/myshares` | — | ✅ | List active shares you've created |
| POST | `/files/share` | `{ file_id, shared_with_email, expiry_time }` | ✅ | Share a file |
| POST | `/files/revoke` | `{ file_id, revoked_user_email }` | ✅ | Revoke shared access |
| POST | `/files/verify` | `{ file_id }` | ✅ | Verify file integrity |
| GET | `/files/download/{file_id}` | — | ✅ | Download a file |

---

## ❓ Common Errors & Fixes

### Backend Errors

| Error | Cause | Fix |
|---|---|---|
| `Error loading ASGI app. Could not import module "mian"` | Typo in command | Use `uvicorn main:app --reload` (not `mian`) |
| `❌ Failed to connect to MongoDB` | Wrong MONGO_URL in `.env` | Check your MongoDB Atlas connection string |
| `SSL: CERTIFICATE_VERIFY_FAILED` | Old OpenSSL version | Already handled in `database.py` with `tlsAllowInvalidCertificates=True` |
| `File too large. Max limit is 50MB` | File exceeds 50MB | Use a smaller file |

### Frontend Errors

| Error | Cause | Fix |
|---|---|---|
| `Network Error` / CORS error | Backend not running | Start backend: `uvicorn main:app --reload` |
| `401 Unauthorized` | Token expired or invalid | Login again to get a fresh JWT |
| `MetaMask is not installed` | MetaMask extension missing | Install MetaMask from [metamask.io](https://metamask.io) |

### MetaMask Errors

| Error | Cause | Fix |
|---|---|---|
| `Blockchain skipped or rejected` | MetaMask not installed, user rejected, or contract not deployed | Install MetaMask + deploy contract + update address in `web3.js` |
| `Insufficient funds` | No test MATIC in wallet | Get free MATIC from [Polygon Faucet](https://faucet.polygon.technology/) |
| `Transaction was rejected` | User clicked "Reject" in MetaMask popup | Click "Confirm" next time |
| `execution reverted: Not the file owner` | Trying to share/revoke a file you don't own on-chain | Only the uploader can share/revoke |

---

## 🎯 Key Concepts Summary

| Concept | Simple Explanation |
|---|---|
| **SHA-256** | A mathematical function that converts any file into a unique 64-character string. Change even 1 byte and the hash completely changes. |
| **JWT (JSON Web Token)** | A signed, encoded string that proves "I am logged in as this user" without needing to check the database every time. |
| **Smart Contract** | A program that lives on the blockchain. Once deployed, nobody can change it. It executes automatically when called. |
| **MetaMask** | Your blockchain wallet in the browser. It holds your crypto keys and signs transactions. |
| **Gas Fee** | A tiny payment (in MATIC) for using the blockchain network. On Polygon, it's usually < $0.01. |
| **Polygon** | An Ethereum-compatible blockchain that's faster and cheaper than Ethereum mainnet. |
| **Motor** | An async MongoDB driver for Python — lets FastAPI talk to MongoDB without blocking. |
| **bcrypt** | A password hashing algorithm. Even if the database leaks, passwords can't be reversed. |

---

> 💡 **Remember:** The blockchain part is a **bonus layer of security**. The app works fully (upload, share, revoke, verify, download) using just the backend + MongoDB. MetaMask + blockchain add **tamper-proof, decentralized proof** that a file hasn't been modified.
