/**
 * Argot Solidity/solc-js differential ORACLE.
 * This is NOT BilaScript's code generator. It checks the EVM ABI and selector
 * contract against a separately compiled equivalent reference program.
 * Run after: npm install --no-save --no-package-lock --ignore-scripts solc@0.8.30
 */
import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {compileBila,EXAMPLE} from "../compiler.mjs";
const require=createRequire(import.meta.url);
const solc=require("solc");
const reference=String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract Bof_Demb {
    address private __bila_owner;
    uint256 private demb;
    constructor() { __bila_owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == __bila_owner, "only owner"); _; }
    function ganj(uint256 jaj_trir) public onlyOwner { demb = jaj_trir; }
    function tago() public onlyOwner { demb = demb + 1; }
    function docr() public view returns(uint256) { return demb; }
}`;
function solcReference(){
 const input={language:"Solidity",sources:{"Reference.sol":{content:reference}},settings:{
   optimizer:{enabled:false},
   outputSelection:{"*":{"*":["abi","evm.methodIdentifiers","storageLayout"]}}
 }};
 const out=JSON.parse(solc.compile(JSON.stringify(input)));
 const errors=(out.errors||[]).filter(x=>x.severity==="error");
 if(errors.length)throw Error(errors.map(x=>x.formattedMessage).join("\n"));
 return out.contracts["Reference.sol"]["Bof_Demb"];
}
test("pinned Argot solc-js reference uses expected compiler build",()=>{
 assert.match(solc.version(),/^0\.8\.30\+/);
});
test("CVNSS source produces exact Solidity-compatible ABI signatures and selectors",()=>{
 const b=compileBila(EXAMPLE),s=solcReference();
 const std=a=>a.filter(x=>x.type==="function").map(f=>({
   name:f.name,inputs:f.inputs.map(x=>x.type),outputs:f.outputs.map(x=>x.type),
   stateMutability:f.stateMutability
 })).sort((x,y)=>x.name.localeCompare(y.name));
 assert.deepEqual(std(b.abi),std(s.abi));
 for(const m of Object.values(b.methods)){
   assert.equal(m.selector.toLowerCase(),"0x"+s.evm.methodIdentifiers[m.signature].toLowerCase(),m.signature);
 }
});
test("storage layout is compatible with audited owner-then-uint256 slot policy",()=>{
 const b=compileBila(EXAMPLE),s=solcReference();
 assert.equal(b.storageLayout[0].slot,0);
 assert.equal(b.storageLayout[1].slot,1);
 const ref=s.storageLayout.storage;
 assert.equal(ref[0].label,"__bila_owner");
 assert.equal(ref[0].slot,"0");
 assert.equal(ref[1].label,"demb");
 assert.equal(ref[1].slot,"1");
});
