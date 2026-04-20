require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Local Hardhat network — runs at http://127.0.0.1:8545
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
        // Hardhat in-process node (default for tests)
        hardhat: {
            chainId: 31337,
        },
    },
    paths: {
        sources: "./contracts",      // Where your .sol files live
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",    // Compiled ABI + bytecode output
    },
};
