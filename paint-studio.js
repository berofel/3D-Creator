/* Berofel 3D Create — Paint Studio
 * UV texture painting for selected Mesh/SkinnedMesh.
 * Keeps geometry, UVs, skeleton, skin weights and animation untouched.
 * Paint layers expose Blob export hooks for the future IndexedDB project store.
 */
export function createPaintStudio({THREE,getSelected,onStatus}){
 const state={active:false,color:"#d8a36b",radius:18,opacity:1,eraser:false,records:new WeakMap(),lastError:""};
 const say=message=>{if(typeof onStatus==="function")onStatus(message)};
 const resolveMeshes=()=>{
  const selected=getSelected?.();if(!selected)return[];
  const found=[];if(selected.isMesh)found.push(selected);else selected.traverse?.(o=>{if(o.isMesh&&o.geometry?.attributes?.uv)found.push(o)});
  return found.filter(mesh=>mesh.geometry?.attributes?.uv);
 };
 function materialFor(mesh){
  const source=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
  if(!source)throw new Error("A malha selecionada não possui material.");
  if(!mesh.userData.berofelPaintMaterials){
   const originals=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   const clones=originals.map(m=>m?.clone?.()||m);
   mesh.material=Array.isArray(mesh.material)?clones:clones[0];
   mesh.userData.berofelPaintMaterials=true;
  }
  return Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 }
 function ensure(mesh){
  let record=state.records.get(mesh);if(record)return record;
  const material=materialFor(mesh),size=1024,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d",{willReadFrequently:false});ctx.clearRect(0,0,size,size);
  const base=document.createElement("canvas");base.width=size;base.height=size;const bctx=base.getContext("2d");
  if(material.map?.image){try{bctx.drawImage(material.map.image,0,0,size,size);ctx.drawImage(material.map.image,0,0,size,size)}catch{ctx.fillStyle="#"+material.color.getHexString();ctx.fillRect(0,0,size,size);bctx.drawImage(canvas,0,0)}}
  else{const color=material.color?.getStyle?.()||"#ffffff";ctx.fillStyle=color;ctx.fillRect(0,0,size,size);bctx.fillStyle=color;bctx.fillRect(0,0,size,size)}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=material.map?.flipY??true;texture.wrapS=material.map?.wrapS??THREE.ClampToEdgeWrapping;texture.wrapT=material.map?.wrapT??THREE.ClampToEdgeWrapping;texture.anisotropy=8;
  material.map=texture;material.needsUpdate=true;
  record={canvas,ctx,base,texture,material,mesh,version:1,dirty:false};
  mesh.userData.berofelPaintLayer={schema:"berofel.paint-layer",version:1,width:size,height:size,uvChannel:0,storage:"canvas-texture",dirty:false};
  state.records.set(mesh,record);return record;
 }
 function stamp(hit){
  if(!hit?.object?.isMesh||!hit.uv)return false;
  const mesh=hit.object;if(!resolveMeshes().includes(mesh))return false;
  const r=ensure(mesh),x=Math.max(0,Math.min(1023,hit.uv.x*1024)),y=Math.max(0,Math.min(1023,(1-hit.uv.y)*1024)),radius=Math.max(1,state.radius);
  if(state.eraser){r.ctx.save();r.ctx.beginPath();r.ctx.arc(x,y,radius,0,Math.PI*2);r.ctx.clip();r.ctx.clearRect(x-radius,y-radius,radius*2,radius*2);r.ctx.drawImage(r.base,x-radius,y-radius,radius*2,radius*2,x-radius,y-radius,radius*2,radius*2);r.ctx.restore()}
  else{r.ctx.save();r.ctx.globalAlpha=state.opacity;r.ctx.fillStyle=state.color;r.ctx.beginPath();r.ctx.arc(x,y,radius,0,Math.PI*2);r.ctx.fill();r.ctx.restore()}
  r.texture.needsUpdate=true;r.dirty=true;r.version++;mesh.userData.berofelPaintLayer.dirty=true;return true;
 }
 function setActive(value){state.active=!!value;say(state.active?"Pintura ativa: clique ou arraste sobre a superfície do modelo selecionado.":"Modo de pintura fechado.");return state.active}
 function setColor(value){if(/^#[0-9a-f]{6}$/i.test(value))state.color=value;state.eraser=false}
 function setRadius(value){state.radius=Math.max(1,Math.min(160,Number(value)||18))}
 function setOpacity(value){state.opacity=Math.max(.05,Math.min(1,Number(value)||1))}
 function setEraser(value){state.eraser=!!value}
 async function applyImage(file){
  if(!file||!/^image\/(png|jpeg|webp)$/i.test(file.type))throw new Error("Escolha uma imagem PNG, JPG ou WebP.");
  const meshes=resolveMeshes();if(!meshes.length)throw new Error("Selecione uma malha com coordenadas UV antes de importar a textura.");
  const url=URL.createObjectURL(file);
  try{const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("Não foi possível ler a imagem."));img.src=url});
   for(const mesh of meshes){const r=ensure(mesh);r.ctx.clearRect(0,0,1024,1024);r.ctx.drawImage(image,0,0,1024,1024);r.texture.needsUpdate=true;r.dirty=true;r.version++;mesh.userData.berofelPaintLayer.dirty=true}
   say("Textura aplicada em "+meshes.length+" malha(s). A imagem foi ajustada ao espaço UV completo.");
  }finally{URL.revokeObjectURL(url)}
 }
 async function exportLayer(mesh){
  const r=state.records.get(mesh);if(!r)return null;
  const blob=await new Promise(resolve=>r.canvas.toBlob(resolve,"image/png"));
  return blob?{blob,width:1024,height:1024,version:r.version,meshName:mesh.name||"malha"}:null;
 }
 function getStatus(){return {active:state.active,color:state.color,radius:state.radius,opacity:state.opacity,eraser:state.eraser,paintedMeshes:resolveMeshes().filter(m=>state.records.has(m)).length}}
 return {isActive:()=>state.active,setActive,setColor,setRadius,setOpacity,setEraser,paintAt:stamp,applyImage,exportLayer,getStatus};
}
