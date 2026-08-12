import { GLOBAL_SPECS, MEMBER_SPECS } from "./vocabulary.js";

class Scope {
  constructor(parent=null){ this.parent=parent; this.bindings=new Map(); }
  define(name,info={}){ this.bindings.set(name,{name,...info}); }
  get(name){ return this.bindings.get(name)||this.parent?.get(name)||null; }
  hasOwn(name){ return this.bindings.has(name); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const typeOfLiteral = n => {
  if(n?.type==="ArrayExpression") return "array";
  if(n?.type==="Literal") {
    if(typeof n.value==="string") return "string";
    if(typeof n.value==="boolean") return "boolean";
    if(n.value===null && n.raw && /^[0-9.]/.test(n.raw.replace(/^[-+]/,""))) return "number";
    if(n.value===null) return "null";
  }
  if(n?.type==="RegexLiteral") return "regexp";
  if(["FunctionExpression","ArrowFunctionExpression"].includes(n?.type)) return "function";
  return null;
};

export function normalize(inputAst) {
  const ast=clone(inputAst); const diagnostics=[]; const metadata={resolvedGlobals:0,resolvedMembers:0,unresolvedMemberAliases:0};
  const warn=(node,code,message)=>{ const p=node?.loc?.start; diagnostics.push({severity:"warning",code,message,line:p?.line||null,column:p?.column||null}); };

  function predeclare(body,scope){
    for(const n of body||[]){
      if(n?.type==="VariableDeclaration") for(const d of n.declarations) scope.define(d.id.name,{kind:"variable",type:null});
      if(n?.type==="FunctionDeclaration") scope.define(n.id.name,{kind:"function",type:"function"});
    }
  }
  function infer(n,scope){
    const literal=typeOfLiteral(n); if(literal) return literal;
    if(!n) return null;
    if(n.type==="Identifier") {
      const b=scope.get(n.name); if(b?.type) return b.type;
      const g=GLOBAL_SPECS[n.name]; return g?.type||null;
    }
    if(n.type==="NewExpression") {
      if(n.callee?.type==="Identifier") return GLOBAL_SPECS[n.callee.name]?.type||scope.get(n.callee.name)?.type||null;
    }
    return n.inferredType||null;
  }
  function visit(node,scope,context={}){
    if(!node||typeof node!=="object") return;
    switch(node.type){
      case "Program": predeclare(node.body,scope); node.body.forEach(n=>visit(n,scope)); return;
      case "BlockStatement": { const child=new Scope(scope); predeclare(node.body,child); node.body.forEach(n=>visit(n,child)); return; }
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression": {
        const fnScope=new Scope(scope); if(node.id) fnScope.define(node.id.name,{kind:"function",type:"function"}); for(const p of node.params||[]) fnScope.define(p.name,{kind:"parameter",type:null});
        if(node.body?.type==="BlockStatement") visit(node.body,fnScope); else visit(node.body,fnScope); return;
      }
      case "VariableDeclaration":
        for(const d of node.declarations){ if(d.init) visit(d.init,scope); const info=scope.get(d.id.name); if(info) info.type=infer(d.init,scope); d.inferredType=info?.type||null; }
        return;
      case "Identifier": {
        if(context.propertyKey||context.declaration) return;
        const local=scope.get(node.name);
        if(!local && GLOBAL_SPECS[node.name]) { const spec=GLOBAL_SPECS[node.name]; node.jsName=spec.js; node.inferredType=spec.type; node.bilaGlobal=node.name; metadata.resolvedGlobals++; }
        else if(local?.type) node.inferredType=local.type;
        return;
      }
      case "MemberExpression": {
        visit(node.object,scope); if(node.computed) visit(node.property,scope); else visit(node.property,scope,{propertyKey:true});
        const receiver=infer(node.object,scope); node.receiverType=receiver;
        if(!node.computed && node.property?.type==="Identifier" && MEMBER_SPECS[node.property.name]){
          const spec=MEMBER_SPECS[node.property.name];
          if(receiver && spec.receivers.includes(receiver)){ node.jsProperty=spec.js; node.bilaProperty=node.property.name; metadata.resolvedMembers++; }
          else { metadata.unresolvedMemberAliases++; warn(node,"BILA-S310",`Không tự đổi '${node.property.name}' vì chưa chứng minh receiver thuộc [${spec.receivers.join(", ")}]; giữ nguyên property để tránh phá API người dùng.`); }
        }
        return;
      }
      case "NewExpression": case "CallExpression": visit(node.callee,scope); (node.arguments||[]).forEach(a=>visit(a,scope)); node.inferredType=infer(node,scope); return;
      case "Property": visit(node.key,scope,{propertyKey:true}); visit(node.value,scope); return;
      case "CatchClause": { const child=new Scope(scope); if(node.param) child.define(node.param.name,{kind:"catch",type:null}); visit(node.body,child); return; }
    }
    for(const [k,v] of Object.entries(node)) if(!["type","loc","jsName","jsProperty","receiverType","inferredType","bilaGlobal","bilaProperty"].includes(k)){
      if(Array.isArray(v)) v.forEach(x=>visit(x,scope)); else if(v&&typeof v==="object") visit(v,scope);
    }
  }
  visit(ast,new Scope());
  return {ast,diagnostics,metadata};
}
