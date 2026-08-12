export function analyze(ast) {
  const diagnostics=[];
  const error=(node,code,message)=>diagnostics.push({severity:"error",code,message,line:node?.loc?.line||null,column:node?.loc?.column||null});
  function visit(node,ctx={functionDepth:0,loopDepth:0}) {
    if(!node||typeof node!=="object") return;
    switch(node.type) {
      case "FunctionDeclaration": {
        const seen=new Set(); for(const p of node.params){ if(seen.has(p.name)) error(p,"BILA-S101",`Tham số trùng '${p.name}'`); seen.add(p.name); }
        visit(node.body,{...ctx,functionDepth:ctx.functionDepth+1}); return;
      }
      case "ReturnStatement": if(ctx.functionDepth===0) error(node,"BILA-S201","trov_ved/return chỉ hợp lệ bên trong hàm"); break;
      case "BreakStatement": if(ctx.loopDepth===0) error(node,"BILA-S202","zugk/break chỉ hợp lệ bên trong vòng lặp"); return;
      case "ContinueStatement": if(ctx.loopDepth===0) error(node,"BILA-S203","tifb_tucr/continue chỉ hợp lệ bên trong vòng lặp"); return;
      case "WhileStatement": case "DoWhileStatement": case "ForStatement":
        for(const k of Object.keys(node)) if(k!=="type") { const v=node[k]; if(k==="body") visit(v,{...ctx,loopDepth:ctx.loopDepth+1}); else visitAny(v,ctx); } return;
    }
    for(const [k,v] of Object.entries(node)) if(k!=="type"&&k!=="loc") visitAny(v,ctx);
  }
  function visitAny(v,ctx){ if(Array.isArray(v)) v.forEach(x=>visit(x,ctx)); else visit(v,ctx); }
  visit(ast);
  return diagnostics;
}
