# BilaScript v4.0.0 — Four-loop hardening audit

## Loop 1 — Compile-time Safety
- Strict unknown built-in alias: compile-time error `BILA-T310`.
- Static annotations (`Sob`, `Chujg`, `Magz<T>`, unions) exist only in frontend and are erased before JS.
- Type mismatch is rejected before runtime.

## Loop 2 — Tooling & Language Service
- Native diagnostics, completions, hover and symbol extraction.
- Minimal LSP stdio server.
- Optional TypeScript oracle runs offline and is advisory, not the Bila semantic source of truth.

## Loop 3 — Modern JavaScript Grammar
- Bila parser/codegen owns class, named ESM import/export and destructuring.
- Arrow, optional chaining, nullish, spread/rest and templates preserve JS symbols.
- async/await/extends/static/as are explicit structural passthrough tokens until canonical CVNSS4.0 spellings are frozen.

## Loop 4 — Conformance Hardening
- Positive/negative corpus, 100-case deterministic operator differential test, zero-helper audit, source-map test and tooling smoke tests.
- No claim of full Test262/ECMAScript conformance.

## Invariant
`CVNSS4.0 → Bila semantic frontend → clean JavaScript → JS runtime`

No runtime translator, collection wrapper or semantic proxy is inserted for 1:1 lowering.
