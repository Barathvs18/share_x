import { ethers } from 'ethers';

// Replace with your compiled contract address and ABI
export const CONTRACT_ADDRESS = "0xYourSmartContractAddress";
export const CONTRACT_ABI = [
    "event FileShared(uint256 indexed fileId, address indexed sharedWith, uint256 expiryTime)",
    "event FileUploaded(uint256 indexed fileId, string fileHash, address indexed owner)",
    "function fileCount() view returns (uint256)",
    "function revokeFile(uint256 _fileId, address _userAddress)",
    "function shareFile(uint256 _fileId, address _userAddress, uint256 _expiryTime)",
    "function uploadFile(string _fileHash) returns (uint256)",
    "function verifyFile(uint256 _fileId, string _fileHash) view returns (bool)"
];

export const getProviderOrSigner = async (needSigner = false) => {
    if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install it to use this app.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (needSigner) {
        const signer = await provider.getSigner();
        return signer;
    }
    return provider;
};

export const getContractInstance = async (needSigner = false) => {
    const providerOrSigner = await getProviderOrSigner(needSigner);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerOrSigner);
};
