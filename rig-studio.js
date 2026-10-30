export function createRigStudio({THREE,scene,transform,getSelected,say}) {
  const $ = id => document.getElementById(id);
  const state = { root:null, helper:null, bones:[], selected:null, target:null };
  const presets = {
    feline: {label:"Felino / quadrúpede", bones:[
      ["Root",null,[0,0,0]],["Coluna",0,[0,.85,0]],["Peito",1,[0,.25,.45]],["Pescoço",2,[0,.08,.42]],["Cabeça",3,[0,.02,.34]],["Quadril",1,[0,-.08,-.48]],["Cauda_01",5,[0,.05,-.42]],["Cauda_02",6,[0,0,-.42]],
      ["Ombro_E",2,[-.28,-.12,.12]],["Braço_E",8,[0,-.42,.02]],["Pata_E",9,[0,-.40,.02]],["Ombro_D",2,[.28,-.12,.12]],["Braço_D",11,[0,-.42,.02]],["Pata_D",12,[0,-.40,.02]],
      ["Quadril_E",5,[-.25,-.10,-.08]],["Coxa_E",14,[0,-.42,-.04]],["Canela_E",15,[0,-.42,.02]],["Quadril_D",5,[.25,-.10,-.08]],["Coxa_D",17,[0,-.42,-.04]],["Canela_D",18,[0,-.42,.02]]
    ]},
    biped: {label:"Bípede", bones:[["Root",null,[0,0,0]],["Quadril",0,[0,.9,0]],["Coluna",1,[0,.45,0]],["Peito",2,[0,.4,0]],["Pescoço",3,[0,.3,0]],["Cabeça",4,[0,.22,0]],["Ombro_E",3,[-.35,.12,0]],["Braço_E",6,[-.32,-.08,0]],["Mão_E",7,[-.28,-.05,0]],["Ombro_D",3,[.35,.12,0]],["Braço_D",9,[.32,-.08,0]],["Mão_D",10,[.28,-.05,0]],["Coxa_E",1,[-.18,-.4,0]],["Canela_E",12,[0,-.48,0]],["Pé_E",13,[0,-.42,.12]],["Coxa_D",1,[.18,-.4,0]],["Canela_D",15,[0,-.48,0]],["Pé_D",16,[0,-.42,.12]]]},
    bird: {label:"Ave", bones:[["Root",null,[0,0,0]],["Coluna",0,[0,.35,0]],["Peito",1,[0,.2,.25]],["Pescoço",2,[0,.12,.32]],["Cabeça",3,[0,.05,.25]],["Asa_E",2,[-.35,.08,0]],["Asa_E_Ponta",5,[-.48,0,0]],["Asa_D",2,[.35,.08,0]],["Asa_D_Ponta",7,[.48,0,0]],["Quadril_E",1,[-.15,-.2,-.1]],["Perna_E",9,[0,-.35,0]],["Pé_E",10,[0,-.25,.08]],["Quadril_D",1,[.15,-.2,-.1]],["Perna_D",12,[0,-.35,0]],["Pé_D",13,[0,-.25,.08]],["Cauda",1,[0,0,-.35]]]},
    dragon: {label:"Dragão", bones:[["Root",null,[0,0,0]],["Coluna",0,[0,.7,0]],["Peito",1,[0,.15,.4]],["Pescoço",2,[0,.08,.4]],["Cabeça",3,[0,0,.32]],["Quadril",1,[0,0,-.42]],["Cauda_01",5,[0,0,-.38]],["Cauda_02",6,[0,0,-.38]],["Asa_E",2,[-.3,.12,0]],["Asa_E_Ponta",8,[-.55,0,-.08]],["Asa_D",2,[.3,.12,0]],["Asa_D_Ponta",10,[.55,0,-.08]],["Perna_E",5,[-.2,-.35,-.05]],["Canela_E",12,[0,-.35,0]],["Perna_D",5,[.2,-.35,-.05]],["Canela_D",14,[0,-.35,0]]]}
  };
  function clearRig(){
    if(state.root?.parent) state.root.parent.remove(state.root);
    state.root=null; state.helper=null; state.bones=[]; state.selected=null; state.target=null;
    if(transform) transform.detach();
    renderTree(); $("rigStudioStatus").textContent="Rig removido. O modelo e suas malhas permanecem intactos.";
  }
  function attachTarget(){
    const chosen=getSelected?.();
    if(!chosen) throw new Error("Selecione primeiro o modelo ou a criatura na viewport.");
    return chosen;
  }
  function rebuildHelper(){
    if(state.helper && state.helper.parent) state.helper.parent.remove(state.helper);
    if(state.root){state.helper=new THREE.SkeletonHelper(state.root);state.helper.name="RigStudio_Visualizacao";state.helper.material.color.set(0x19d3b0);state.helper.material.depthTest=false;state.helper.renderOrder=20;scene.add(state.helper);}
  }
  function selectBone(bone){
    state.selected=bone;
    if(transform){transform.attach(bone);transform.setMode("translate");}
    renderTree();
    $("rigStudioStatus").textContent="Osso selecionado: "+bone.name+". Use Mover/Girar/Escalar na barra principal.";
  }
  function renderTree(){
    const box=$("rigBoneList");if(!box)return;box.replaceChildren();
    for(const bone of state.bones){const b=document.createElement("button");b.type="button";b.className="part"+(bone===state.selected?" active":"");b.textContent=(bone.parent?.isBone?"↳ ":"")+bone.name;b.onclick=()=>selectBone(bone);box.append(b);}
    $("rigBoneCount").textContent=state.bones.length+" ossos";
  }
  function makeBone(name,parent,position){
    const bone=new THREE.Bone();bone.name=name;bone.position.set(...position);bone.userData.rigStudioBone=true;bone.userData.limits={min:-180,max:180};
    if(parent)parent.add(bone);state.bones.push(bone);return bone;
  }
  function createFromPreset(key){
    const target=attachTarget();clearRig();state.target=target;
    state.root=new THREE.Group();state.root.name="RigStudio_"+key;state.root.userData.berofelRigStudio=true;target.add(state.root);
    const map=[];
    for(const [name,parent,pos] of presets[key].bones){map.push(makeBone(name,parent===null?state.root:map[parent],pos));}
    rebuildHelper();selectBone(map[0]);say("Preset "+presets[key].label+" criado. Ajuste os ossos manualmente; a malha original não foi deformada.");
  }
  function addBone(){
    if(!state.root){createFromPreset("feline");return;}
    const parent=state.selected||state.bones[0];
    const bone=makeBone("Osso_"+(state.bones.length+1),parent,[0,.35,0]);rebuildHelper();selectBone(bone);
  }
  function mirrorSelected(){
    const source=state.selected;if(!source)return;
    const parent=source.parent?.isBone?source.parent:state.root;
    const cloneBranch=(src,dstParent)=>{
      const copy=makeBone(src.name.replace(/_E$|_D$/,"")+(src.name.endsWith("_E")?"_D":"_E"),dstParent,[-src.position.x,src.position.y,src.position.z]);
      copy.rotation.set(src.rotation.x,-src.rotation.y,-src.rotation.z);copy.scale.copy(src.scale);
      for(const child of src.children)if(child.isBone)cloneBranch(child,copy);
      return copy;
    };
    const copy=cloneBranch(source,parent);rebuildHelper();selectBone(copy);
  }
  function deleteSelected(){
    const bone=state.selected;if(!bone||bone===state.bones[0])return;
    const remove=[];bone.traverse(n=>{if(n.isBone)remove.push(n)});
    bone.parent?.remove(bone);state.bones=state.bones.filter(b=>!remove.includes(b));rebuildHelper();selectBone(state.bones[0]||null);
  }
  function renameSelected(){
    if(!state.selected)return;const value=$("rigBoneName").value.trim();if(value)state.selected.name=value;renderTree();
  }
  function exportData(){
    return {format:"BerofelRigStudio",version:1,preset:$("rigPreset").value,bones:state.bones.map(b=>({name:b.name,parent:b.parent?.isBone?b.parent.name:null,position:b.position.toArray(),rotation:[b.rotation.x,b.rotation.y,b.rotation.z],limits:b.userData.limits||{min:-180,max:180}}))};
  }
  $("rigCreatePreset").onclick=()=>{try{createFromPreset($("rigPreset").value)}catch(e){say(e.message)}};
  $("rigAddBone").onclick=addBone;$("rigMirrorBone").onclick=mirrorSelected;$("rigDeleteBone").onclick=deleteSelected;$("rigRenameBone").onclick=renameSelected;
  $("rigBoneName").addEventListener("change",renameSelected);
  $("rigSaveJson").onclick=()=>{if(!state.root){say("Crie um rig antes de exportar.");return;}const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="berofel-rig.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);};
  $("rigClear").onclick=clearRig;
  $("rigRotateMode").onclick=()=>{if(state.selected&&transform)transform.setMode("rotate")};
  $("rigMoveMode").onclick=()=>{if(state.selected&&transform)transform.setMode("translate")};
  $("rigStudioStatus").textContent="Escolha um preset ou crie um esqueleto manualmente. Selecione uma criatura antes de iniciar.";
  return {clear:clearRig,getState:()=>state,exportData};
}
