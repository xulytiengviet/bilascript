# Technical / scientific evaluation — BilaScript v4.0.0

## Research proposition
Can a localized CVNSS4.0 programming frontend own its compile-time semantics while preserving JavaScript's runtime/JIT ecosystem without runtime translation overhead?

## Method
Four sequential hardening loops were applied: compile-time safety, tooling/language service, modern grammar, and conformance hardening. Each loop is gated by automated tests before the next loop is committed.

## Main result
V4 moves the primary alias risk from runtime to compile-time in strict mode. Built-in member lowering requires receiver evidence. Static annotations improve evidence and are erased by codegen. Output remains ordinary JavaScript.

## Strengths
- Clear frontend ownership boundary.
- Zero runtime translation/helper contract for 1:1 constructs.
- User/npm APIs protected from implicit localization.
- Optional TypeScript ecosystem analysis without making TypeScript the semantic authority.
- Language-service/LSP foundation and source maps.
- Differential and negative conformance corpus.

## Limitations
- Not full ECMAScript/Test262.
- Flow-sensitive type inference is intentionally modest.
- Type annotations are a safety/evidence system, not a TypeScript clone.
- Some modern structural words remain JS passthrough until CVNSS4.0 canonical spellings are frozen.
- No claim that BilaScript is faster than handwritten JavaScript; the goal is runtime transparency of generated JS.

## Conclusion
BilaScript v4.0.0 is best characterized as an evidence-driven, research-grade localized language frontend with a clean JavaScript backend. Its strongest engineering claim is compile-time control of localization risk without placing a translation layer in the runtime path.
