# BilaScript v7 — BilaGuard v0.1

Live entry: https://bila.js.org/v7/
Security dashboard: https://bila.js.org/v7/bilaguard/

**BilaScript = CVNSS4.0 + Security-First EVM + Non-Financial Smart Contracts**

BilaGuard v0.1 is a fail-closed pre-deployment security layer for the **existing**
experimental BilaScript v6.0.1 native EVM compiler. It creates a new v7/
directory and leaves the established v6 contract compiler, ERC-20 reference,
and Sepolia verification flows untouched.

## Modules and threat model

- bilaguard/guard.mjs: strict primary CVNSS4.0 keywords, suspicious Unicode
  and invisible text, casefold collisions, independent review of typed AST,
  state/effect rules, owner slot 0 and unique contiguous storage layout.
  Checks Keccak-256 selectors, ABI matches, EVM jump targets, owner-guard
  opcode pattern, SSTORE/SLOAD, increment overflow guard and nonpayable gate.
- bilaguard/fuzz.mjs: deterministic valid-source generation, 12 classes of
  deliberately invalid source mutations, and targeted mutations against
  the exact source in the editor. Failed or unexpectedly accepted cases
  include reproducible seed, mutation name and offending source text.
- bilaguard/app.mjs: responsive compiler/security dashboard and an explicit,
  user-initiated Sepolia deployment path gated by static and fuzz results.
- bilaguard/ci-report.mjs: deterministic reproducibility report for CI.
- test/: source/guard tests and an isolated browser EIP-1193 test.
- .github/workflows/v7-bilaguard.yml: automates checks and retains proof JSON.

## Current scope and limitations

The native v6.0.1 code generator currently handles one contract, 1–32 uint256
storage variables and 1–24 public functions: owner-only setting, checked +1
increments, and view getters. The compiler stores deployer as owner in slot 0.
The CVNSS4.0 EVM keyword profile is still **PROVISIONAL_UNDER_AUDIT**.
The strict v7 profile intentionally rejects old English legacy keyword aliases
at its deployment gate, even though the older v6 compiler accepts them.

BilaGuard **does not** claim ERC-20 parity, dynamic ABI, mapping, external calls,
full Unicode token support, events, formal verification, symbolic execution,
or an independent EVM engine equivalence check. Its fuzzing is
source/grammar/semantic compiler mutation testing, **not live EVM transaction
fuzzing**. A PASS does not prove vulnerability-free execution.

## Local reproduction

On Node 22+:

    node --test v7/test/bilaguard.test.mjs
    node v7/bilaguard/ci-report.mjs

Default deterministic CI generator: 12 source programs and 12 mutations per
program = 156 cases total, plus source-specific negative mutations.
The dashboard also supports 6, 12, 24 or 48 generated source programs.

## Locked testnet deployment

Deployment cannot be initiated through this v7 UI unless the exact editor
source passes all strict lexical/semantic, AST/ABI/storage/EVM opcode checks
and both seeded grammar and source-targeted mutation suites.

A changed source, random seed or fuzz count immediately revokes preflight.
MetaMask must present Ethereum Sepolia chain 11155111 and grant access to the
specific root account 0x879E22703E2E432257334Db400Fbf9115aeD93Cf.
The browser reads real RPC balance, gas price and estimate before enabling the
send button. The user must affirm a browser dialog and approve the transaction
separately within the MetaMask extension.

The application never requests a seed phrase/private key, never includes a
server signer, and never creates an automatic real-world transaction on its own.
After a user-signed testnet deployment, it re-reads the public transaction,
receipt, runtime code and owner storage slot, reporting mismatches.

## Roadmap (NOT implemented in v0.1)

- GeoProof: versioned boundary evidence and CRS-aware canonicalized GeoJSON hashes.
- ResearchProof: scientific dataset provenance and batch evidence commitments.
- SensorProof: IoT measurement records and calibration histories.
- BilaIR, symbolic/static analysis improvements and independent stateful
  execution fuzzing against Anvil/revm/evmone.
- Open/public versioned verifier with reproducible compiler binary builds.

Never interpret a committed hash as proof that the underlying off-chain data
is accurate, legal or authentic. Never use this experimental compiler for
value-bearing/mainnet contracts without independent testing and security review.
