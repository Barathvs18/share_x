import { ethers } from 'ethers';

// ─────────────────────────────────────────────────────────────
//  LOCAL HARDHAT CONFIGURATION
//  After deploying the contract, paste the address below.
//  Run: npx hardhat run scripts/deploy.js --network localhost
// ─────────────────────────────────────────────────────────────

// ✏️  Paste your deployed contract address here after deployment
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ─── Hardhat Local Node RPC ───────────────────────────────────
const LOCAL_RPC_URL = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

// ─── Hardhat Account #0 Private Key ──────────────────────────
// This is the FIRST account printed when you run: npx hardhat node
// It is a well-known dev key — safe to use locally, NEVER use on mainnet
const HARDHAT_PRIVATE_KEY =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// ─── Contract ABI (unchanged from original) ──────────────────
export const CONTRACT_ABI = [
    "event FileShared(uint256 indexed fileId, address indexed sharedWith, uint256 expiryTime)",
    "event FileUploaded(uint256 indexed fileId, string fileHash, address indexed owner)",
    "event FileRevoked(uint256 indexed fileId, address indexed revokedFrom)",
    "function fileCount() view returns (uint256)",
    "function revokeFile(uint256 _fileId, address _userAddress)",
    "function shareFile(uint256 _fileId, address _userAddress, uint256 _expiryTime)",
    "function uploadFile(string _fileHash) returns (uint256)",
    "function verifyFile(uint256 _fileId, string _fileHash) view returns (bool)",
];

// ─────────────────────────────────────────────────────────────
//  getProviderOrSigner
//
//  BEFORE (MetaMask):  new ethers.BrowserProvider(window.ethereum)
//  AFTER  (Hardhat):   new ethers.JsonRpcProvider("http://127.0.0.1:8545")
//
//  When needSigner=true, a Wallet is created with the Hardhat
//  dev private key — no popup, no MetaMask, no browser wallet.
// ─────────────────────────────────────────────────────────────
export const getProviderOrSigner = async (needSigner = false) => {
    // Connect directly to local Hardhat node — no MetaMask needed
    const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);

    if (needSigner) {
        // Create a Wallet (signer) using Hardhat account #0
        const wallet = new ethers.Wallet(HARDHAT_PRIVATE_KEY, provider);
        return wallet;
    }

    return provider;
};

// ─── getContractInstance (unchanged call signature) ──────────
export const getContractInstance = async (needSigner = false) => {
    const providerOrSigner = await getProviderOrSigner(needSigner);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner);
};
