# 🔐 Secure Share X

Blockchain-powered secure file sharing — upload, share, revoke, and verify files locally.

---

## ⚙️ Prerequisites

Install these before starting:

- [Node.js 18+](https://nodejs.org/)
- [Python 3.9+](https://python.org/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier)

---

## � First-Time Setup

### 1. Install Hardhat (Blockchain)
```bash
cd secure_share_x
npm install
```

### 2. Install Backend Dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
# Copy the example and fill in your values
copy backend\.env.example backend\.env
```

Edit `backend\.env`:
```env
SECRET_KEY=any-random-long-string
MONGO_URL=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## ▶️ Running the App

Open **4 terminals** in order:

### Terminal 1 — Blockchain Node
```bash
cd secure_share_x
npx hardhat node
```
> Keep this open. Shows test accounts with free ETH.

### Terminal 2 — Deploy Contract
```bash
cd secure_share_x
npx hardhat run scripts/deploy.js --network localhost
```
> Copy the printed contract address, then paste it in `frontend/src/services/web3.js` line 13:
> ```js
> export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
> ```

### Terminal 3 — Backend
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```
> Runs at http://localhost:8000
> You should see: `✅ Successfully connected to MongoDB!`

### Terminal 4 — Frontend
```bash
cd frontend
npm run dev
```
> Open http://localhost:5173 in your browser

---

## � Using the App

| Step | What to do |
|---|---|
| **Register** | Go to `/register` → create an account |
| **Login** | Go to `/login` → sign in |
| **Upload** | Sidebar → Upload → drag a file → click Upload & Anchor |
| **Share** | Dashboard → click Share on a file → enter email + hours |
| **Download** | Shared Files → Received tab → click Download |
| **Revoke** | Shared Files → My Files tab → click Revoke next to a user |
| **Verify** | Sidebar → Verify → enter file ID → Run Integrity Engine |

---

## ⚠️ Important Notes

- **Restarted Hardhat node?** → Redeploy contract (Terminal 2) and update `CONTRACT_ADDRESS` again
- **MongoDB error?** → Check internet connection and Atlas IP whitelist (`0.0.0.0/0`)
- **Terminals 3 & 4** can be started in any order

---

## �️ More Docs

| File | Contents |
|---|---|
| `PROJECT_GUIDE.md` | Full architecture, concepts, API reference |
| `HARDHAT_MIGRATION.md` | Blockchain setup details, error fixes |
