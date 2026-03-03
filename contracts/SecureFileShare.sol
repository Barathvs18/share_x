// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureFileShare {
    struct File {
        uint256 fileId;
        string fileHash;
        address owner;
    }

    struct ShareAccess {
        bool isShared;
        uint256 expiryTime;
    }

    uint256 public fileCount = 0;
    mapping(uint256 => File) public files;
    // fileId => (userAddress => ShareAccess)
    mapping(uint256 => mapping(address => ShareAccess)) public fileAccess;

    event FileUploaded(uint256 indexed fileId, string fileHash, address indexed owner);
    event FileShared(uint256 indexed fileId, address indexed sharedWith, uint256 expiryTime);
    event FileRevoked(uint256 indexed fileId, address indexed revokedFrom);

    modifier onlyOwner(uint256 _fileId) {
        require(files[_fileId].owner == msg.sender, "Not the file owner");
        _;
    }

    function uploadFile(string memory _fileHash) public returns (uint256) {
        fileCount++;
        files[fileCount] = File(fileCount, _fileHash, msg.sender);
        
        emit FileUploaded(fileCount, _fileHash, msg.sender);
        return fileCount;
    }

    function shareFile(uint256 _fileId, address _userAddress, uint256 _expiryTime) public onlyOwner(_fileId) {
        require(_expiryTime > block.timestamp, "Expiry time must be in the future");
        require(_userAddress != msg.sender, "Cannot share with yourself");

        fileAccess[_fileId][_userAddress] = ShareAccess(true, _expiryTime);
        emit FileShared(_fileId, _userAddress, _expiryTime);
    }

    function revokeFile(uint256 _fileId, address _userAddress) public onlyOwner(_fileId) {
        fileAccess[_fileId][_userAddress].isShared = false;
        fileAccess[_fileId][_userAddress].expiryTime = 0;
        emit FileRevoked(_fileId, _userAddress);
    }

    function verifyFile(uint256 _fileId, string memory _fileHash) public view returns (bool) {
        require(files[_fileId].fileId != 0, "File does not exist");
        bool isOwner = (files[_fileId].owner == msg.sender);
        bool hasAccess = (fileAccess[_fileId][msg.sender].isShared && fileAccess[_fileId][msg.sender].expiryTime > block.timestamp);
        
        require(isOwner || hasAccess, "No access to verify this file");
        
        // Compare hashes
        return (keccak256(abi.encodePacked(files[_fileId].fileHash)) == keccak256(abi.encodePacked(_fileHash)));
    }
}
