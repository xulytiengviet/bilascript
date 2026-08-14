import {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_PRESETS,
  computeArchitectureShare,
  getArchitectureBreakdown,
  validateArchitectureModel
} from '../v4/src/architecture-metrics.js';

const $ = (selector) => document.querySelector(selector);
const canvasHost = $('#arch3d');
if (!canvasHost) throw new Error('Missing #arch3d host');

const validation = validateArchitectureModel();
if (!validation.ok) console.error('BilaScript architecture model invalid', validation.errors);

function renderMetrics(preset = 'equal') {
  const total = computeArchitectureShare(preset);
  const breakdown = getArchitectureBreakdown(preset);
  $('#arch-bila').textContent = `${total.bilaPercent.toFixed(1)}%`;
  $('#arch-js').textContent = `${total.javascriptHostPercent.toFixed(1)}%`;
  $('#arch-bar-bila').style.width = `${total.bilaPercent}%`;
  $('#arch-preset-note').textContent = ARCHITECTURE_PRESETS[preset].note;
  $('#arch-table-body').innerHTML = breakdown.map((layer) => `
    <tr data-layer="${layer.id}">
      <td><strong>${layer.name}</strong><small>${layer.sub}</small></td>
      <td class="ok">${(layer.bilaShare * 100).toFixed(0)}%</td>
      <td>${(layer.javascriptHostShare * 100).toFixed(0)}%</td>
      <td>${(layer.weight * 100).toFixed(1)}%</td>
    </tr>`).join('');
  return total;
}

function showLayer(id) {
  const layer = ARCHITECTURE_LAYERS.find((item) => item.id === id);
  if (!layer) return;
  $('#arch-detail-title').textContent = layer.name;
  $('#arch-detail-share').textContent = `${(layer.bilaShare * 100).toFixed(0)}% BilaScript · ${((1 - layer.bilaShare) * 100).toFixed(0)}% JavaScript/Host`;
  $('#arch-detail-desc').textContent = layer.description;
  $('#arch-detail-evidence').textContent = `Mã nguồn liên quan: ${layer.evidence.join(' · ')}`;
  document.querySelectorAll('#arch-table-body tr').forEach((row) => row.classList.toggle('active', row.dataset.layer === id));
  document.querySelectorAll('.arch-css3d-layer').forEach((node) => node.classList.toggle('active', node.dataset.layer === id));
}

const presetSelect = $('#arch-preset');
Object.values(ARCHITECTURE_PRESETS).forEach((preset) => {
  const option = document.createElement('option');
  option.value = preset.id;
  option.textContent = preset.label;
  presetSelect.appendChild(option);
});
presetSelect.addEventListener('change', () => renderMetrics(presetSelect.value));
renderMetrics('equal');
showLayer('compiler');

$('#arch-table-body').addEventListener('click', (event) => {
  const row = event.target.closest('tr[data-layer]');
  if (row) showLayer(row.dataset.layer);
});

function inject3DStyles() {
  if (document.querySelector('#arch-css3d-style')) return;
  const style = document.createElement('style');
  style.id = 'arch-css3d-style';
  style.textContent = `
    #arch3d{position:relative;overflow:hidden;touch-action:none;user-select:none;cursor:grab;isolation:isolate}
    #arch3d.dragging{cursor:grabbing}
    .arch-css3d-scene{position:absolute;inset:0;perspective:980px;perspective-origin:50% 45%;overflow:hidden;background:radial-gradient(circle at 50% 30%,rgba(105,230,255,.09),transparent 42%),linear-gradient(180deg,rgba(0,19,38,.2),rgba(0,19,38,.72))}
    .arch-css3d-world{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
    .arch-css3d-layer{position:absolute;left:0;top:0;width:300px;height:56px;margin-left:-150px;margin-top:-28px;transform-style:preserve-3d;transition:filter .18s ease;cursor:pointer}
    .arch-css3d-layer.active{filter:drop-shadow(0 0 14px rgba(255,212,59,.72))}
    .arch-css3d-cube{position:absolute;inset:0;transform-style:preserve-3d}
    .arch-css3d-face{position:absolute;display:flex;align-items:center;justify-content:center;backface-visibility:visible;border:1px solid rgba(105,230,255,.34);box-sizing:border-box;overflow:hidden}
    .arch-css3d-base .front,.arch-css3d-base .back{width:300px;height:56px;background:rgba(18,55,90,.9)}
    .arch-css3d-base .left,.arch-css3d-base .right{width:168px;height:56px;left:66px;background:rgba(10,43,75,.92)}
    .arch-css3d-base .top,.arch-css3d-base .bottom{width:300px;height:168px;top:-56px;background:rgba(22,68,108,.86)}
    .arch-css3d-base .front{transform:translateZ(84px)}
    .arch-css3d-base .back{transform:rotateY(180deg) translateZ(84px)}
    .arch-css3d-base .left{transform:rotateY(-90deg) translateZ(150px)}
    .arch-css3d-base .right{transform:rotateY(90deg) translateZ(150px)}
    .arch-css3d-base .top{transform:rotateX(90deg) translateZ(28px)}
    .arch-css3d-base .bottom{transform:rotateX(-90deg) translateZ(28px)}
    .arch-css3d-fill{position:absolute;left:18px;right:18px;bottom:4px;transform-style:preserve-3d;pointer-events:none}
    .arch-css3d-fill .front,.arch-css3d-fill .back{width:264px;height:100%;background:rgba(255,212,59,.94);border-color:rgba(255,230,120,.7)}
    .arch-css3d-fill .left,.arch-css3d-fill .right{width:144px;height:100%;left:60px;background:rgba(210,166,0,.96);border-color:rgba(255,230,120,.55)}
    .arch-css3d-fill .top,.arch-css3d-fill .bottom{width:264px;height:144px;top:calc(50% - 72px);background:rgba(255,220,72,.95);border-color:rgba(255,230,120,.55)}
    .arch-css3d-fill .front{transform:translateZ(72px)}
    .arch-css3d-fill .back{transform:rotateY(180deg) translateZ(72px)}
    .arch-css3d-fill .left{transform:rotateY(-90deg) translateZ(132px)}
    .arch-css3d-fill .right{transform:rotateY(90deg) translateZ(132px)}
    .arch-css3d-fill .top{transform:rotateX(90deg) translateZ(var(--fill-half))}
    .arch-css3d-fill .bottom{transform:rotateX(-90deg) translateZ(var(--fill-half))}
    .arch-css3d-label{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) translateZ(86px);width:260px;text-align:center;color:#fff;font:600 12px/1.25 Consolas,monospace;text-shadow:0 2px 8px #001326;pointer-events:none}
    .arch-css3d-label small{display:block;color:#69e6ff;font-size:9px;font-weight:400;margin-top:2px}
    .arch-css3d-label b{color:#ffd43b}
    .arch-css3d-toolbar{position:absolute;right:10px;top:10px;display:flex;gap:6px;align-items:center;z-index:4}
    .arch-css3d-badge,.arch-css3d-btn{border:1px solid #31577a;background:rgba(0,19,38,.9);color:#b9c8d8;font:10px Consolas,monospace;padding:7px 9px}
    .arch-css3d-badge{color:#7ee787;border-color:rgba(126,231,135,.45)}
    .arch-css3d-btn{cursor:pointer;color:#ffd43b}
    .arch-css3d-btn:hover{background:#002b55}
    .arch-css3d-axis{position:absolute;left:14px;bottom:38px;color:#69e6ff;font:10px Consolas,monospace;opacity:.8;z-index:3;pointer-events:none}
    .arch-css3d-nosupport{height:100%;min-height:500px;display:grid;place-items:center;text-align:center;padding:30px;color:#b9c8d8}
    @media(max-width:700px){.arch-css3d-toolbar{left:10px;right:auto;flex-wrap:wrap;max-width:calc(100% - 20px)}.arch-css3d-axis{display:none}}
    @media(prefers-reduced-motion:reduce){.arch-css3d-world{transition:none}}
  `;
  document.head.appendChild(style);
}

function createFace(className) {
  const face = document.createElement('div');
  face.className = `arch-css3d-face ${className}`;
  return face;
}

function createCube(layer, index) {
  const slab = document.createElement('div');
  slab.className = 'arch-css3d-layer';
  slab.dataset.layer = layer.id;
  const y = 155 - index * 76;
  const z = (index % 2 === 0 ? -1 : 1) * 7;
  slab.style.transform = `translate3d(0, ${y}px, ${z}px)`;

  const base = document.createElement('div');
  base.className = 'arch-css3d-cube arch-css3d-base';
  ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach((name) => base.appendChild(createFace(name)));
  slab.appendChild(base);

  if (layer.bilaShare > 0.005) {
    const fillHeight = Math.max(8, Math.round(48 * layer.bilaShare));
    const fill = document.createElement('div');
    fill.className = 'arch-css3d-cube arch-css3d-fill';
    fill.style.height = `${fillHeight}px`;
    fill.style.setProperty('--fill-half', `${fillHeight / 2}px`);
    ['front', 'back', 'left', 'right', 'top', 'bottom'].forEach((name) => fill.appendChild(createFace(name)));
    slab.appendChild(fill);
  }

  const label = document.createElement('div');
  label.className = 'arch-css3d-label';
  label.innerHTML = `${layer.name}<small><b>${(layer.bilaShare * 100).toFixed(0)}%</b> BilaScript · ${((1 - layer.bilaShare) * 100).toFixed(0)}% JS/Host</small>`;
  slab.appendChild(label);
  slab.addEventListener('click', () => showLayer(layer.id));
  return slab;
}

function start3D() {
  inject3DStyles();

  if (!CSS.supports('transform-style', 'preserve-3d')) {
    canvasHost.innerHTML = '<div class="arch-css3d-nosupport"><div><strong>Trình duyệt không hỗ trợ CSS 3D.</strong><br>Bảng tỷ lệ bên phải vẫn dùng dữ liệu mã nguồn cục bộ.</div></div>';
    return;
  }

  const scene = document.createElement('div');
  scene.className = 'arch-css3d-scene';
  const world = document.createElement('div');
  world.className = 'arch-css3d-world';
  ARCHITECTURE_LAYERS.forEach((layer, index) => world.appendChild(createCube(layer, index)));
  scene.appendChild(world);

  const toolbar = document.createElement('div');
  toolbar.className = 'arch-css3d-toolbar';
  toolbar.innerHTML = '<span class="arch-css3d-badge">LOCAL 3D · ZERO CDN</span><button class="arch-css3d-btn" type="button" data-action="auto">AUTO: ON</button><button class="arch-css3d-btn" type="button" data-action="reset">RESET</button>';
  scene.appendChild(toolbar);

  const axis = document.createElement('div');
  axis.className = 'arch-css3d-axis';
  axis.textContent = 'CSS 3D · same-origin modules · no WebGL dependency';
  scene.appendChild(axis);
  canvasHost.replaceChildren(scene);

  let rotX = -18;
  let rotY = 34;
  let zoom = 0.94;
  let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let lastFrame = performance.now();

  const applyTransform = () => {
    world.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`;
  };
  applyTransform();

  const autoButton = toolbar.querySelector('[data-action="auto"]');
  const updateAutoLabel = () => { autoButton.textContent = `AUTO: ${autoRotate ? 'ON' : 'OFF'}`; };
  updateAutoLabel();

  scene.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvasHost.classList.add('dragging');
    scene.setPointerCapture?.(event.pointerId);
  });

  scene.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    rotY += dx * 0.45;
    rotX = Math.max(-68, Math.min(48, rotX - dy * 0.35));
    lastX = event.clientX;
    lastY = event.clientY;
    applyTransform();
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    canvasHost.classList.remove('dragging');
    try { scene.releasePointerCapture?.(event.pointerId); } catch {}
  };
  scene.addEventListener('pointerup', endDrag);
  scene.addEventListener('pointercancel', endDrag);

  scene.addEventListener('click', (event) => {
    if (moved && event.target.closest('.arch-css3d-layer')) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }
  }, true);

  scene.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom = Math.max(0.62, Math.min(1.35, zoom - event.deltaY * 0.00075));
    applyTransform();
  }, { passive: false });

  toolbar.querySelector('[data-action="reset"]').addEventListener('click', () => {
    rotX = -18;
    rotY = 34;
    zoom = 0.94;
    applyTransform();
  });
  autoButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    updateAutoLabel();
  });

  const animate = (now) => {
    const delta = Math.min(50, now - lastFrame);
    lastFrame = now;
    if (autoRotate && !dragging && !document.hidden) {
      rotY += delta * 0.008;
      applyTransform();
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  showLayer('compiler');
}

start3D();
