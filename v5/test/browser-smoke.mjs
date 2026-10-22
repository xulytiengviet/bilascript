import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {resolve,extname,join} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=resolve(fileURLToPath(new URL("../../",import.meta.url)));
const types={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".css":"text/css; charset=utf-8"};
const server=createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const target=resolve(root,"."+pathname+(pathname.endsWith("/")?"index.html":""));
    if(!target.startsWith(root+"/"))throw new Error("Outside root");
    const body=readFileSync(target);
    res.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream","Cache-Control":"no-store"});
    res.end(body);
  }catch(e){res.writeHead(404);res.end("Not found");}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
let browser;
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||"/usr/bin/google-chrome",args:["--no-sandbox"]});
  const page=await browser.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:"+port+"/v5/",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelector("#result")?.textContent?.trim()==="20",{timeout:8000});
  assert.equal((await page.locator("#result").textContent()).trim(),"20");
  assert.equal(await page.locator("#exercise-list .exercise").count(),50);
  await page.locator("#search").fill("Fibonacci");
  assert.equal(await page.locator("#exercise-list .exercise").count(),1);
  await page.locator("#exercise-list .exercise").first().click();
  await page.locator("#run").click();
  await page.waitForFunction(()=>document.querySelector("#result")?.textContent?.includes("34"),{timeout:8000});
  const fib=(await page.locator("#result").textContent()).trim();
  assert.deepEqual(JSON.parse(fib),[0,1,1,2,3,5,8,13,21,34]);
  await page.locator("#search").fill("");
  await page.locator("#category").selectOption("Mảng");
  assert.equal(await page.locator("#exercise-list .exercise").count(),10);
  await page.locator("#category").selectOption("Tất cả");
  await page.locator("#exercise-list .exercise").first().click();
  await page.locator("#source").fill("---bila:strict---\nhaml_sob bai(){ trov_ved 100 + 8; }");
  await page.locator("#run").click();
  await page.waitForFunction(()=>document.querySelector("#result")?.textContent?.trim()==="108",{timeout:8000});
  await page.locator("#source").fill("---bila:strict---\nhaml_sob bai(){ bilb x=typeof 3; trov_ved x; }");
  await page.locator("#compile").click();
  assert.match(await page.locator("#result").textContent(),/BILA-CV401/);
  assert.deepEqual(errors,[],"Browser page errors");
  console.log("BilaScript browser smoke: 50 lessons, search, real worker execution, edit, strict validation all passed");
} finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
