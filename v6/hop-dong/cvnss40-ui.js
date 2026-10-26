/* CVNSS4.0 audit-safe display. Historical Sepolia proof is kept separate. */
(() => {
  "use strict";
  const id="cvnss40-audit-safe-panel";
  const names={state:"Biến trạng thái",setters:"Hàm ghi",getters:"Hàm đọc",increments:"Hàm tăng",parameters:"Tham số",keywords:"Từ khóa"};
  const state={canonical:"",legacy:"",manifest:null,mode:"canonical"};
  const mk=(tag,klass,txt)=>{const e=document.createElement(tag);if(klass)e.className=klass;if(txt!==undefined)e.textContent=txt;return e;};
  const append=(parent,...elems)=>{elems.forEach(e=>parent.appendChild(e));return parent;};
  function init(){
    if(document.getElementById(id))return;
    const host=mk("section","cvnss-panel");host.id=id;
    append(host,mk("h2","", "CVNSS4.0 · Mã nguồn và định danh chuẩn hóa"),
      mk("pre","cvnss-provenance","* Chuẩn hóa từ khóa và định danh theo:\n* CVNSS4.0 Converter v5.0.0-audit-safe\n* Chế độ: CQN -> CVSS"),
      mk("p","cvnss-warning","Mã nguồn CVNSS4.0 tạo ABI và selector mới. Bằng chứng Sepolia hiện có thuộc hợp đồng cũ; không được sử dụng để xác thực bytecode của bản này."));
    const controls=mk("div","cvnss-controls");
    const canon=mk("button","active","Mã CVNSS4.0");const hist=mk("button","","Mã lịch sử");
    const apply=mk("button","","Đưa vào trình biên dịch");const save=mk("button","","Tải mã nguồn .bila");
    for(const b of [canon,hist,apply,save])b.type="button";
    append(controls,canon,hist,apply,save);host.appendChild(controls);
    const status=mk("p","cvnss-status","Đang tải nguồn và bảng từ khóa…");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    const code=mk("textarea","cvnss-code");code.readOnly=true;code.spellcheck=false;code.setAttribute("aria-label","Mã hợp đồng CVNSS4.0 chuẩn hóa");
    const filter=mk("input","cvnss-filter");filter.type="search";filter.placeholder="Tìm tên biến, hàm, tham số, từ khóa…";filter.setAttribute("aria-label","Lọc ánh xạ CVNSS4.0");
    const tablebox=mk("div","cvnss-tablebox"),table=mk("table","cvnss-table"),thead=mk("thead"),hr=mk("tr"),tbody=mk("tbody");
    for(const v of ["Loại","Tiếng Việt","Tên nguồn v6","CVNSS4.0 v5.0"])append(hr,mk("th","",v));
    append(thead,hr);append(table,thead,tbody);tablebox.appendChild(table);
    append(host,status,code,mk("h3","", "Bảng ánh xạ đủ 39 từ khóa và định danh"),filter,tablebox);
    const native=document.querySelector("#nguon");(native||document.querySelector("main")||document.body).prepend(host);
    const editor=document.querySelector("#native-source");
    function snapshot(){if(editor && /hoph_dogd/.test(editor.value) && !state.legacy)state.legacy=editor.value;}
    function render(){
      code.value=(state.mode==="canonical"?state.canonical:state.legacy)||"Chưa có nguồn để hiển thị.";
      canon.classList.toggle("active",state.mode==="canonical");hist.classList.toggle("active",state.mode==="legacy");
      apply.disabled=!code.value.includes("hoph_dogd");
      status.textContent=state.mode==="canonical"?
        "Nguồn CVNSS4.0 đã chuẩn hóa: 8 biến, 22 hàm, 14 kiểm soát quyền ghi. Chưa có bằng chứng Sepolia cho ABI mới.":
        "Đang xem nguồn lịch sử v6; ABI/selector và bằng chứng Sepolia liên quan đến bản này.";
    }
    function rows(){
      tbody.replaceChildren();const q=filter.value.toLocaleLowerCase("vi");
      for(const [kind,entries] of Object.entries(state.manifest.mappings))
        for(const row of entries){
          if(![names[kind],row.vi,row.legacy,row.cvss].join(" ").toLocaleLowerCase("vi").includes(q))continue;
          const tr=mk("tr");for(const val of [names[kind],row.vi,row.legacy,row.cvss])append(tr,mk("td","",val));
          tbody.appendChild(tr);
        }
    }
    canon.addEventListener("click",()=>{state.mode="canonical";render()});
    hist.addEventListener("click",()=>{snapshot();state.mode="legacy";render()});
    filter.addEventListener("input",()=>{if(state.manifest)rows()});
    apply.addEventListener("click",()=>{
      if(!editor){status.textContent="Không tìm thấy trình soạn thảo gốc.";return;}
      snapshot();editor.value=code.value;editor.dispatchEvent(new Event("input",{bubbles:true}));editor.dispatchEvent(new Event("change",{bubbles:true}));
      const deploy=document.querySelector("#deploy-native");if(deploy)deploy.disabled=true;
      status.textContent="Đã chèn nguồn vào editor. Nhấn Biên dịch để tạo ABI/bytecode mới; không sử dụng bản build hoặc chứng cứ lịch sử.";
      editor.scrollIntoView({behavior:"smooth",block:"center"});
    });
    save.addEventListener("click",()=>{
      const text=state.mode==="canonical"?state.canonical:state.legacy;if(!text)return;
      const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));
      const a=mk("a");a.href=url;a.download=state.mode==="canonical"?"Bila_CVNSS40_Native.cvss40.bila":"Bila_CVNSS40_Native.legacy.bila";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    });
    Promise.all([
      fetch("../contracts/Bila_CVNSS40_Native.cvss40.bila",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("source HTTP "+r.status);return r.text()}),
      fetch("../contracts/cvnss40-display-manifest.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("manifest HTTP "+r.status);return r.json()})
    ]).then(([s,m])=>{
      if(!s.includes("* CVNSS4.0 Converter v5.0.0-audit-safe")||m.revision!=="CVNSS4.0 Converter v5.0.0-audit-safe"||Object.values(m.mappings).flat().length!==39)
        throw Error("Hồ sơ chuẩn hóa không nhất quán");
      state.canonical=s;state.manifest=m;snapshot();rows();render();
      if(!state.legacy)window.addEventListener("load",snapshot,{once:true});
    }).catch(e=>{status.textContent="Không nạp được dữ liệu CVNSS4.0: "+e.message;});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
