import { GLOBALS, MEMBERS } from "./vocabulary.js";
const g = n => GLOBALS[n] || n;
const m = n => MEMBERS[n] || n;

export function generate(ast) {
  const out=[]; let level=0;
  const ind=()=>"  ".repeat(level);
  const emit=s=>out.push(s);
  function stmt(n){
    switch(n.type){
      case "EmptyStatement": emit(ind()+";\n"); break;
      case "BlockStatement": emit("{\n"); level++; n.body.forEach(stmt); level--; emit(ind()+"}"); break;
      case "VariableDeclaration": emit(ind()+"var "+n.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", ")+";\n"); break;
      case "FunctionDeclaration": emit(ind()+`function ${expr(n.id)}(${n.params.map(expr).join(", ")}) `); stmt(n.body); emit("\n"); break;
      case "IfStatement": emit(ind()+`if (${expr(n.test)}) `); stmt(n.consequent); if(n.alternate){ emit(" else "); stmt(n.alternate); } emit("\n"); break;
      case "WhileStatement": emit(ind()+`while (${expr(n.test)}) `); stmt(n.body); emit("\n"); break;
      case "DoWhileStatement": emit(ind()+"do "); stmt(n.body); emit(` while (${expr(n.test)});\n`); break;
      case "ForStatement": { const init=n.init?(n.init.type==="VariableDeclaration"?"var "+n.init.declarations.map(d=>expr(d.id)+(d.init?" = "+expr(d.init):"")).join(", "):expr(n.init)):""; emit(ind()+`for (${init}; ${n.test?expr(n.test):""}; ${n.update?expr(n.update):""}) `); stmt(n.body); emit("\n"); break; }
      case "ReturnStatement": emit(ind()+"return"+(n.argument?" "+expr(n.argument):"")+";\n"); break;
      case "BreakStatement": emit(ind()+"break;\n"); break;
      case "ContinueStatement": emit(ind()+"continue;\n"); break;
      case "ThrowStatement": emit(ind()+"throw "+expr(n.argument)+";\n"); break;
      case "TryStatement": emit(ind()+"try "); stmt(n.block); if(n.handler){ emit(` catch (${expr(n.handler.param)}) `); stmt(n.handler.body); } if(n.finalizer){ emit(" finally "); stmt(n.finalizer); } emit("\n"); break;
      case "ExpressionStatement": emit(ind()+expr(n.expression)+";\n"); break;
      default: throw new Error(`Codegen chưa hỗ trợ statement ${n.type}`);
    }
  }
  function expr(n){
    switch(n.type){
      case "Identifier": return g(n.name);
      case "Literal": return typeof n.value==="string"?JSON.stringify(n.value):n.value===null?"null":String(n.value);
      case "ArrayExpression": return "["+n.elements.map(expr).join(", ")+"]";
      case "ObjectExpression": return "{"+n.properties.map(p=>{const k=p.key.type==="Identifier"?p.key.name:JSON.stringify(p.key.value); return `${k}: ${expr(p.value)}`;}).join(", ")+"}";
      case "UnaryExpression": return (/[A-Za-z]/.test(n.operator)?n.operator+" ":n.operator)+expr(n.argument);
      case "UpdateExpression": return n.prefix?n.operator+expr(n.argument):expr(n.argument)+n.operator;
      case "BinaryExpression": case "LogicalExpression": return `(${expr(n.left)} ${n.operator} ${expr(n.right)})`;
      case "AssignmentExpression": return `${expr(n.left)} ${n.operator} ${expr(n.right)}`;
      case "ConditionalExpression": return `(${expr(n.test)} ? ${expr(n.consequent)} : ${expr(n.alternate)})`;
      case "CallExpression": return `${expr(n.callee)}(${n.arguments.map(expr).join(", ")})`;
      case "NewExpression": return `new ${expr(n.callee)}(${n.arguments.map(expr).join(", ")})`;
      case "MemberExpression": return n.computed?`${expr(n.object)}[${expr(n.property)}]`:`${expr(n.object)}.${m(n.property.name)}`;
      default: throw new Error(`Codegen chưa hỗ trợ expression ${n.type}`);
    }
  }
  ast.body.forEach(stmt); return out.join("").trimEnd()+"\n";
}
