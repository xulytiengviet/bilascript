import { parse } from "./parser.js";
import { analyze } from "./semantic.js";
import { generate } from "./codegen-js.js";

export function compile(source, options={}) {
  const parsed=parse(source);
  const diagnostics=analyze(parsed.ast);
  const errors=diagnostics.filter(x=>x.severity==="error");
  if(options.failOnSemanticError!==false && errors.length){
    const e=new Error(errors.map(x=>`${x.code}: ${x.message}`).join("\n")); e.name="BilaSemanticError"; e.diagnostics=diagnostics; throw e;
  }
  return {version:"3.0.0",backend:"javascript",mode:parsed.mode,ast:parsed.ast,diagnostics,code:generate(parsed.ast)};
}
export { parse } from "./parser.js";
export { lex } from "./lexer.js";
export { analyze } from "./semantic.js";
export { generate } from "./codegen-js.js";
