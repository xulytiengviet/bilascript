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

async function start3D() {
  try {
    const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
    const { OrbitControls } = await import('https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(7.2, 5.6, 10.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    canvasHost.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.target.set(0, 2.7, 0);
    controls.minDistance = 5;
    controls.maxDistance = 16;

    scene.add(new THREE.AmbientLight(0x7aa7d9, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 8);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd43b, 1.15);
    rim.position.set(-7, 3, -6);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);
    const clickable = [];
    const width = 3.6, depth = 2.15, height = 0.86, gap = 0.34;

    ARCHITECTURE_LAYERS.forEach((layer, index) => {
      const y = 0.5 + index * (height + gap);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x12375a, roughness: 0.55, metalness: 0.12, transparent: true, opacity: 0.82 })
      );
      base.position.set(0, y, 0);
      base.userData.layerId = layer.id;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);
      clickable.push(base);

      if (layer.bilaShare > 0) {
        const innerHeight = Math.max(0.04, height * layer.bilaShare);
        const inner = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.88, innerHeight, depth * 0.88),
          new THREE.MeshStandardMaterial({ color: 0xffd43b, roughness: 0.32, metalness: 0.08, emissive: 0x6a5600, emissiveIntensity: 0.14 })
        );
        inner.position.set(0, y - height / 2 + innerHeight / 2 + 0.02, 0);
        inner.userData.layerId = layer.id;
        inner.castShadow = true;
        group.add(inner);
        clickable.push(inner);
      }

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
        new THREE.LineBasicMaterial({ color: 0x69e6ff, transparent: true, opacity: 0.34 })
      );
      edges.position.copy(base.position);
      group.add(edges);
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 10),
      new THREE.MeshStandardMaterial({ color: 0x001326, transparent: true, opacity: 0.5, roughness: 1, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    renderer.domElement.addEventListener('click', (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(clickable, false)[0];
      if (hit?.object?.userData?.layerId) showLayer(hit.object.userData.layerId);
    });

    function resize() {
      const widthPx = Math.max(320, canvasHost.clientWidth);
      const heightPx = Math.max(420, canvasHost.clientHeight);
      renderer.setSize(widthPx, heightPx, false);
      camera.aspect = widthPx / heightPx;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(canvasHost);
    resize();

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  } catch (error) {
    console.warn('3D unavailable; keeping data-first fallback.', error);
    canvasHost.innerHTML = '<div class="arch-fallback"><strong>3D không tải được.</strong><br>Dữ liệu tỷ lệ và công thức vẫn hoạt động từ module mã nguồn cục bộ.</div>';
  }
}

start3D();
