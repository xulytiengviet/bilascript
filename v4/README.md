# BilaScript v4 development line

## Stage 1 / v3.6 — Compile-time Safety

Strict mode turns unresolved standard aliases into compile-time errors. Type annotations such as `bilb ds: Magz<Sob>` are erased before JavaScript code generation and exist only to prove lowering safety. No runtime translator/helper is introduced.

MIT License · Copyright © 2026 Long Ngo · based on CVNSS4.0.
