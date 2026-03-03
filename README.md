# SecureShare X 🔐

A **decentralized, blockchain-backed secure file sharing platform** built with FastAPI, React, and MongoDB Atlas. Files are hashed with SHA-256 and can optionally be anchored to the Polygon blockchain for immutable integrity verification.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Framer Motion |
| Backend | FastAPI + Uvicorn |
| Database | MongoDB Atlas (via Motor async driver) |
| Auth | JWT (python-jose + passlib) |
| Blockchain | Solidity Smart Contract + Ethers.js + MetaMask |
| Hashing | SHA-256 (Python hashlib) |

---

## 📁 Project Structure

```
sceure_share_x/
├── backend/
│   ├── main.py           # FastAPI app entry point
│   ├── database.py       # MongoDB connection
│   ├── models.py         # Pydantic schemas
│   ├── requirements.txt
│   ├── routes/
│   │   ├── user.py       # Register / Login
│   │   └── files.py      # Upload / Share / Verify / Download / Revoke
│   └── utils/
│       ├── auth.py       # JWT + password hashing
│       └── hashing.py    # SHA-256 helpers
├── frontend/
│   ├── src/
│   │   ├── pages/        # Login, Register, Dashboard, Upload, Share, Verify, SharedFiles
│   │   ├── components/   # Layout, Navbar, Sidebar, FileCard
│   │   ├── services/     # api.js (Axios) + web3.js (Ethers)
│   │   └── context/      # AuthContext (JWT + user state)
│   └── vite.config.js
└── contracts/
    └── SecureFileShare.sol   # Solidity smart contract
```

---

## ⚙️ Setup & Run

### 1. Clone the repository
```bash
git clone https://github.com/Barathvs18/share_x.git
cd share_x
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Create backend/.env with your credentials:
# SECRET_KEY=your-secret-key
# MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0

uvicorn main:app --reload
```
Backend runs at: **http://localhost:8000**  
Swagger Docs: **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

## 🔑 Environment Variables

Create `backend/.env` (not committed — keep it secret):
```env
SECRET_KEY=your-very-long-random-secret-key
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
```

---

## 🚀 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users/register` | Register new user | ❌ |
| POST | `/api/users/login` | Login + get JWT | ❌ |
| POST | `/api/files/upload` | Upload & hash file | ✅ |
| GET | `/api/files/myfiles` | List your uploads | ✅ |
| GET | `/api/files/shared` | Files shared with you | ✅ |
| POST | `/api/files/share` | Share file by email + expiry | ✅ |
| POST | `/api/files/revoke` | Revoke file access | ✅ |
| POST | `/api/files/verify` | Verify file integrity | ✅ |
| GET | `/api/files/download/{id}` | Download file securely | ✅ |

---

## ⛓️ Blockchain (Optional)

Deploy `contracts/SecureFileShare.sol` to Polygon/Mumbai testnet, then set `CONTRACT_ADDRESS` in `frontend/src/services/web3.js`. MetaMask required in browser.

---

## 📄 License

MIT
