# BilaScript v6.0.1 — Native EVM Language Lab (experimental)

## Public website
[https://bila.js.org/v6/](https://bila.js.org/v6/) — when GitHub Pages deploys the default branch root. v5 remains unchanged.

## What actually exists

- \`compiler.mjs\`: independent **native EVM code generator**. It does not invoke Solidity, Solc, Solang or Yul. It tokenizes a tightly restricted subset of BilaScript, constructs an AST, creates ABI selectors with Keccak-256, assembles EVM runtime + deployment initcode, and disassembles runtime opcodes.
- \`app.mjs\`: uses an **injected EIP-1193 wallet** on **Ethereum Sepolia, chain ID 11155111**. It calls live \`eth_chainId\`, \`eth_estimateGas\`, \`eth_sendTransaction\`, \`eth_getTransactionReceipt\`, \`eth_getCode\`, \`eth_getStorageAt\`, \`eth_call\` and \`eth_blockNumber\`.
- \`index.html\`: fully static responsive UI, works on GitHub Pages. No backend, no private-key upload, no invented transaction, gas, block or storage values.
- \`test/compiler.test.mjs\`: deterministic unit tests for compiler and opcode layout.
- \`test/anvil.sh\`: **real execution in a local Anvil EVM**. The well-known public Anvil key is only used on chain ID 31337. Anvil is not a public testnet and its results must never be presented as Sepolia evidence.

## Supported subset — do not confuse with Solidity language parity

\`\`\`text
hop_dong BoDem {
  uint256 dem;
  haml_sob gan(uint256 giaTri) public { dem = giaTri; }
  haml_sob tang() public { dem = dem + 1; }
  haml_sob doc() public view returns (uint256) { trov_ved dem; }
}
\`\`\`

CVNSS4.0 aliases \`haml_sob\` and \`trov_ved\` are from the v5 vocabulary lock; \`hop_dong\` is a **new v6 proposal** and not an officially frozen CVNSS4.0 keyword. The supplied v5.0.0-audit-safe CVNSS converter warns about many-to-one mappings; therefore v6 **does not** transform arbitrary source, variable identifiers or ABI names via character-level conversion. Unknown syntax raises an error rather than silently generating bytecode.

Only uint256 state slots (one word per variable), public function set/get/increment(1), and standard 4-byte ABI selectors are implemented. Increment explicitly reverts on uint256 overflow. No arbitrary expressions, mappings, events, external calls, inheritance, ERC tokens, dynamic types, modifiers, constructors, payable, mainnet or security guarantees. This is not ready for funds or production contracts.

## Evidence levels and honest labels

1. **Static compiler**: EVM hex, ABI, disassembly. This does not show successful execution or absence of bugs.
2. **Local devnet**: \`anvil\` + \`cast\` deployment, receipt, get/set/increment and actual storage. CI can run these tests using a local EVM node; this is not a fake data simulation.
3. **Public Sepolia testnet**: Browser wallet sends a user-approved transaction, receives actual receipt, verifies \`eth_getCode\` equals *runtime* bytecode, and reads actual storage slots. Requires user to install a wallet, switch to Sepolia and possess faucet Sepolia ETH. No Sepolia deployment is claimed until a verifiable tx hash exists.
4. **Systematic conformance**: regression tests across compiler upgrades; fuzzing/formal verification are future work. One successful contract is not proof of whole-language correctness.

\`receipt.status == 1\` means a transaction succeeded, NOT that the program is secure. Disassembly is static and is not the same as a VM execution trace.

## Tests

\`\`\`bash
node --test v6/test/compiler.test.mjs
# after installing Foundry on Linux/macOS:
bash v6/test/anvil.sh
\`\`\`

CI workflow: \`.github/workflows/v6-evm.yml\`. CI job must be green before claiming Anvil execution success. The site itself never populates fabricated results.

## Roadmap: learn from Argot, not claim existing integration

- **Fe**: typed, effects-aware syntax design;
- **Act**: specification-language integration;
- **Hevm**: symbolic execution and counterexamples;
- **Ethdebug**: source map / debug information;
- **Sourcify**: verified compiler input, reproducible builds and source verification;
- **Ethereum Yellow Paper / evm.codes**: formal EVM semantics and opcode reference;
- **Solidity (Argot)**: differential testing oracle, not BilaScript v6's code generator.

Fe, Act, Hevm, Ethdebug, Sourcify are currently research references **only**, not implemented v6 modules.

## Site hosting

Project is rooted at \`/\` and has a \`CNAME\` set to \`bila.js.org\`. Keep Pages source pointing to \`Babylscript1_7R2_BRANCH\` at \`/(root)\`. No build step is required for \`/v6/\`. Root index links to v6; v4/v5 paths and tests remain intact.

## v6.0.1 security hardening (2026-10-24)

- All nonpayable runtime methods reject nonzero `CALLVALUE` in EVM bytecode; deploy initcode also rejects value.
- Constructor records deployment `CALLER` as immutable-by-language owner at reserved storage **slot 0**. State `uint256` slots start at **slot 1**. No upgrade or ownership-transfer methods exist in this experimental subset.
- Every state-writing function **must** include proposed CVNSS token `chi_chu` (`owner_only` semantic ID). Codegen inserts an EVM `CALLER` versus slot-0 `SLOAD` check and `REVERT` before any write. Unguarded writes fail at compilation. Unauthorized accounts cannot write.
- Typed semantic boundary validates `uint256` variables, parameter bindings, `view` versus write effects, return context and supported expression forms. Unsupported expressions fail closed. This is a checked subset, **not** a full Solidity-like type system.
- Legacy source using `hop_dong`, `uint256`, `public`, `view`, `returns` remains accepted **only if all writes include `chi_chu`**, to avoid silently granting new write permissions. Fresh example uses mostly CVNSS4.0 spellings; new aliases remain provisional until vocabulary-lock audit.
- **Breaking change:** new runtime storage layout and new bytecode. Existing v6.0 contract instances are not automatically migrated. Frontend `eth_getStorageAt` now reserves owner slot 0.
- Argot `solidity`, `solc-js` and `solc-bin` are upstream references for ABI and differential conformance; production v6 compiler still does not use Solidity/solc for code generation. Solc oracle checks are separate CI tests.

## Sepolia wallet and first public proof (2026-10-24)

Requested test signer: `0xF4EeD1f0589E2Cd7cF29CCE5f6f45e1ed65594aB`. This is a **selected address, not proof that the browser controls it**. The browser must connect that exact EIP-1193 account. An earlier public BIP-39 test-vector address remains blocked by `assertSafeSepoliaWallet`.

In [the v6 testnet lab](https://bila.js.org/v6/):

1. Select **Ethereum Sepolia**, chain ID `11155111`, in a wallet; connect the exact selected account. Do not disclose a seed phrase or private key. Read the real account balance, nonce and block through the **Đọc số dư và nonce Sepolia từ RPC** button; testnet ETH is needed for gas.
2. Build the canonical v6.0.1 CVNSS source. Press **Ước tính gas từ RPC**, then **Triển khai** and confirm the exact creation bytecode using the wallet. The page never signs without explicit wallet permission.
3. After an actual receipt, verify `transaction.from`, chain ID, `transaction.input` (creation bytecode), receipt `status=1`, `eth_getCode` (runtime bytecode), and owner storage slot 0. Export the source-linked JSON proof. **No public Sepolia deploy is currently claimed in this repository without an independent transaction hash and receipt**.
4. You can paste the deployment transaction hash into the new independent verifier even after reopening the page. It will only unlock proof export if every RPC check matches the selected wallet and the compiler's current build.

Local differential fuzzing is **separate** from Sepolia deployment: `bash v6/test/differential-anvil.sh` compiles and executes both BilaScript and independent pinned Solc contracts on a real local Anvil EVM, and `v6/test-results/differential-fuzz.json` stores seeds, state after each operation, revert results, receipt statuses and gas as comparative measurements. Differences in gas **are expected**; exact gas equality is not an assertion of semantic correctness.

**No private keys are checked into the repository and CI does not publish wallet-funded Sepolia transactions.** 
