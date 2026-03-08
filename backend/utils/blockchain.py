"""
backend/utils/blockchain.py

PHASE 3 ALTERNATIVE — Backend-Managed Blockchain Signing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Instead of the frontend signing transactions, the backend
uses Web3.py to talk directly to the local Hardhat node.

SETUP:
  pip install web3

USAGE in a route:
  from utils.blockchain import anchor_file_hash
  tx_hash = await anchor_file_hash(file_hash)
"""

import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# ─── Local Hardhat node ───────────────────────────────────────
HARDHAT_RPC_URL = os.getenv("HARDHAT_RPC_URL", "http://127.0.0.1:8545")

# ─── Hardhat Account #0 private key (dev only) ───────────────
# Copy from the output of `npx hardhat node` (first account listed)
HARDHAT_PRIVATE_KEY = os.getenv(
    "BLOCKCHAIN_PRIVATE_KEY",
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
)

# ─── Deployed contract address ───────────────────────────────
# Update this after running: npx hardhat run scripts/deploy.js --network localhost
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0xYourDeployedContractAddress")

# ─── ABI (must match SecureFileShare.sol) ────────────────────
CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "string", "name": "_fileHash", "type": "string"}],
        "name": "uploadFile",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_fileId",      "type": "uint256"},
            {"internalType": "address", "name": "_userAddress", "type": "address"},
            {"internalType": "uint256", "name": "_expiryTime",  "type": "uint256"}
        ],
        "name": "shareFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_fileId",      "type": "uint256"},
            {"internalType": "address", "name": "_userAddress", "type": "address"}
        ],
        "name": "revokeFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_fileId",   "type": "uint256"},
            {"internalType": "string",  "name": "_fileHash", "type": "string"}
        ],
        "name": "verifyFile",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
]


def _get_web3_and_contract():
    """Create and return a Web3 connection + contract instance."""
    w3 = Web3(Web3.HTTPProvider(HARDHAT_RPC_URL))
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to Hardhat node at {HARDHAT_RPC_URL}")

    account = w3.eth.account.from_key(HARDHAT_PRIVATE_KEY)
    checksum_address = Web3.to_checksum_address(CONTRACT_ADDRESS)
    contract = w3.eth.contract(address=checksum_address, abi=CONTRACT_ABI)
    return w3, contract, account


async def anchor_file_hash(file_hash: str) -> dict:
    """
    Anchor a file hash on-chain by calling uploadFile().
    Returns the transaction hash and on-chain fileId.
    """
    try:
        w3, contract, account = _get_web3_and_contract()

        # Build the transaction
        nonce = w3.eth.get_transaction_count(account.address)
        txn = contract.functions.uploadFile(file_hash).build_transaction({
            "from":     account.address,
            "nonce":    nonce,
            "gas":      300_000,
            "gasPrice": w3.eth.gas_price,
        })

        # Sign and send
        signed = w3.eth.account.sign_transaction(txn, private_key=HARDHAT_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # Decode the FileUploaded event to get the on-chain fileId
        logs = contract.events.FileUploaded().process_receipt(receipt)
        on_chain_file_id = logs[0]["args"]["fileId"] if logs else None

        return {
            "tx_hash":          tx_hash.hex(),
            "on_chain_file_id": on_chain_file_id,
            "status":           "success"
        }
    except Exception as e:
        # Non-blocking: log and return error so upload still succeeds
        print(f"⚠️  Blockchain anchoring failed (non-critical): {e}")
        return {"status": "skipped", "error": str(e)}


async def revoke_on_chain(file_id: int, user_address: str) -> dict:
    """Revoke on-chain access for a given fileId and Ethereum address."""
    try:
        w3, contract, account = _get_web3_and_contract()
        checksum_user = Web3.to_checksum_address(user_address)
        nonce = w3.eth.get_transaction_count(account.address)
        txn = contract.functions.revokeFile(file_id, checksum_user).build_transaction({
            "from":     account.address,
            "nonce":    nonce,
            "gas":      200_000,
            "gasPrice": w3.eth.gas_price,
        })
        signed = w3.eth.account.sign_transaction(txn, private_key=HARDHAT_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        w3.eth.wait_for_transaction_receipt(tx_hash)
        return {"tx_hash": tx_hash.hex(), "status": "success"}
    except Exception as e:
        print(f"⚠️  Blockchain revoke failed (non-critical): {e}")
        return {"status": "skipped", "error": str(e)}
