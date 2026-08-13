# BilaScript v4.0.0 — Evidence-driven Zero-cost Frontend

BilaScript v4.0.0 hardens the CVNSS4.0 frontend while deliberately keeping JavaScript as the execution backend. The compiler owns lexical identity, parsing, AST, symbols, static evidence, diagnostics, alias lowering policy, source mapping and language-service behavior.

## Pipeline
`*.bila → Lexer(KW_*) → Parser → Bila AST → Symbol/Type Evidence → Strict Normalizer → JS Codegen + Source Map → JavaScript runtime`

## Safety contract
In `---bila:strict---`, a canonical Bila built-in alias is lowered only when its receiver is proven. Unknown receiver evidence is a compile-time error. In default `---bila---`, it is preserved with a warning for migration/prototyping. Third-party/user APIs are never localized implicitly.

## Types
Annotations such as `bilb ds: Magz<Sob>` are frontend-only evidence. They are erased in JavaScript output and introduce no runtime checks/helper.

## TypeScript oracle
TypeScript is optional, offline, advisory tooling for ecosystem diagnostics. Bila's own semantic engine remains authoritative for CVNSS4.0 and lowering safety.

## Modern grammar
V4 covers the existing expression core plus classes, named ESM import/export, destructuring, async/await structural support, arrows, optional chaining, nullish and spread/rest. It does not claim full ECMAScript/Test262 conformance.

MIT License · Copyright © 2026 Long Ngo · developed based on CVNSS4.0.
