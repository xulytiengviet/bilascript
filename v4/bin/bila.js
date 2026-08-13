#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { compile, parse, lex } from "../src/compiler.js";

const [cmd,file,...rest]=process.argv.slice(2);
const usage=()=>console.log(`BilaScript v4.0.0\n\n  bila compile <file.bila> [-o out.js] [--map]\n  bila run <file.bila>\n  bila ast <file.bila> [--normalized]\n  bila tokens <file.bila>\n  bila check <file.bila>`);
if(!cmd||!file){usage();process.exit(cmd?1:0)}
const src=fs.readFileSync(file,"utf8");
try{
  if(cmd==="compile"){
    const oi=rest.indexOf("-o"), outFile=oi>=0?rest[oi+1]:null, sourceMap=rest.includes("--map");
    const r=compile(src,{sourceMap,sourceName:path.basename(file),fileName:outFile?path.basename(outFile):"output.js"});
    let code=r.code;
    if(sourceMap&&outFile){ const mapFile=outFile+".map"; fs.writeFileSync(mapFile,JSON.stringify(r.map)); code+=`//# sourceMappingURL=${path.basename(mapFile)}\n`; }
    if(outFile) fs.writeFileSync(outFile,code); else process.stdout.write(code);
  } else if(cmd==="run"){
    const r=compile(src); const x=spawnSync(process.execPath,["-e",r.code],{stdio:"inherit"}); process.exit(x.status??1);
  } else if(cmd==="ast") { const r=compile(src,{failOnSemanticError:false}); console.log(JSON.stringify(rest.includes("--normalized")?r.normalizedAst:r.ast,null,2)); }
  else if(cmd==="tokens") console.log(JSON.stringify(lex(src).tokens,null,2));
  else if(cmd==="check") { const r=compile(src); console.log(`OK BilaScript v${r.version} | mode=${r.mode} | backend=${r.backend} | zeroCost=${r.performance.zeroCost} | warnings=${r.diagnostics.filter(x=>x.severity==="warning").length}`); }
  else { usage(); process.exit(1); }
}catch(e){ console.error(`${e.name}: ${e.message}`); process.exit(1); }
