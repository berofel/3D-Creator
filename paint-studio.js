/* Berofel 3D Create — Paint Studio
 * UV texture painting for selected Mesh/SkinnedMesh.
 * Geometry shape, skeleton, skin weights and animation remain unchanged.
 * If a mesh has no UV channel, a fallback planar UV channel is generated on a cloned geometry.
 */
export function createPaintStudio({THREE,getSelected,getPaintTargets,onStatus}){
 const state={active:false,color:"#d8a36b",radius:18,opacity:1,eraser:false,records:new WeakMap(),lastError:""};
 const say=message=>{if(typeof onStatus==="function")onStatus(message)};
 function ensureUV(mesh){
  if(!mesh?.isMesh||!mesh.geometry?.attributes?.position)return false;
  if(mesh.geometry.attributes.uv)return true;
  try{
   const geometry=mesh.geometry.clone(),position=geometry.attributes.position;
   const bounds=new THREE.Box3().setFromBufferAttribute(position),size=bounds.getSize(new THREE.Vector3());
   const axes=[{axis:0,size:size.x},{axis:1,size:size.y},{axis:2,size:size.z}].sort((a,b)=>b.size-a.size);
   const uAxis=axes[0].axis,vAxis=axes[1].axis;
   const min=[bounds.min.x,bounds.min.y,bounds.min.z],extent=[size.x,size.y,size.z];
   const uv=new Float32Array(position.count*2);
   for(let i=0;i<position.count;i++){
    const values=[position.getX(i),position.getY(i),position.getZ(i)];
    uv[i*2]=(values[uAxis]-min[uAxis])/Math.max(extent[uAxis],1e-6);
    uv[i*2+1]=(values[vAxis]-min[vAxis])/Math.max(extent[vAxis],1e-6);
   }
   geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
   mesh.geometry=geometry;
   mesh.userData.berofelGeneratedPaintUV=true;
   return true;
  }catch(error){
   state.lastError=String(error?.message||error);
   return false;
  }
 }
 function prepareMeshes(meshes){
  return (Array.isArray(meshes)?meshes:[]).filter(mesh=>mesh?.isMesh&&ensureUV(mesh));
 }
 function resolveMeshes(){
  const supplied=getPaintTargets?.();
  if(Array.isArray(supplied))return prepareMeshes(supplied);
  const selected=getSelected?.();if(!selected)return[];
  const found=[];if(selected.isMesh)found.push(selected);else selected.traverse?.(o=>{if(o.isMesh)found.push(o)});
  return prepareMeshes(found);
 }
 function materialsFor(mesh){
  if(!mesh.userData.berofelPaintMaterials){
   const originals=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   const clones=originals.map(material=>material?.clone?.()||material);
   mesh.material=Array.isArray(mesh.material)?clones:clones[0];
   mesh.userData.berofelPaintMaterials=true;
  }
  return Array.isArray(mesh.material)?mesh.material:[mesh.material];
 }
 function ensure(mesh,materialIndex=0){
  if(!ensureUV(mesh))throw new Error("Esta malha não possui uma superfície UV utilizável.");
  const materials=materialsFor(mesh);
  const index=Math.max(0,Math.min(materials.length-1,Number(materialIndex)||0));
  const material=materials[index];
  if(!material)throw new Error("A superfície selecionada não possui material.");
  let map=state.records.get(mesh);
  if(!map){map=new Map();state.records.set(mesh,map)}
  if(map.has(index))return map.get(index);
  const size=1024,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext("2d",{willReadFrequently:false});
  const base=document.createElement("canvas");base.width=size;base.height=size;
  const bctx=base.getContext("2d");
  if(material.map?.image){
   try{bctx.drawImage(material.map.image,0,0,size,size);ctx.drawImage(material.map.image,0,0,size,size)}
   catch{const color=material.color?.getStyle?.()||"#ffffff";ctx.fillStyle=color;ctx.fillRect(0,0,size,size);bctx.drawImage(canvas,0,0)}
  }else{
   const color=material.color?.getStyle?.()||"#ffffff";
   ctx.fillStyle=color;ctx.fillRect(0,0,size,size);
   bctx.fillStyle=color;bctx.fillRect(0,0,size,size);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.flipY=material.map?.flipY??true;
  texture.wrapS=material.map?.wrapS??THREE.ClampToEdgeWrapping;
  texture.wrapT=material.map?.wrapT??THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  material.map=texture;material.needsUpdate=true;
  const record={canvas,ctx,base,texture,material,mesh,materialIndex:index,version:1,dirty:false};
  map.set(index,record);
  const layers=mesh.userData.berofelPaintLayers||(mesh.userData.berofelPaintLayers={});
  layers[index]={schema:"berofel.paint-layer",version:1,width:size,height:size,uvChannel:0,materialIndex:index,storage:"canvas-texture",dirty:false};
  if(!mesh.userData.berofelPaintLayer)mesh.userData.berofelPaintLayer=layers[index];
  return record;
 }
 function stamp(hit){
  if(!hit?.object?.isMesh||!hit.uv)return false;
  const mesh=hit.object;
  if(!resolveMeshes().includes(mesh))return false;
  const materialIndex=Array.isArray(mesh.material)?(hit.face?.materialIndex||0):0;
  const r=ensure(mesh,materialIndex);
  const x=Math.max(0,Math.min(1023,hit.uv.x*1024));
  const y=Math.max(0,Math.min(1023,(1-hit.uv.y)*1024));
  const radius=Math.max(1,state.radius);
  if(state.eraser){
   r.ctx.save();r.ctx.beginPath();r.ctx.arc(x,y,radius,0,Math.PI*2);r.ctx.clip();
   r.ctx.drawImage(r.base,0,0);r.ctx.restore();
  }else{
   r.ctx.save();r.ctx.globalAlpha=state.opacity;r.ctx.fillStyle=state.color;
   r.ctx.beginPath();r.ctx.arc(x,y,radius,0,Math.PI*2);r.ctx.fill();r.ctx.restore();
  }
  r.texture.needsUpdate=true;r.dirty=true;r.version++;
  const layers=mesh.userData.berofelPaintLayers||{};
  if(layers[materialIndex]){layers[materialIndex].dirty=true;layers[materialIndex].version=r.version}
  if(mesh.userData.berofelPaintLayer===layers[materialIndex])mesh.userData.berofelPaintLayer.dirty=true;
  return true;
 }
 function setActive(value){
  state.active=!!value;
  say(state.active?"Pintura ativa: toque para pintar, arraste para fazer traços e segure por 1 segundo para selecionar um bloco.":"Modo de pintura fechado.");
  return state.active;
 }
 function setColor(value){if(/^#[0-9a-f]{6}$/i.test(value))state.color=value;state.eraser=false}
 function setRadius(value){state.radius=Math.max(1,Math.min(160,Number(value)||18))}
 function setOpacity(value){state.opacity=Math.max(.05,Math.min(1,Number(value)||1))}
 function setEraser(value){state.eraser=!!value}
 async function applyImage(file){
  if(!file||!/^image\/(png|jpeg|webp)$/i.test(file.type))throw new Error("Escolha uma imagem PNG, JPG ou WebP.");
  const meshes=resolveMeshes();if(!meshes.length)throw new Error("Selecione uma malha com UV antes de importar a textura.");
  const url=URL.createObjectURL(file);
  try{
   const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("Não foi possível ler a imagem."));img.src=url});
   let count=0;
   for(const mesh of meshes){
    const materials=materialsFor(mesh);
    for(let i=0;i<materials.length;i++){
     if(!materials[i])continue;
     const r=ensure(mesh,i);
     r.ctx.clearRect(0,0,1024,1024);r.ctx.drawImage(image,0,0,1024,1024);
     const bctx=r.base.getContext("2d");bctx.clearRect(0,0,1024,1024);bctx.drawImage(image,0,0,1024,1024);
     r.texture.needsUpdate=true;r.dirty=true;r.version++;
     const layer=mesh.userData.berofelPaintLayers?.[i];if(layer){layer.dirty=true;layer.version=r.version}
     count++;
    }
   }
   say("Imagem aplicada em "+count+" superfície(s) de material.");
  }finally{URL.revokeObjectURL(url)}
 }
 async function exportLayer(mesh,materialIndex){
  const map=state.records.get(mesh);if(!map)return null;
  const record=materialIndex===undefined?(map.values().next().value):map.get(materialIndex);
  if(!record)return null;
  const blob=await new Promise(resolve=>record.canvas.toBlob(resolve,"image/png"));
  return blob?{blob,width:1024,height:1024,version:record.version,meshName:mesh.name||"malha",materialIndex:record.materialIndex}:null;
 }
 function getStatus(){
  let painted=0;
  for(const mesh of resolveMeshes()){const map=state.records.get(mesh);if(map&&map.size)painted++}
  return {active:state.active,color:state.color,radius:state.radius,opacity:state.opacity,eraser:state.eraser,paintedMeshes:painted};
 }
 return {isActive:()=>state.active,setActive,setColor,setRadius,setOpacity,setEraser,paintAt:stamp,applyImage,exportLayer,getStatus,prepareMeshes,getPaintTargets:resolveMeshes};
}
