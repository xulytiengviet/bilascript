// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Bila (Bitlang) — fixed-supply research token for Ethereum Sepolia.
 * Solidity + OpenZeppelin reference backend ONLY.
 * The BilaScript native uint256 subset does not compile ERC-20 yet.
 * No mint(), owner-only issuance, blacklist, upgrade, tax or pause.
 * Do not treat this test asset as a financial investment.
 */
contract BilaBitlang is ERC20 {
    address public constant GENESIS_WALLET = 0x879E22703E2E432257334Db400Fbf9115aeD93Cf;
    uint256 public constant GENESIS_TOKENS = 1_000_000;

    constructor() ERC20("Bila (Bitlang)", "BILA") {
        _mint(GENESIS_WALLET, GENESIS_TOKENS * 10 ** decimals());
    }
}
