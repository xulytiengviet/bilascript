# BilaScript 6.0.1 — EVM compatibility and Argot reference baseline

Status: **Experimental language subset — not for production or custody of assets.**

## Upstream references

- [Argot Solidity](https://github.com/argotorg/solidity): EVM language and compiler semantics reference.
- [Argot solc-js](https://github.com/argotorg/solc-js): Standard JSON reference compiler binding, used as an independent test oracle, not by the BilaScript EVM code generator.
- [Argot solc-bin](https://github.com/argotorg/solc-bin): binary release provenance. Pin an exact compiler version and verify checksums for independently reproduced builds.
- [Solidity ABI specification](https://docs.soliditylang.org/en/latest/abi-spec.html): canonical ABI type, signature and selector.
- [EVM opcode specification](https://ethereum.org/en/developers/docs/evm/opcodes/): CALLER, CALLVALUE, SLOAD, SSTORE, REVERT, JUMPI.

CI uses solc-js npm package 0.8.30 as a pinned **reference version**, not as the latest compiler release and not as BilaScript's code generator.

## Three security/semantic fixes

| Finding | Fix in v6.0.1 | Verification |
|---|---|---|
| Unprotected public state write | State-mutating functions require chi_chu; check CALLER against deployment owner in storage slot 0, or revert | Unit tests and real Anvil unauthorized call |
| ABI nonpayable not enforced in bytecode | Deploy-time and runtime guards check CALLVALUE == 0 | Bytecode assertions and Anvil nonzero-value call |
| Untyped parser-to-bytecode lowering | Validate uint256 variable and parameter types, return types, effects, storage writes, selector uniqueness | Node tests and independent solc-js ABI/storage-layout oracle |

**Breaking change:** slot 0 now stores the deployer (owner), while declared uint256 variables start at slot 1. v6.0 contracts must not be treated as storage-compatible with v6.0.1.

## Reproduction

    node --test v6/test/compiler.test.mjs
    npm install --no-save --no-package-lock --ignore-scripts solc@0.8.30
    node --test v6/test/solc-oracle.test.mjs
    bash v6/test/anvil.sh

The Anvil suite exercises actual EVM execution and storage updates (42 to 43), revert on overflow, nonpayable rejection, an unauthorized caller, deployment owner and emitted/deployed runtime bytecode equality. Local Anvil is a **devnet**, not public Sepolia.

## CVNSS4.0 vocabulary policy

See [vocabulary-evm.mjs](./vocabulary-evm.mjs) for versioned semantic IDs. New primary CVNSS aliases are provisional until a separate ambiguity/collision audit; legacy spelling is accepted only if semantic checks pass. Never run a character-level transliterator on arbitrary source identifiers or ABI names.

## Limits

Only a small uint256 contract subset is supported: get, set with owner permission, checked increment-by-one. No ABI strings, mapping, event, inheritance, payable, external contract calls, ERC-20, dynamic arrays, generalized expression evaluator, mainnet support, formal verification or audit are claimed. The solc-js oracle compares ABI/selector/layout for one reference program; passing CI is not proof of whole-language semantics.
