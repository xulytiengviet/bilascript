# BilaScript v4 development line

## Stage 1 / v3.6 — Compile-time Safety

Strict mode turns unresolved standard aliases into compile-time errors. Type annotations such as `bilb ds: Magz<Sob>` are erased before JavaScript code generation and exist only to prove lowering safety. No runtime translator/helper is introduced.

MIT License · Copyright © 2026 Long Ngo · based on CVNSS4.0.

## Stage 2 / v3.7 — Tooling & Language Service

Adds native Bila language-service primitives, a minimal LSP stdio server, VS Code language metadata, and an optional offline TypeScript oracle. TypeScript is advisory; Bila remains the source of truth for CVNSS4.0 semantics and alias safety.

## Stage 3 / v3.8 — Modern JavaScript Grammar

Adds Bila-owned parsing/codegen for classes, ESM import/export, destructuring, plus async/await structural support. Arrow, optional chaining, nullish, spread/rest and template syntax remain symbol-compatible. JavaScript-standard structural words without a frozen CVNSS4.0 canonical form remain explicit passthrough tokens rather than guessed translations.

## Loop 4 / v4.0.0 — Conformance Hardening

V4 adds a negative strict corpus, deterministic differential testing, zero-helper audit and explicit non-claims. It is an evidence-driven frontend: lowering is allowed only when compile-time evidence is sufficient.

## Architecture ownership model — BilaScript ↔ JavaScript

The project website includes an interactive 3D architecture model explaining how BilaScript is formed on top of JavaScript. The canonical data and weighting formula live in `src/architecture-metrics.js`; the website imports that module directly, so the published visualization and repository source cannot silently diverge.

Default equal-weight interpretation across six architectural layers:

- BilaScript-owned language/application logic: **45%**
- JavaScript engine / host / ecosystem capabilities: **55%**

Alternative explanatory presets are **57/43** when emphasizing the language frontend and **42/58** when emphasizing runtime infrastructure. These figures are a conceptual ownership/delegation model only — **not** source-line percentages, performance benchmarks, or ECMAScript conformance scores.
