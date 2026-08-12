import { lex, BilaSyntaxError } from "./lexer.js";

const PRECEDENCE = { "||":1, "&&":2, "|":3, "^":4, "&":5, "==":6, "!=":6, "===":6, "!==":6, "<":7, ">":7, "<=":7, ">=":7, "in":7, "instanceof":7, "<<":8, ">>":8, ">>>":8, "+":9, "-":9, "*":10, "/":10, "%":10, "**":11 };
const ASSIGN = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "**="]);
const UNARY = new Set(["!", "+", "-", "~", "typeof", "void", "delete"]);

export class Parser {
  constructor(source) {
    const out = lex(source);
    this.mode = out.mode;
    this.directive = out.directive;
    this.tokens = out.tokens;
    this.i = 0;
  }
  cur() { return this.tokens[this.i]; }
  next() { return this.tokens[this.i++]; }
  at(value) { return this.cur().value === value; }
  eat(value) { if (this.at(value)) { this.next(); return true; } return false; }
  expect(value, message = `Mong đợi '${value}'`) { if (!this.at(value)) throw new BilaSyntaxError(message, this.cur()); return this.next(); }
  expectIdentifier() { const t=this.cur(); if (t.type !== "identifier") throw new BilaSyntaxError("Mong đợi định danh", t); this.next(); return {type:"Identifier", name:t.value, loc:{line:t.line,column:t.column}}; }

  parseProgram() {
    const body=[]; while (this.cur().type !== "eof") body.push(this.parseStatement());
    return { type:"Program", sourceType:"script", bilaMode:this.mode, directive:this.directive, body };
  }
  parseStatement() {
    const t=this.cur();
    if (this.eat(";")) return {type:"EmptyStatement"};
    if (this.at("{")) return this.parseBlock();
    if (t.type === "keyword") {
      switch(t.value) {
        case "var": return this.parseVariableStatement(true);
        case "function": return this.parseFunctionDeclaration();
        case "if": return this.parseIf();
        case "while": return this.parseWhile();
        case "do": return this.parseDoWhile();
        case "for": return this.parseFor();
        case "return": return this.parseReturn();
        case "break": this.next(); this.eat(";"); return {type:"BreakStatement", loc:{line:t.line,column:t.column}};
        case "continue": this.next(); this.eat(";"); return {type:"ContinueStatement", loc:{line:t.line,column:t.column}};
        case "throw": return this.parseThrow();
        case "try": return this.parseTry();
      }
    }
    const expression=this.parseExpression(); this.eat(";"); return {type:"ExpressionStatement", expression};
  }
  parseBlock() { this.expect("{"); const body=[]; while(!this.at("}")) { if(this.cur().type==="eof") throw new BilaSyntaxError("Khối lệnh chưa đóng",this.cur()); body.push(this.parseStatement()); } this.expect("}"); return {type:"BlockStatement",body}; }
  parseVariableStatement(withSemicolon=true) { this.expect("var"); const declarations=[]; do { const id=this.expectIdentifier(); let init=null; if(this.eat("=")) init=this.parseExpression(); declarations.push({type:"VariableDeclarator",id,init}); } while(this.eat(",")); if(withSemicolon) this.eat(";"); return {type:"VariableDeclaration",kind:"var",declarations}; }
  parseFunctionDeclaration() { const start=this.expect("function"); const id=this.expectIdentifier(); this.expect("("); const params=[]; if(!this.at(")")) { do params.push(this.expectIdentifier()); while(this.eat(",")); } this.expect(")"); const body=this.parseBlock(); return {type:"FunctionDeclaration",id,params,body,loc:{line:start.line,column:start.column}}; }
  parseIf() { this.expect("if"); this.expect("("); const test=this.parseExpression(); this.expect(")"); const consequent=this.parseStatement(); let alternate=null; if(this.eat("else")) alternate=this.parseStatement(); return {type:"IfStatement",test,consequent,alternate}; }
  parseWhile() { this.expect("while"); this.expect("("); const test=this.parseExpression(); this.expect(")"); return {type:"WhileStatement",test,body:this.parseStatement()}; }
  parseDoWhile() { this.expect("do"); const body=this.parseStatement(); this.expect("while"); this.expect("("); const test=this.parseExpression(); this.expect(")"); this.eat(";"); return {type:"DoWhileStatement",body,test}; }
  parseFor() { this.expect("for"); this.expect("("); let init=null,test=null,update=null; if(!this.at(";")) init=this.at("var")?this.parseVariableStatement(false):this.parseExpression(); this.expect(";"); if(!this.at(";")) test=this.parseExpression(); this.expect(";"); if(!this.at(")")) update=this.parseExpression(); this.expect(")"); return {type:"ForStatement",init,test,update,body:this.parseStatement()}; }
  parseReturn() { const t=this.expect("return"); let argument=null; if(!this.at(";") && !this.at("}") && this.cur().type!=="eof") argument=this.parseExpression(); this.eat(";"); return {type:"ReturnStatement",argument,loc:{line:t.line,column:t.column}}; }
  parseThrow() { const t=this.expect("throw"); const argument=this.parseExpression(); this.eat(";"); return {type:"ThrowStatement",argument,loc:{line:t.line,column:t.column}}; }
  parseTry() { this.expect("try"); const block=this.parseBlock(); let handler=null,finalizer=null; if(this.eat("catch")) { this.expect("("); const param=this.expectIdentifier(); this.expect(")"); handler={type:"CatchClause",param,body:this.parseBlock()}; } if(this.eat("finally")) finalizer=this.parseBlock(); if(!handler&&!finalizer) throw new BilaSyntaxError("try cần catch hoặc finally",this.cur()); return {type:"TryStatement",block,handler,finalizer}; }

  parseExpression() { return this.parseAssignment(); }
  parseAssignment() { let left=this.parseConditional(); if(ASSIGN.has(this.cur().value)) { const operator=this.next().value; const right=this.parseAssignment(); return {type:"AssignmentExpression",operator,left,right}; } return left; }
  parseConditional() { let test=this.parseBinary(1); if(this.eat("?")) { const consequent=this.parseExpression(); this.expect(":"); const alternate=this.parseAssignment(); return {type:"ConditionalExpression",test,consequent,alternate}; } return test; }
  parseBinary(minPrec) { let left=this.parseUnary(); while(true) { const op=this.cur().value, prec=PRECEDENCE[op]||0; if(prec<minPrec) break; this.next(); const right=this.parseBinary(op==="**"?prec:prec+1); left={type:(op==="&&"||op==="||")?"LogicalExpression":"BinaryExpression",operator:op,left,right}; } return left; }
  parseUnary() { const t=this.cur(); if((t.type==="punctuator"||t.type==="keyword") && UNARY.has(t.value)) { this.next(); return {type:"UnaryExpression",operator:t.value,prefix:true,argument:this.parseUnary()}; } if(t.type==="keyword"&&t.value==="new") { this.next(); const callee=this.parsePostfix(this.parsePrimary()); let args=[]; if(callee.type==="CallExpression") return {type:"NewExpression",callee:callee.callee,arguments:callee.arguments}; if(this.eat("(")) { args=this.parseArgumentsAfterOpen(); } return {type:"NewExpression",callee,arguments:args}; } return this.parsePostfix(this.parsePrimary()); }
  parsePostfix(expr) { while(true) { if(this.eat("(")) { expr={type:"CallExpression",callee:expr,arguments:this.parseArgumentsAfterOpen()}; continue; } if(this.eat(".")) { const p=this.expectIdentifier(); expr={type:"MemberExpression",object:expr,property:p,computed:false}; continue; } if(this.eat("[")) { const property=this.parseExpression(); this.expect("]"); expr={type:"MemberExpression",object:expr,property,computed:true}; continue; } if(this.at("++")||this.at("--")) { const operator=this.next().value; expr={type:"UpdateExpression",operator,argument:expr,prefix:false}; continue; } break; } return expr; }
  parseArgumentsAfterOpen() { const args=[]; if(!this.at(")")) { do args.push(this.parseExpression()); while(this.eat(",")); } this.expect(")"); return args; }
  parsePrimary() {
    const t=this.cur();
    if(t.type==="number") { this.next(); return {type:"Literal",value:t.value,raw:t.raw}; }
    if(t.type==="string") { this.next(); return {type:"Literal",value:t.value,raw:t.raw}; }
    if(t.type==="keyword"&&(t.value==="true"||t.value==="false"||t.value==="null")) { this.next(); return {type:"Literal",value:t.value==="null"?null:t.value==="true",raw:t.raw}; }
    if(t.type==="identifier") { this.next(); return {type:"Identifier",name:t.value,loc:{line:t.line,column:t.column}}; }
    if(this.eat("(")) { const e=this.parseExpression(); this.expect(")"); return e; }
    if(this.eat("[")) { const elements=[]; if(!this.at("]")) { do elements.push(this.parseExpression()); while(this.eat(",")); } this.expect("]"); return {type:"ArrayExpression",elements}; }
    if(this.eat("{")) { const properties=[]; if(!this.at("}")) { do { const k=this.cur(); let key; if(k.type==="identifier") key=this.expectIdentifier(); else if(k.type==="string"||k.type==="number") { this.next(); key={type:"Literal",value:k.value,raw:k.raw}; } else throw new BilaSyntaxError("Khóa object không hợp lệ",k); this.expect(":"); properties.push({type:"Property",key,value:this.parseExpression(),kind:"init",computed:false}); } while(this.eat(",")); } this.expect("}"); return {type:"ObjectExpression",properties}; }
    throw new BilaSyntaxError(`Biểu thức không hợp lệ gần '${t.raw||t.value}'`,t);
  }
}

export function parse(source) { const p=new Parser(source); const ast=p.parseProgram(); return {ast,mode:p.mode,directive:p.directive}; }
