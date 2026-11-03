// Berofel 3D Create — PixelFX integration layer.
// PixelFX is loaded on demand from its MIT-licensed upstream source.
const CORE_URL = "https://esm.sh/gh/patch-gg/pixelfx@main/src/core/index.js";
const EFFECTS = [
  ["Combate", "melee/claw-swipe", "Garras"],
  ["Combate", "melee/sword-slash", "Corte de espada"],
  ["Combate", "melee/double-slash", "Corte duplo"],
  ["Combate", "impacts/critical-hit", "Impacto crítico"],
  ["Combate", "impacts/ground-slam", "Impacto no chão"],
  ["Combate", "moves/dash-strike", "Investida"],
  ["Combate", "moves/earth-stomp", "Pisada"],
  ["Fogo", "fire/fire-breath", "Sopro de fogo"],
  ["Fogo", "fire/fireball", "Bola de fogo"],
  ["Fogo", "fire/fire-ring", "Anel de fogo"],
  ["Fogo", "explosions/small-explosion", "Explosão"],
  ["Fogo", "explosions/firework-burst", "Fogos"],
  ["Água", "water/splash", "Respingo"],
  ["Água", "water/bubbles", "Bolhas"],
  ["Água", "water/waterfall", "Cachoeira"],
  ["Gelo", "ice/frost-breath", "Sopro congelante"],
  ["Gelo", "ice/frost-nova", "Nova de gelo"],
  ["Gelo", "ice/ice-lance", "Lança de gelo"],
  ["Energia", "lightning/lightning-strike", "Raio"],
  ["Energia", "lightning/chain-lightning", "Raio encadeado"],
  ["Energia", "sci-fi/force-field", "Campo de força"],
  ["Magia", "arcane/arcane-orb", "Orbe arcano"],
  ["Magia", "arcane/magic-circle-cast", "Círculo mágico"],
  ["Magia", "holy/heal", "Cura"],
  ["Natureza", "nature/poison-cloud", "Nuvem venenosa"],
  ["Natureza", "nature/leaf-storm", "Tempestade de folhas"],
  ["Natureza", "shadow/dark-explosion", "Explosão sombria"],
  ["Criaturas", "critters/butterfly", "Borboleta"],
  ["Criaturas", "critters/bird", "Pássaro"],
  ["Interface", "pickups/gem-spin", "Cristal"],
  ["Interface", "pickups/coin-collect", "Coletar moeda"],
  ["Interface", "spawn-death/poof", "Desaparecer"]
];
const CDN = "https://esm.sh/gh/patch-gg/pixelfx@main/src/fx/";
const $ = (id) => document.getElementById(id);

export function createVfxStudio({ THREE, scene, getSelected, onStatus = () => {} }) {
  let corePromise = null, activeModule = null, activeFx = null, frame = null;
  let canvas = null, ctx = null, imageData = null, texture = null, sprite = null;
  let lastTime = 0, activeId = "", closed = true;
  const panel = document.createElement("section");
  panel.id = "vfxStudioPanel";
  panel.innerHTML = `
    <div class="vfx-head"><div><strong>VFX STUDIO</strong><small>PixelFX • efeitos animados</small></div><button type="button" id="vfxClose" aria-label="Fechar">✕</button></div>
    <div class="vfx-body">
      <label for="vfxCategory">Categoria</label><select id="vfxCategory"></select>
      <label for="vfxEffect">Efeito</label><select id="vfxEffect"></select>
      <div class="vfx-preview"><canvas id="vfxPreview" width="160" height="120"></canvas></div>
      <div class="vfx-actions"><button type="button" id="vfxPlay" class="primary">▶ Reproduzir</button><button type="button" id="vfxAdd">Adicionar ao modelo</button></div>
      <button type="button" id="vfxRemove" class="wide">Remover efeito da cena</button>
      <p class="vfx-help">Selecione uma peça ou criatura na viewport e adicione o efeito. Ele será anexado ao objeto selecionado e acompanhará sua transformação. Para testar, escolha um efeito e reproduza.</p>
      <div id="vfxStatus" role="status">Carregando biblioteca sob demanda.</div>
      <a href="https://patch-gg.github.io/pixelfx/" target="_blank" rel="noopener">Abrir galeria completa do PixelFX ↗</a>
    </div>`;
  const style = document.createElement("style");
  style.textContent = `
    #vfxStudioPanel{position:fixed;z-index:90;top:74px;right:14px;width:min(360px,calc(100vw - 24px));max-height:calc(100dvh - 90px);overflow:auto;background:#182438;color:#eef5ff;border:1px solid #40556d;border-radius:15px;box-shadow:0 20px 65px #000b;font:13px system-ui;display:none}
    #vfxStudioPanel.open{display:block}.vfx-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;padding:13px 15px;background:#101b2b;border-bottom:1px solid #31445c}.vfx-head strong{display:block;letter-spacing:.1em}.vfx-head small{display:block;color:#9bb0c8;font-size:11px;margin-top:3px}.vfx-head button{padding:6px 10px}.vfx-body{padding:14px}.vfx-body label{display:block;color:#9bb0c8;font-size:12px;margin:10px 0 4px}.vfx-body select{width:100%;padding:9px;background:#202f45;color:#eef5ff;border:1px solid #31445c;border-radius:8px}.vfx-preview{height:190px;margin:12px 0;background:repeating-conic-gradient(#243449 0% 25%,#1b293c 0% 50%) 50%/18px 18px;border:1px solid #40556d;border-radius:10px;display:grid;place-items:center;overflow:hidden}.vfx-preview canvas{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}.vfx-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.vfx-body button{padding:9px 10px;background:#202f45;color:#eef5ff;border:1px solid #40556d;border-radius:8px}.vfx-body button.primary{background:#64d5bd;color:#06231f;border:0;font-weight:800}.vfx-body .wide{width:100%;margin-top:7px}.vfx-help{font-size:11px;line-height:1.45;color:#a9bbce}.vfx-body #vfxStatus{min-height:28px;padding:8px 0;color:#64d5bd;font-size:11px}.vfx-body a{color:#8de4d3;font-size:12px}@media(max-width:760px){#vfxStudioPanel{top:max(64px,env(safe-area-inset-top));right:8px;width:min(340px,calc(100vw - 16px));max-height:calc(100dvh - 72px)}}
  `;
  document.head.append(style);
  document.body.append(panel);
  canvas = $("vfxPreview"); ctx = canvas.getContext("2d", { willReadFrequently: true });
  const category = $("vfxCategory"), effectSelect = $("vfxEffect"), status = $("vfxStatus");
  const categories = [...new Set(EFFECTS.map(row => row[0]))];
  category.innerHTML = categories.map(name => `<option>${name}</option>`).join("");
  function fillEffects() {
    const rows = EFFECTS.filter(row => row[0] === category.value);
    effectSelect.innerHTML = rows.map(row => `<option value="${row[1]}">${row[2]}</option>`).join("");
    loadEffect(effectSelect.value);
  }
  async function core() {
    if (!corePromise) corePromise = import(CORE_URL);
    return corePromise;
  }
  function clearSprite() {
    if (sprite) { sprite.parent?.remove(sprite); sprite.material?.map?.dispose(); sprite.material?.dispose(); sprite = null; texture = null; }
  }
  async function loadEffect(id) {
    if (!id) return;
    status.textContent = "Carregando " + id + "…";
    try {
      const [api, mod] = await Promise.all([core(), import(CDN + id + ".js")]);
      activeModule = mod; activeId = id;
      const [w,h] = mod.meta?.size || [128,96];
      frame = api.createFrame(w,h,...(mod.meta?.origin || [0,0]));
      imageData = new ImageData(w,h);
      canvas.width = w; canvas.height = h;
      activeFx = api.createFx(mod, { x: w/2, y: h/2 });
      renderFrame(api);
      status.textContent = (mod.meta?.name || id) + " • " + (mod.meta?.loop ? "loop" : "animação única") + " • " + w + "×" + h;
      lastTime = 0;
    } catch (error) {
      status.textContent = "Não foi possível carregar o efeito: " + String(error?.message || error).slice(0,180);
      console.error("PixelFX load failed", error);
    }
  }
  async function renderFrame(api) {
    if (!activeFx || !frame) return;
    api.clearFrame(frame);
    activeFx.draw(frame);
    api.composite(frame, imageData.data, null);
    ctx.putImageData(imageData,0,0);
    if (texture) texture.needsUpdate = true;
  }
  function restart() {
    if (!activeModule || !frame) return;
    core().then(api => { const [w,h]=activeModule.meta?.size||[128,96]; activeFx=api.createFx(activeModule,{x:w/2,y:h/2}); lastTime=0; renderFrame(api); });
  }
  function addToModel() {
    if (!activeModule || !frame) { status.textContent = "Escolha um efeito primeiro."; return; }
    const target = getSelected?.();
    if (!target) { status.textContent = "Selecione uma peça ou criatura na viewport antes de adicionar o efeito."; return; }
    clearSprite();
    const [w,h] = activeModule.meta?.size || [128,96];
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
    const material = new THREE.SpriteMaterial({ map:texture, transparent:true, depthWrite:false, sizeAttenuation:true });
    sprite = new THREE.Sprite(material);
    sprite.name = "PixelFX_" + activeId.replace(/[^a-z0-9_-]/gi,"_");
    const bounds = new THREE.Box3().setFromObject(target);
    const center = bounds.isEmpty() ? target.getWorldPosition(new THREE.Vector3()) : bounds.getCenter(new THREE.Vector3());
    target.add(sprite);
    sprite.position.copy(target.worldToLocal(center.clone()));
    const worldHeight = Math.max(.45, bounds.isEmpty() ? 1 : bounds.getSize(new THREE.Vector3()).y * .65);
    const ratio = w / Math.max(1,h);
    sprite.scale.set(worldHeight * ratio, worldHeight, 1);
    status.textContent = "Efeito anexado ao objeto selecionado. Ele acompanha a transformação do objeto.";
    onStatus("PixelFX anexado: " + (activeModule.meta?.name || activeId) + ".");
  }
  function removeFromScene() { clearSprite(); status.textContent = "Efeito removido da cena."; }
  function open() { closed=false; panel.classList.add("open"); }
  function close() { closed=true; panel.classList.remove("open"); }
  $("vfxClose").addEventListener("click",close);
  category.addEventListener("change",fillEffects);
  effectSelect.addEventListener("change",()=>loadEffect(effectSelect.value));
  $("vfxPlay").addEventListener("click",restart);
  $("vfxAdd").addEventListener("click",addToModel);
  $("vfxRemove").addEventListener("click",removeFromScene);
  fillEffects();
  return {
    open, close, toggle(){closed?open():close();},
    update(dt) {
      if (!activeFx || !frame || !ctx || closed) return;
      const apiPromise = core();
      apiPromise.then(async api => {
        if (!activeFx || closed) return;
        const step = Math.min(.05, Math.max(0, dt || 0));
        activeFx.update(step);
        await renderFrame(api);
        if (sprite && texture) texture.needsUpdate = true;
      }).catch(error=>{status.textContent="Erro na reprodução: "+String(error?.message||error).slice(0,150)});
    },
    dispose(){clearSprite();panel.remove();style.remove();}
  };
}
