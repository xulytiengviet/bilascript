
import test from "node:test"; import assert from "node:assert/strict"; import { createLanguageService } from "../src/language-service.js"; import { analyzeWithTypeScript } from "../src/typescript-oracle.js";
test("stage2: language service returns diagnostics/completions/symbols",()=>{const ls=createLanguageService(`---bila:strict---\nhaml_sob tong(a: Sob,b: Sob): Sob { trov_ved a+b; }`);assert.ok(ls.completions.some(x=>x.label==="neub"));assert.ok(ls.symbols.some(x=>x.name==="tong"));assert.equal(ls.diagnostics.length,0);});
test("stage2: TypeScript oracle is offline and optional",async()=>{const r=await analyzeWithTypeScript(`const x=1; x.trim();`);assert.equal(typeof r.available,"boolean");if(r.available)assert.ok(r.diagnostics.some(x=>x.code.startsWith("TS")));});
