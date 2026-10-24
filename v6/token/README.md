# Bila (Bitlang) — Ethereum Sepolia ERC-20 reference token

**Status: experimental / testnet only. Not a mainnet asset, investment instrument or a token compiled by native BilaScript.**

## Token parameters

| Property | Value |
|---|---|
| Name | Bila (Bitlang) |
| Ticker | BILA |
| Standard | ERC-20 |
| Network | Ethereum Sepolia (`chainId=11155111`) |
| Decimals | 18 |
| Fixed initial supply | 1,000,000 BILA (1e24 base units) |
| Genesis allocation | Entire initial supply to `0x879E22703E2E432257334Db400Fbf9115aeD93Cf` |
| Additional mint | None |
| Taxes, pauses, upgrades | None |
| Token generation | Pinned Solidity 0.8.30 and OpenZeppelin Contracts 5.6.1 **reference backend** |

The genesis address is **a wallet (EOA), not the token contract address**. Deploying this artifact produces a new, distinct contract address. The web app requires this same account to be the deployment signer. Merely viewing its Etherscan address or receiving faucet ETH does not create a token or prove deployment.

## Why the reference backend exists

BilaScript v6.0.1 native EVM code generation currently supports only a strict checked-`uint256` counter/get/set/increment subset. A compliant ERC-20 implementation additionally needs `mapping(address => uint256)`, nested allowances, ABI dynamic strings, events, balances and standard selectors. Claiming this contract is natively compiled from CVNSS4.0 would be misleading.

This token is an interoperability baseline: native BilaScript can later implement each of those features, and must pass differential tests against this independent reference implementation. See [BilaBitlang.sol](./BilaBitlang.sol), [build-token.mjs](./build-token.mjs) and [the pinned reference artifact](./BilaBitlang.build.json).

## Deployment procedure

1. Visit the [BilaScript v6 lab](https://bila.js.org/v6/#token-bila). Connect MetaMask using Ethereum Sepolia (chain ID 11155111) and the **genesis wallet** above. Never enter a seed phrase/private key in the website.
2. Use the Sepolia Faucet section if the wallet has no testnet ETH. The user must authorize the wallet connection; receiving ETH alone does not imply any contract creation.
3. Under **Token BILA**, click **Nạp creation bytecode ERC-20 đã biên dịch**. The web app loads the exact committed, reproducibly built JSON artifact. Only the reference ERC-20 backend is supported by this button.
4. Click **Kiểm tra ETH và gas token** to read real account balance, gas price and `eth_estimateGas`; if funds are insufficient the deployment button stays disabled.
5. Click **Triển khai BILA ERC-20 trên Sepolia**, review and authorize the transaction **inside MetaMask**. No server signs or publishes a transaction automatically.
6. The tx hash, actual token contract address, `eth_getCode`, `totalSupply`, `name`, `symbol`, `GENESIS_WALLET`, recipient allocation and initial ERC-20 `Transfer` event are verified against Sepolia JSON-RPC before the page unlocks a proof export. It also accepts a previously confirmed tx hash for independent re-verification.

Anvil local tests may impersonate the genesis account ONLY on a disposable local chain to exercise ERC-20 transitions; this cannot be used as proof of a Sepolia signature. A green workflow does **not** prove the token has been deployed publicly.

## Deterministic build and Anvil

    npm install --no-save --no-package-lock --ignore-scripts solc@0.8.30 @openzeppelin/contracts@5.6.1
    VERIFY_COMMITTED_TOKEN_BUILD=1 node v6/token/build-token.mjs
    node --test v6/token/token-lab.test.mjs
    bash v6/token/test-token-anvil.sh

The exact reference build is checked in CI. Do not substitute CDN solc builds, change compiler optimizer or use an unpinned dependency when comparing bytecode. If source/compiler settings change, regenerate the reviewed artifact and compare it using the real Anvil tests before deploying.

## Security boundaries

- No private keys or mnemonics in GitHub, browser source or Cloudflare.
- No hidden mint / supply inflation or backdoor: reference source calls `_mint` once in the constructor.
- The wallet can transfer BILA using standard ERC-20 methods, so its balance can change after genesis; on-chain mint event and totalSupply must be inspected for issuance proof.
- Sepolia ETH has no mainnet monetary value; BILA on Sepolia is experimental and carries no market listing or guarantee.
- For the goal of replacing Solidity, this is a **compatibility reference** and test vector, NOT evidence of native CVNSS4.0 compiler parity.


## Runtime bytecode identity verified on Sepolia — October 24, 2026

Contract: https://sepolia.etherscan.io/address/0x2e12b7e0c0c0d937065679c033cbfdc3b0fd9758

An independent GitHub Actions runner queried Ethereum Sepolia at block 11981260.
On-chain runtime is 1806 bytes and matches the committed BILA build byte-for-byte.

- Public RPC attestation: [BilaBitlang.sepolia-attestation.json](./BilaBitlang.sepolia-attestation.json)
- Independently reproducible proof: https://github.com/xulytiengviet/bilascript/actions/runs/40060058453
- Classification: Solidity / solc-js 0.8.30 + OpenZeppelin Contracts 5.6.1, NOT BilaScript native.
- Limitation: a runtime match is not proof of Etherscan's public source-verified badge, creator identity or transaction origin.

### Etherscan Verify & Publish

Use https://sepolia.etherscan.io/verifyContract?a=0x2e12b7e0c0c0d937065679c033cbfdc3b0fd9758

Compiler type: Solidity (Standard-Json-Input).
Compiler version: v0.8.30+commit.73712a01.
Open-source license: MIT.
Upload: [BilaBitlang.standard-json.json](./BilaBitlang.standard-json.json).
Qualified contract: v6/token/BilaBitlang.sol:BilaBitlang.
Optimizer: enabled, 200 runs. EVM version: Cancun.
Metadata bytecode hash: none. Constructor arguments: empty.

The Standard JSON file embeds six sources, including every OpenZeppelin import,
and is recompiled byte-for-byte in CI against the deployed reference build.
A single flattened source or a different build setting is insufficient for
reproducible verification. Only Etherscan can mark the Contract -> Code section
source-verified after a successful source submission.

### BilaScript Compiler Identity Lab

https://bila.js.org/v6/#provenance

Paste bytecode or enter the Sepolia address to compare exact runtime or creation
bytecode, and generate a provenance report. Separately, recompile CVNSS4.0
source from the live BilaScript compiler and label as native ONLY on an exact
match. This is deliberately different from asserting that ERC-20 selectors
prove a native language compiler emitted the token.
