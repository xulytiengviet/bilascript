# HỢP ĐỒNG · BilaScript/CVNSS4.0 Native EVM

**Live UI:** https://bila.js.org/v6/hop-dong/

This is an independently generated **native BilaScript EVM contract** — not a Solidity contract rebranded as BilaScript, and not the reference BILA ERC-20 token.

## What the source really compiles

- **Source:** [Bila_CVNSS40_Native.bila](./Bila_CVNSS40_Native.bila)
- **Code generator:** [../compiler.mjs](../compiler.mjs), which directly produces EVM initcode/runtime, ABI selectors, storage layout, and disassembly. **Solc, Yul and Solidity are not in the production compile path**.
- **CVNSS4.0 EVM profile:** [../vocabulary-evm.mjs](../vocabulary-evm.mjs); provisional under audit. Public user-defined function/variable identifiers are Romanized ABI names; primary CVNSS4.0 aliases cover every executable declaration/effect/return/type keyword.
- **Semantics implemented:** eight uint256 persistent state variables, 8 guarded setters, 8 view getters, 6 guarded incrementers, checked uint256 overflow, owner authorization using EVM CALLER vs storage slot 0, CALLVALUE=0 enforcement.
- **Outputs:** 22 ABI functions; 9 storage slots (slot 0 is constructor deployer address and slots 1–8 are uint256).
- **NOT implemented:** ERC-20, mapping, event logs, signature/hash verification, real-world evidence truthfulness, custom constructors, proxies, delegation, arbitrary expressions, arrays, structs, payable.
- **Risk:** experimental testnet-only language/compiler; not audited for mainnet or value custody. Numeric declarations and metadata are claims made by the data submitter.

## Deployment from the selected wallet

Expected Sepolia account: **0x879E22703E2E432257334Db400Fbf9115aeD93Cf**.
A GitHub Pages website **cannot sign from this address without the user's MetaMask approval**. The assistant/repository does not have and must never request the user's private key.

1. Open the above UI; click **Biên dịch CVNSS4.0 → EVM** if necessary.
2. Select MetaMask, click **Kết nối ví Sepolia** and grant access to exactly the above account.
3. Click **Kiểm tra ETH và gas**. The site requests real RPC values (balance, gas price, estimate) from Ethereum Sepolia chain ID 11155111. A zero/insufficient balance leaves deploy disabled.
4. Click **TRIỂN KHAI HỢP ĐỒNG NATIVE TRÊN SEPOLIA** and confirm the transaction with MetaMask. The browser sends the **BilaScript-generated creation bytecode** directly, not Solc output.
5. After mining, the site validates transaction sender, full creation input, successful receipt, exact runtime bytecode and owner slot 0; the newly generated contract address is shown from the actual receipt.
6. Download an independently reproducible JSON proof containing the exact source text, Keccak-256 text fingerprint, compiler name, ABI, creation/runtime bytecode and verified chain evidence. Alternatively, paste the tx hash later and revalidate against **the exact original source**.

**Current deployment status:** do not claim the new contract is live on Sepolia until an actual, independently validated transaction hash and contract address are available. Anvil tests do not count as Sepolia deployment.

## Verification

On an available Node 22+ install:

    node --test v6/test/native-contracts.test.mjs

On GitHub Actions, CI also runs:

    node --test v6/test/native-contracts-browser.test.mjs
    bash v6/test/native-contracts-anvil.sh

The latter executes **actual EVM state transitions on a disposable Anvil chain ID 31337**, including eight setters, eight getters, six increments, unauthorized writes rejected (eth_call and actual reverted receipt), nonpayable calls rejected, unknown selectors, short calldata and uint256 overflow. It does not require a private key from the user's real wallet.

## Etherscan source verification

Etherscan's familiar "Solidity (Standard JSON)" code tab is **not currently a BilaScript native source verifier**. A new deployment will show EVM bytecode in Etherscan, not a Solidity Exact Match source badge. Do not upload a fabricated Solidity reconstruction. The repo and exported proof provide exact-bytecode provenance, which can later support a dedicated independently hosted BilaScript verification service/Sourcify integration once the language is supported by the verification ecosystem.

## Distinction from reference BILA ERC-20

Reference BILA token at https://sepolia.etherscan.io/address/0x2e12b7e0c0c0d937065679c033cbfdc3b0fd9758 is **Solidity 0.8.30 / OpenZeppelin**. The new research registry is **native BilaScript/CVNSS4.0**, but **not ERC-20**. A separate native token requires mapping, address, events and allowances plus robust audit, not a UI label change.
