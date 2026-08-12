#!/usr/bin/env node
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { compile, parse } from "../src/compiler.js";

const [cmd,file,...rest]=process.argv.slice(2);
const usage=()=>console.log(`BilaScript v3.0.0\n\n  bila compile <file.bila> [-o out.js]\n  bila run <file.bila>\n  bila ast <file.bila>\n  bila check <file.bila>`);
if(!cmd||!file){usage();process.exit(cmd?1:0)}
const src=fs.readFileSync(file,"utf8");
try{
  if(cmd==="compile"){
    const r=compile(src); const oi=rest.indexOf("-o"); if(oi>=0&&rest[oi+1]) fs.writeFileSync(rest[oi+1],r.code); else process.stdout.write(r.code);
  } else if(cmd==="run"){
    const r=compile(src); const x=spawnSync(process.execPath,["-e",r.code],{stdio:"inherit"}); process.exit(x.status??1);
  } else if(cmd==="ast") console.log(JSON.stringify(parse(src).ast,null,2));
  else if(cmd==="check") { const r=compile(src); console.log(`OK BilaScript v${r.version} | mode=${r.mode} | backend=${r.backend}`); }
  else { usage(); process.exit(1); }
}catch(e){ console.error(`${e.name}: ${e.message}`); process.exit(1); }
