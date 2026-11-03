// Berofel 3D Create — Hybrid VFX Lab
// Original preview inspired by PixelFX's pixel-art VFX workflow.
// No PixelFX source or assets are copied; all artwork below is generated locally.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

(() => {
  const style=document.createElement("style");
  style.textContent=`
  #bero-vfx-launch{position:fixed;left:14px;bottom:14px;z-index:90;border:1px solid #4b7184;background:#102638ee;color:#eaf8ff;border-radius:10px;padding:10px 13px;font:700 12px system-ui;box-shadow:0 8px 24px #0007}
  #bero-vfx-panel{position:fixed;inset:5vh 4vw;z-index:100;display:none;grid-template-rows:auto minmax(0,1fr) auto;background:#091522f5;border:1px solid #35536b;border-radius:16px;box-shadow:0 25px 90px #000c;overflow:hidden;color:#eaf4ff;font:13px system-ui}
  #bero-vfx-panel.open{display:grid}
  #bero-vfx-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 15px;background:#122338;border-bottom:1px solid #29435b}
  #bero-vfx-head strong{font-size:13px;letter-spacing:.08em}
  #bero-vfx-head small{display:block;color:#9bb4c9;font-weight:400;margin-top:3px}
  #bero-vfx-stage{position:relative;min-height:220px;background:radial-gradient(ellipse at 50% 58%,#233a4b 0%,#0d1928 54%,#070f1a 100%)}
  #bero-vfx-stage canvas{display:block;width:100%;height:100%}
  #bero-vfx-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 14px;border-top:1px solid #29435b;background:#101e2f}
  #bero-vfx-controls button,#bero-vfx-controls select,#bero-vfx-close{border:1px solid #3a566f;background:#1b3046;color:#eaf4ff;border-radius:8px;padding:8px 11px;font:inherit}
  #bero-vfx-controls button.primary{background:#65d8c0;color:#09231f;border:0;font-weight:800}
  #bero-vfx-note{margin-left:auto;color:#9bb4c9;font-size:11px}
  @media(max-width:650px){#bero-vfx-panel{inset:3vh 3vw}#bero-vfx-note{width:100%;margin-left:0}}
  `;
  document.head.append(style);
  const launch=document.createElement("button");launch.id="bero-vfx-launch";launch.textContent="✦ VFX LAB";
  const panel=document.createElement("section");panel.id="bero-vfx-panel";panel.innerHTML=`
    <header id="bero-vfx-head"><div><strong>BEROFEL · HYBRID VFX LAB</strong><small>Sprite pixelado + geometria 3D + partículas + luz</small></div><button id="bero-vfx-close" aria-label="Fechar">Fechar ✕</button></header>
    <div id="bero-vfx-stage"></div>
    <footer id="bero-vfx-controls">
      <label for="bero-vfx-kind">Efeito</label>
      <select id="bero-vfx-kind"><option value="fire">Orbe de fogo</option><option value="arcane">Explosão arcana</option><option value="ice">Impacto glacial</option></select>
      <button class="primary" id="bero-vfx-play">Reproduzir</button><button id="bero-vfx-restart">Reiniciar</button><button id="bero-vfx-pause">Pausar</button>
      <span id="bero-vfx-note">Prévia visual — não altera modelos nem animações existentes.</span>
    </footer>`;
  document.body.append(launch,panel);
  const stage=panel.querySelector("#bero-vfx-stage");
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,3.1,8.4);camera.lookAt(0,1.1,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.append(renderer.domElement);
  scene.add(new THREE.AmbientLight(0x8ba9c5,.8));
  const key=new THREE.PointLight(0xff7138,4,12);key.position.set(0,2,1);scene.add(key);
  const rim=new THREE.PointLight(0x3d8fff,2.2,10);rim.position.set(-3,2,-2);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2.7,64),new THREE.MeshBasicMaterial({color:0x14293a,transparent:true,opacity:.6}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
  const grid=new THREE.GridHelper(8,32,0x34536a,0x1c3448);grid.position.y=0;grid.material.transparent=true;grid.material.opacity=.25;scene.add(grid);
  const group=new THREE.Group();scene.add(group);
  const spriteGroup=new THREE.Group();scene.add(spriteGroup);
  const pixelCanvas=document.createElement("canvas");pixelCanvas.width=64;pixelCanvas.height=64;
  const ctx=pixelCanvas.getContext("2d");
  const texture=new THREE.CanvasTexture(pixelCanvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
  const spriteMat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const sprite=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.8),spriteMat);sprite.position.set(0,1.15,.05);spriteGroup.add(sprite);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,1),new THREE.MeshStandardMaterial({color:0xff6a28,emissive:0xff3b08,emissiveIntensity:2.2,roughness:.32,metalness:.12}));
  core.position.set(0,1.15,0);group.add(core);
  const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,1),new THREE.MeshBasicMaterial({color:0xffe8a1}));inner.position.copy(core.position);group.add(inner);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.035,8,64),new THREE.MeshBasicMaterial({color:0xff9a48,transparent:true,opacity:.85}));
  ring.rotation.x=Math.PI/2;ring.position.y=.12;group.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.25,.018,6,64),new THREE.MeshBasicMaterial({color:0x63d9ff,transparent:true,opacity:.7}));
  ring2.rotation.x=Math.PI/2;ring2.position.y=.1;group.add(ring2);
  const particleGeo=new THREE.TetrahedronGeometry(.07,0);
  const particles=[];
  for(let i=0;i<52;i++){const m=new THREE.Mesh(particleGeo,new THREE.MeshBasicMaterial({color:0xffa34d,transparent:true,opacity:.9}));group.add(m);particles.push({mesh:m,seed:i*12.9898,speed:.45+(i%9)*.09,r:.45+(i%7)*.12});}
  const shards=[];
  for(let i=0;i<12;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),new THREE.MeshStandardMaterial({color:0x7bdfff,emissive:0x167db8,emissiveIntensity:1.4,transparent:true}));group.add(m);shards.push(m);}
  let kind="fire",playing=true,elapsed=0,last=performance.now(),raf=0;
  const palettes={fire:["#fff4b0","#ffd45a","#ff8b32","#ed3d16","#7d1e12"],arcane:["#fff0ff","#dba4ff","#a56bff","#6134c8","#24105f"],ice:["#ffffff","#baf3ff","#64d9ff","#238acb","#16416e"]};
  function paintSprite(t){
    const colors=palettes[kind];ctx.clearRect(0,0,64,64);
    const cx=32,cy=32,phase=t*5.5;
    const glow=ctx.createRadialGradient(cx,cy,2,cx,cy,29);glow.addColorStop(0,colors[0]);glow.addColorStop(.22,colors[1]);glow.addColorStop(.55,colors[2]);glow.addColorStop(1,"transparent");
    ctx.fillStyle=glow;ctx.fillRect(2,2,60,60);
    // Pixel-art silhouette: stepped flame / arcane burst / frost star.
    for(let i=0;i<9;i++){
      const a=i*Math.PI*2/9+phase*.12,r=17+Math.sin(phase+i)*3;
      const x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);
      ctx.fillStyle=colors[1+(i%3)];ctx.fillRect(x-2,y-3,5,7);
      ctx.fillStyle=colors[0];ctx.fillRect(x-1,y-2,2,3);
    }
    ctx.fillStyle=colors[0];ctx.fillRect(27,22,10,20);ctx.fillRect(22,27,20,10);
    ctx.fillRect(25,24,14,16);ctx.fillStyle=colors[1];ctx.fillRect(28,19,8,26);
    texture.needsUpdate=true;
  }
  function setKind(value){
    kind=value;const c=kind==="fire"?0xff6a28:kind==="arcane"?0xb276ff:0x55cfff;
    core.material.color.setHex(c);core.material.emissive.setHex(c);inner.material.color.setHex(kind==="fire"?0xffe8a1:kind==="arcane"?0xf4d6ff:0xe5fbff);
    ring.material.color.setHex(c);key.color.setHex(c);particles.forEach(p=>p.mesh.material.color.setHex(kind==="fire"?0xffa34d:kind==="arcane"?0xd2a0ff:0x9cecff));
    shards.forEach(m=>m.visible=kind==="ice"||kind==="arcane");elapsed=0;playing=true;
  }
  function update(dt){
    if(playing)elapsed+=dt;const t=elapsed,cycle=(t%3.4)/3.4;
    const charge=cycle<.48?cycle/.48:cycle<.62?1-(cycle-.48)/.14:Math.max(0,1-(cycle-.62)/.38);
    const burst=cycle>.48&&cycle<.82?Math.sin(Math.PI*(cycle-.48)/.34):0;
    const scale=.78+charge*.34+burst*.62;
    core.scale.setScalar(scale);inner.scale.setScalar(.8+charge*.25);
    core.rotation.set(t*.7,t*1.1,t*.45);inner.rotation.set(-t, t*.6,0);
    sprite.scale.setScalar(1+burst*.45+Math.sin(t*7)*.035);sprite.material.opacity=.62+charge*.28;
    sprite.rotation.z=Math.sin(t*1.5)*.08;paintSprite(t);
    ring.scale.setScalar(.65+burst*.9+charge*.2);ring.rotation.z=t*.7;
    ring2.scale.setScalar(.7+burst*1.2);ring2.rotation.z=-t*.5;
    key.intensity=1.2+charge*3.5+burst*5;
    particles.forEach((p,i)=>{const a=p.seed+t*(.8+(i%5)*.13),r=p.r+burst*(.7+(i%4)*.2);p.mesh.position.set(Math.cos(a)*r,1.15+Math.sin(a*1.7)*(.3+burst*.8),Math.sin(a)*r*.55);p.mesh.scale.setScalar(.55+((i%4)/4)+burst*.7);p.mesh.rotation.set(a,a*.7,t);});
    shards.forEach((m,i)=>{const a=i*Math.PI/6+t*.45,r=.65+burst*1.6;m.position.set(Math.cos(a)*r,1.15+Math.sin(a*2)*(.2+burst*.7),Math.sin(a)*r*.55);m.rotation.set(t+i,t*.7+i,0);m.scale.setScalar((kind==="ice"?.8:.55)+burst*.8);});
    if(cycle>.82&&playing&&t%3.4<dt)elapsed=Math.floor(t/3.4)*3.4;
  }
  function resize(){const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.04,(now-last)/1000);last=now;if(panel.classList.contains("open")){update(dt);renderer.render(scene,camera);}}
  launch.addEventListener("click",()=>{panel.classList.add("open");resize();elapsed=0;playing=true;});
  panel.querySelector("#bero-vfx-close").addEventListener("click",()=>panel.classList.remove("open"));
  panel.querySelector("#bero-vfx-kind").addEventListener("change",e=>setKind(e.target.value));
  panel.querySelector("#bero-vfx-play").addEventListener("click",()=>{playing=true;});
  panel.querySelector("#bero-vfx-pause").addEventListener("click",()=>{playing=false;});
  panel.querySelector("#bero-vfx-restart").addEventListener("click",()=>{elapsed=0;playing=true;});
  window.addEventListener("resize",resize);
  const observer=new ResizeObserver(resize);observer.observe(stage);
  setKind("fire");resize();requestAnimationFrame(loop);
  window.addEventListener("beforeunload",()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();texture.dispose();});
})();
