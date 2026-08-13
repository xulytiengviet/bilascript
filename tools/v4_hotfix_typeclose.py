#!/usr/bin/env python3
from pathlib import Path
p=Path('v4/src/parser.js')
s=p.read_text(encoding='utf-8')
old='''  parseTypeRef() {\n    const id=this.expectIdentifier(); const typeArguments=[];\n    if(this.eat("<")){ if(!this.at(">")){ do typeArguments.push(this.parseTypeRef()); while(this.eat(",")); } this.expect(">"); }\n    return {type:"BilaTypeReference",name:id.name,typeArguments,loc:id.loc};\n  }\n'''
new='''  expectTypeClose() {\n    const t=this.cur();\n    if(t?.type==="punctuator" && typeof t.value==="string" && t.value.startsWith(">")){\n      const rest=t.value.slice(1);\n      const firstEnd={offset:t.start.offset+1,line:t.start.line,column:t.start.column+1};\n      if(rest){ this.tokens[this.i]={...t,value:rest,raw:rest,start:firstEnd}; } else this.i++;\n      return {...t,value:">",raw:">",end:firstEnd};\n    }\n    return this.expect(">");\n  }\n  parseTypeRef() {\n    const id=this.expectIdentifier(); const typeArguments=[];\n    if(this.eat("<")){ if(!this.at(">")){ do typeArguments.push(this.parseTypeRef()); while(this.eat(",")); } this.expectTypeClose(); }\n    return {type:"BilaTypeReference",name:id.name,typeArguments,loc:id.loc};\n  }\n'''
if old not in s: raise SystemExit('typeRef anchor not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('applied generic type-close context fix')
