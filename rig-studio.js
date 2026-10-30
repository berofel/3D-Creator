export function createRigStudio({THREE,scene,transform,getSelected,say}) {
  const $ = id => document.getElementById(id);
  const state = { root:null, helper:null, visualRoot:null, visualParts:[], weightOverlays:[], bones:[], selected:null, target:null, showVisual:true, ownsRoot:false };
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
    if(state.helper?.parent)state.helper.parent.remove(state.helper);
    if(state.helper?.geometry)state.helper.geometry.dispose();
    if(state.helper?.material){if(Array.isArray(state.helper.material))state.helper.material.forEach(m=>m.dispose());else state.helper.material.dispose();}
    if(state.visualRoot?.parent)state.visualRoot.parent.remove(state.visualRoot);
    if(state.visualRoot){
      const geometries=new Set(),materials=new Set();
      state.visualRoot.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    }
    if(state.ownsRoot&&state.root?.parent) state.root.parent.remove(state.root);
    if(state.helper?.parent)state.helper.parent.remove(state.helper);
    state.root=null; state.ownsRoot=false; state.helper=null; if(state.visualRoot?.parent)state.visualRoot.parent.remove(state.visualRoot); state.visualRoot=null; state.visualParts=[]; state.bones=[]; state.selected=null; state.target=null; state.editingBone=false; state.placing=false;
    if(transform) transform.detach();
    $("rigPlaceBone")?.classList.remove("active-tool");
    renderTree(); $("rigStudioStatus").textContent="Rig removido. O modelo e suas malhas permanecem intactos.";
  }
  function inspectTarget(target=state.target){
    const info={meshes:0,skinnedMeshes:0,existingBones:0};
    if(target)target.traverse?.(o=>{if(o.isMesh)info.meshes++;if(o.isSkinnedMesh){info.skinnedMeshes++;info.existingBones+=o.skeleton?.bones?.length||0;}});
    return info;
  }
  function updateBindingStatus(){
    const info=inspectTarget();
    const status=$("rigBindingStatus");
    if(status)status.textContent=info.skinnedMeshes
      ? info.skinnedMeshes+" malha(s) já possuem skinning e "+info.existingBones+" osso(s) nativo(s). O rig visual criado aqui ainda não substitui nem altera esse esqueleto."
      : info.meshes+" malha(s) detectadas. Este rig é uma estrutura de pose visual; a deformação da malha ainda não foi vinculada.";
    return info;
  }
  function attachTarget(){
    const chosen=getSelected?.();
    if(!chosen) throw new Error("Selecione primeiro o modelo ou a criatura na viewport.");
    return chosen;
  }
  function rebuildHelper(){
    if(state.helper?.parent)state.helper.parent.remove(state.helper);
    if(state.helper?.geometry)state.helper.geometry.dispose();
    if(state.helper?.material){if(Array.isArray(state.helper.material))state.helper.material.forEach(m=>m.dispose());else state.helper.material.dispose();}
    if(state.visualRoot?.parent)state.visualRoot.parent.remove(state.visualRoot);
    if(state.visualRoot){
      const geometries=new Set(),materials=new Set();
      state.visualRoot.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    }
    state.visualParts=[];
    if(!state.root)return;
    state.helper=new THREE.SkeletonHelper(state.root);
    state.helper.name="RigStudio_Linhas";
    state.helper.material.color.set(0x8fffe6);
    state.helper.material.depthTest=false;
    state.helper.renderOrder=19;
    scene.add(state.helper);
    state.visualRoot=new THREE.Group();
    state.visualRoot.name="RigStudio_SilhuetaDosOssos";
    state.visualRoot.renderOrder=20;
    scene.add(state.visualRoot);
    const jointGeo=new THREE.SphereGeometry(.065,12,10);
    const boneGeo=new THREE.CylinderGeometry(.038,.052,1,10,1,false);
    for(const bone of state.bones){
      if(!bone.userData.berofelBoneId)bone.userData.berofelBoneId=makeStableId();
      const joint=new THREE.Mesh(jointGeo,new THREE.MeshBasicMaterial({color:0x36e0c1,depthTest:false}));
      joint.userData.rigBoneId=bone.userData.berofelBoneId;
      joint.renderOrder=21;state.visualRoot.add(joint);
      state.visualParts.push({mesh:joint,bone,kind:"joint"});
      for(const child of bone.children.filter(c=>c.isBone)){
        const segment=new THREE.Mesh(boneGeo,new THREE.MeshBasicMaterial({color:0x16b99e,depthTest:false}));
        segment.userData.rigBoneId=child.userData.berofelBoneId;
        segment.renderOrder=20;state.visualRoot.add(segment);
        state.visualParts.push({mesh:segment,bone:child,parentBone:bone,kind:"segment"});
      }
    }
    state.visualRoot.visible=state.showVisual;
    updateVisuals();
  }
  function makeStableId(){
    return "bone-"+(globalThis.crypto?.randomUUID?.()||("id-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10)));
  }
  function updateVisuals(){
    if(!state.visualRoot||!state.root)return;
    state.root.updateWorldMatrix(true,true);
    const up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),dir=new THREE.Vector3();
    for(const item of state.visualParts){
      const {mesh,bone,kind}=item;
      if(kind==="joint"){
        bone.getWorldPosition(a);mesh.position.copy(a);
        mesh.material.color.set(bone===state.selected?0xffc857:0x36e0c1);
        mesh.scale.setScalar(bone===state.selected?1.35:1);
      }else{
        bone.getWorldPosition(b);item.parentBone.getWorldPosition(a);dir.subVectors(b,a);
        const length=Math.max(.001,dir.length());
        mesh.position.copy(a).addScaledVector(dir,.5);
        mesh.quaternion.setFromUnitVectors(up,dir.normalize());
        mesh.scale.set(1,length,1);
        mesh.material.color.set(bone===state.selected?0xffc857:0x16b99e);
      }
    }
  }
  function getPickTargets(){return state.showVisual?state.visualParts.map(p=>p.mesh):[];}
  function selectFromIntersection(hit){
    const id=hit?.object?.userData?.rigBoneId;
    if(!id)return false;
    const bone=state.bones.find(b=>b.userData.berofelBoneId===id);
    if(!bone)return false;
    selectBone(bone);return true;
  }
  function selectBone(bone){
    state.selected=bone||null;
    state.editingBone=false;
    state.placing=false;
    if(transform) transform.detach();
    renderTree();
    $("rigStudioStatus").textContent=bone
      ? "Osso selecionado: "+bone.name+". O modelo continua livre para seleção e navegação. Use Mover osso ou Girar osso para editar."
      : "Nenhum osso selecionado.";
    $("rigPlaceBone").classList.remove("active-tool");
  }
  function setBoneTransform(mode){
    if(!state.selected){say("Selecione um osso na hierarquia primeiro.");return;}
    state.placing=false;
    state.editingBone=true;
    if(transform){transform.attach(state.selected);transform.setMode(mode);}
    $("rigPlaceBone").classList.remove("active-tool");
    $("rigStudioStatus").textContent=(mode==="rotate"?"Rotação":"Movimentação")+" do osso "+state.selected.name+" ativada. Para voltar a selecionar a criatura, clique fora do manipulador ou escolha outro elemento.";
  }
  function beginPlacement(){
    if(!state.root){say("Crie primeiro um preset de Rig.");return;}
    state.placing=!state.placing;
    state.editingBone=false;
    if(transform) transform.detach();
    $("rigPlaceBone").classList.toggle("active-tool",state.placing);
    $("rigStudioStatus").textContent=state.placing
      ? "Posicionamento ativo: clique sobre a superfície da criatura para criar um osso filho do osso selecionado."
      : "Posicionamento cancelado. Você pode voltar a selecionar e manipular o modelo.";
  }
  function placeAtWorld(worldPoint){
    if(!state.placing||!state.root||!worldPoint)return false;
    const parent=state.selected||state.root;
    parent.updateWorldMatrix(true,false);
    const local=parent.worldToLocal(worldPoint.clone());
    const bone=makeBone("Osso_"+(state.bones.length+1),parent,local.toArray());
    state.placing=false;
    $("rigPlaceBone").classList.remove("active-tool");
    rebuildHelper();
    selectBone(bone);
    say("Osso "+bone.name+" criado no ponto escolhido. A malha original permanece intacta.");
    return true;
  }
  function renderTree(){
    const box=$("rigBoneList");if(!box)return;box.replaceChildren();
    for(const bone of state.bones){const b=document.createElement("button");b.type="button";b.className="part"+(bone===state.selected?" active":"");b.textContent=(bone.parent?.isBone?"↳ ":"")+bone.name;b.onclick=()=>selectBone(bone);box.append(b);}
    $("rigBoneCount").textContent=state.bones.length+" ossos";
  }
  function makeBone(name,parent,position){
    const bone=new THREE.Bone();bone.name=name;bone.position.set(...position);bone.userData.berofelBoneId=makeStableId();bone.userData.rigStudioBone=true;bone.userData.limits={min:-180,max:180};
    if(parent)parent.add(bone);state.bones.push(bone);return bone;
  }
  function adoptNativeSkeleton(){
    const target=attachTarget();
    const meshes=[];
    target.traverse?.(o=>{if(o.isSkinnedMesh&&o.skeleton?.bones?.length)meshes.push(o);});
    if(!meshes.length)throw new Error("O modelo selecionado não possui uma malha SkinnedMesh com esqueleto nativo.");
    const skeletons=[...new Set(meshes.map(m=>m.skeleton))];
    if(skeletons.length!==1)throw new Error("O modelo contém mais de um esqueleto. Selecione um conjunto com um único skeleton para evitar misturar hierarquias.");
    const skeleton=skeletons[0],bones=skeleton.bones.slice(),boneSet=new Set(bones);
    const roots=bones.filter(b=>!b.parent?.isBone||!boneSet.has(b.parent));
    if(roots.length!==1)throw new Error("O esqueleto possui "+roots.length+" raízes. A adoção automática exige uma única raiz; nenhum osso foi alterado.");
    if(bones.some(b=>!b?.isBone))throw new Error("O skeleton contém referências inválidas.");
    clearRig();
    state.target=target;state.root=roots[0];state.ownsRoot=false;state.bones=bones;
    state.root.userData.berofelSkeletonId=state.root.userData.berofelSkeletonId||("native-skeleton-"+makeStableId());
    for(const bone of bones){
      bone.userData.berofelBoneId=bone.userData.berofelBoneId||makeStableId();
      bone.userData.rigStudioBone=true;
      if(!bone.userData.limits)bone.userData.limits={min:-180,max:180};
    }
    rebuildHelper();selectBone(state.root);
    const status=$("rigBindingStatus");
    if(status)status.textContent=meshes.length+" malha(s) usando o mesmo skeleton nativo. Ossos originais adotados diretamente; pesos, geometria, materiais e skinning não foram modificados.";
    say("Esqueleto nativo conectado ao Rig Studio: "+bones.length+" ossos. A malha continua usando seu skinning original.");
    return bones.length;
  }
  function clearWeightOverlay(){
    for(const item of state.weightOverlays){
      if(item.mesh.parent)item.mesh.parent.remove(item.mesh);
      item.mesh.geometry?.dispose();
      const mats=Array.isArray(item.mesh.material)?item.mesh.material:[item.mesh.material];
      mats.filter(Boolean).forEach(m=>m.dispose());
    }
    state.weightOverlays=[];
    const status=$("rigWeightViewStatus");if(status)status.textContent="Visualização de pesos desligada.";
    const button=$("rigWeightViewToggle");if(button)button.textContent="Mostrar influência na malha";
  }
  function renderWeightBoneOptions(){
    const select=$("rigWeightBoneSelect");if(!select)return;
    const previous=select.value;
    select.replaceChildren();
    for(const bone of state.bones){
      const option=document.createElement("option");
      option.value=bone.userData?.berofelBoneId||bone.name;
      option.textContent=bone.name;
      select.append(option);
    }
    if([...select.options].some(o=>o.value===previous))select.value=previous;
    else if(state.selected)select.value=state.selected.userData?.berofelBoneId||state.selected.name;
  }
  function showWeightOverlay(){
    clearWeightOverlay();
    const target=getSelected?.()||state.target;
    if(!target)throw new Error("Selecione a criatura que possui o esqueleto nativo.");
    const select=$("rigWeightBoneSelect");
    const selectedId=select?.value||(state.selected?.userData?.berofelBoneId||state.selected?.name);
    if(!selectedId)throw new Error("Escolha um osso para visualizar.");
    const overlays=[];
    target.traverse?.(mesh=>{
      if(!mesh.isSkinnedMesh||!mesh.skeleton)return;
      const boneIndex=mesh.skeleton.bones.findIndex(b=>(b.userData?.berofelBoneId||b.name)===selectedId);
      if(boneIndex<0)return;
      const source=mesh.geometry,indices=source?.attributes?.skinIndex,weights=source?.attributes?.skinWeight;
      if(!source||!indices||!weights||!source.attributes.position)return;
      const geometry=source.clone(),count=source.attributes.position.count;
      const colors=new Float32Array(count*3),color=new THREE.Color();
      for(let v=0;v<count;v++){
        let influence=0;
        for(let k=0;k<4;k++)if(indices.getComponent(v,k)===boneIndex)influence+=weights.getComponent(v,k);
        const t=Math.max(0,Math.min(1,influence));
        // Blue = no influence; cyan/yellow = medium; red = strong influence.
        const hue=(1-t)*.66;
        color.setHSL(hue,1,.5);
        colors[v*3]=color.r;colors[v*3+1]=color.g;colors[v*3+2]=color.b;
      }
      geometry.setAttribute("color",new THREE.BufferAttribute(colors,3));
      const material=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.82,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
      const overlay=new THREE.SkinnedMesh(geometry,material);
      overlay.name="Berofel_WeightHeatmap_"+mesh.name;
      overlay.bindMode=mesh.bindMode;
      overlay.bind(mesh.skeleton,mesh.bindMatrix);
      overlay.bindMatrixInverse.copy(mesh.bindMatrixInverse);
      overlay.position.copy(mesh.position);overlay.quaternion.copy(mesh.quaternion);overlay.scale.copy(mesh.scale);
      overlay.frustumCulled=false;overlay.renderOrder=30;
      mesh.parent?.add(overlay);
      overlays.push({mesh:overlay,source:mesh});
    });
    if(!overlays.length)throw new Error("Não encontrei uma SkinnedMesh com pesos para o osso escolhido. Conecte o esqueleto nativo correto.");
    state.weightOverlays=overlays;
    const bone=state.bones.find(b=>(b.userData?.berofelBoneId||b.name)===selectedId);
    const status=$("rigWeightViewStatus");
    if(status)status.textContent="Visualizando influência de "+(bone?.name||selectedId)+" em "+overlays.length+" malha(s). Azul: sem influência; vermelho: influência forte. Somente leitura.";
    const button=$("rigWeightViewToggle");if(button)button.textContent="Ocultar influência na malha";
  }
  function inspectWeights(){
    const target=getSelected?.()||state.target;
    if(!target)throw new Error("Selecione um modelo ou conecte seu esqueleto nativo antes do diagnóstico.");
    const meshes=[];
    target.traverse?.(o=>{if(o.isSkinnedMesh)meshes.push(o);});
    if(!meshes.length){
      const plain=[];target.traverse?.(o=>{if(o.isMesh)plain.push(o);});
      return {meshes:plain.length,skinned:0,weightedVertices:0,bones:[],details:plain.map(m=>({name:m.name||"Malha sem nome",vertices:m.geometry?.attributes?.position?.count||0,skinned:false}))};
    }
    const boneStats=new Map();
    let weightedVertices=0,totalVertices=0,invalidWeights=0,unmappedInfluences=0;
    const details=[];
    for(const mesh of meshes){
      const geometry=mesh.geometry,indices=geometry?.attributes?.skinIndex,weights=geometry?.attributes?.skinWeight;
      const positions=geometry?.attributes?.position;
      const vertexCount=positions?.count||0;totalVertices+=vertexCount;
      if(!indices||!weights||indices.count!==weights.count){
        details.push({name:mesh.name||"SkinnedMesh sem nome",vertices:vertexCount,skinned:false,reason:"Atributos skinIndex/skinWeight ausentes ou incompatíveis"});
        continue;
      }
      const bones=mesh.skeleton?.bones||[];
      let localWeighted=0;
      for(let v=0;v<Math.min(vertexCount,indices.count,weights.count);v++){
        let sum=0,hasWeight=false;
        for(let k=0;k<4;k++){
          const weight=weights.getComponent(v,k),index=indices.getComponent(v,k);
          if(!Number.isFinite(weight)||weight<0){invalidWeights++;continue;}
          sum+=weight;
          if(weight>1e-5){
            hasWeight=true;
            const bone=bones[index];
            if(!bone){unmappedInfluences++;continue;}
            const id=bone.userData?.berofelBoneId||bone.name||("bone-index-"+index);
            let stat=boneStats.get(id);
            if(!stat){stat={id,name:bone.name||id,vertices:0,totalWeight:0,influences:0};boneStats.set(id,stat);}
            stat.vertices++;stat.totalWeight+=weight;stat.influences++;

          }
        }
        if(hasWeight)localWeighted++;
        if(sum>1.05||sum<.95)invalidWeights++;
      }
      weightedVertices+=localWeighted;
      details.push({name:mesh.name||"SkinnedMesh sem nome",vertices:vertexCount,weightedVertices:localWeighted,skinned:true,boneCount:bones.length});
    }
    const bones=[...boneStats.values()].sort((a,b)=>b.vertices-a.vertices).map(s=>({...s,averageWeight:s.totalWeight/Math.max(1,s.influences)}));
    return {meshes:meshes.length,skinned:meshes.length,weightedVertices,totalVertices,invalidWeights,unmappedInfluences,bones,details};
  }
  function showWeightReport(){
    const output=$("rigWeightStatus");
    try{
      const report=inspectWeights();
      if(!output)return report;
      if(!report.skinned){
        output.textContent=report.meshes
          ? "Diagnóstico: "+report.meshes+" malha(s) sem skinning. Nenhum peso foi criado ou alterado. Próxima etapa: associar vértices aos ossos manualmente."
          : "Nenhuma malha encontrada no modelo selecionado.";
        return report;
      }
      const percent=report.totalVertices?100*report.weightedVertices/report.totalVertices:0;
      const lines=["Diagnóstico somente leitura — nenhum peso foi modificado.",
        report.skinned+" SkinnedMesh; "+report.weightedVertices+"/"+report.totalVertices+" vértices com influência ("+percent.toFixed(1)+"%).",
        "Influências inválidas/somas fora de 0,95–1,05: "+report.invalidWeights+"; índices sem osso correspondente: "+report.unmappedInfluences+".",
        "Influências por osso (vértices / peso médio):"];
      for(const bone of report.bones)lines.push("• "+bone.name+": "+bone.vertices+" / "+bone.averageWeight.toFixed(3));
      for(const mesh of report.details)lines.push("• Malha "+mesh.name+": "+(mesh.weightedVertices??0)+"/"+mesh.vertices+" vértices; "+(mesh.skinned?mesh.boneCount+" ossos":"sem atributos de skinning"));
      output.textContent=lines.join("\n");
      return report;
    }catch(err){if(output)output.textContent="Falha no diagnóstico: "+err.message;throw err;}
  }
  function createFromPreset(key){
    const target=attachTarget();clearRig();state.target=target;
    state.root=new THREE.Group();state.ownsRoot=true;state.root.name="RigStudio_"+key;state.root.userData.berofelRigStudio=true;state.root.userData.berofelSkeletonId="skeleton-"+makeStableId();target.add(state.root);
    const map=[];
    for(const [name,parent,pos] of presets[key].bones){map.push(makeBone(name,parent===null?state.root:map[parent],pos));}
    rebuildHelper();selectBone(map[0]);const info=updateBindingStatus();say("Preset "+presets[key].label+" criado. "+info.meshes+" malha(s) detectadas; "+info.skinnedMeshes+" com skinning nativo. O rig visual não altera a malha.");
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
  function importData(data){
    if(!data||data.format!=="BerofelRigStudio"||!Array.isArray(data.bones)||!data.bones.length)throw new Error("Arquivo de rig inválido ou sem ossos.");
    const ids=new Set(),names=new Set(),items=data.bones;
    for(const item of items){
      if(!item||typeof item!=="object"||typeof item.name!=="string"||!item.name.trim())throw new Error("O arquivo contém um osso sem nome válido.");
      if(item.id){if(ids.has(item.id))throw new Error("O arquivo contém IDs de osso duplicados.");ids.add(item.id);}
      if(names.has(item.name)&&items.some(x=>!x.id))throw new Error("Há nomes duplicados em um rig antigo; renomeie os ossos antes de importar.");
      names.add(item.name);
      for(const key of ["position","scale"])if(item[key]!==undefined&&(!Array.isArray(item[key])||item[key].length!==3||!item[key].every(Number.isFinite)))throw new Error("Transformação inválida no osso "+item.name+".");
      if(item.quaternion!==undefined&&(!Array.isArray(item.quaternion)||item.quaternion.length!==4||!item.quaternion.every(Number.isFinite)))throw new Error("Rotação inválida no osso "+item.name+".");
    }
    const known=new Set(items.map(x=>x.id||x.name));
    for(const item of items){const parent=item.parentId||item.parent;if(parent&&!known.has(parent))throw new Error("O osso "+item.name+" aponta para um pai inexistente.");}
    const target=attachTarget();
    const pendingCheck=items.slice(),resolved=new Set();let passes=0;
    while(pendingCheck.length&&passes++<=items.length){
      for(let i=pendingCheck.length-1;i>=0;i--){const item=pendingCheck[i],parent=item.parentId||item.parent;if(!parent||resolved.has(parent)){resolved.add(item.id||item.name);pendingCheck.splice(i,1);}}
    }
    if(pendingCheck.length)throw new Error("A hierarquia contém ciclo ou dependência circular. O rig atual foi preservado.");
    clearRig();state.target=target;
    state.root=new THREE.Group();state.ownsRoot=true;state.root.name="RigStudio_Importado";state.root.userData.berofelRigStudio=true;
    state.root.userData.berofelSkeletonId=data.skeletonId||("skeleton-"+makeStableId());target.add(state.root);
    const map=new Map(),pending=data.bones.slice();
    while(pending.length){
      let progress=false;
      for(let i=pending.length-1;i>=0;i--){
        const item=pending[i],parent=item.parentId?map.get(item.parentId):(item.parent?map.get(item.parent)||Array.from(map.values()).find(b=>b.name===item.parent):state.root);
        if(!parent)continue;
        const bone=new THREE.Bone();bone.name=item.name||"Osso";bone.userData.berofelBoneId=item.id||makeStableId();
        bone.userData.rigStudioBone=true;bone.userData.limits=item.limits||{min:-180,max:180};
        bone.position.fromArray(item.position||[0,0,0]);
        if(item.quaternion)bone.quaternion.fromArray(item.quaternion);
        else if(item.rotation)bone.rotation.set(...item.rotation);
        bone.scale.fromArray(item.scale||[1,1,1]);parent.add(bone);
        map.set(item.id||item.name,bone);state.bones.push(bone);pending.splice(i,1);progress=true;
      }
      if(!progress)throw new Error("A hierarquia contém um osso sem pai válido ou uma dependência circular.");
    }
    rebuildHelper();selectBone(state.bones[0]||null);updateBindingStatus();return state.bones.length;
  }
  function exportData(){
    return {
      format:"BerofelRigStudio",
      version:2,
      skeletonId:state.root?.userData.berofelSkeletonId||null,
      preset:$("#rigPreset").value,
      bones:state.bones.map(b=>({
        id:b.userData.berofelBoneId,
        name:b.name,
        parentId:b.parent?.isBone?b.parent.userData.berofelBoneId:null,
        position:b.position.toArray(),
        quaternion:b.quaternion.toArray(),
        scale:b.scale.toArray(),
        limits:b.userData.limits||{min:-180,max:180}
      }))
    };
  }
  $("rigCreatePreset").onclick=()=>{try{createFromPreset($("rigPreset").value)}catch(e){say(e.message)}};
  $("rigAdoptSkeleton")?.addEventListener("click",()=>{try{adoptNativeSkeleton()}catch(e){say(e.message)}});
  $("rigAddBone").onclick=addBone;$("rigMirrorBone").onclick=mirrorSelected;$("rigDeleteBone").onclick=deleteSelected;$("rigRenameBone").onclick=renameSelected;
  $("rigBoneName").addEventListener("change",renameSelected);
  $("rigSaveJson").onclick=()=>{if(!state.root){say("Crie um rig antes de exportar.");return;}const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="berofel-rig.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);};
  $("rigClear").onclick=clearRig;
  $("rigToggleVisual")?.addEventListener("click",()=>{state.showVisual=!state.showVisual;if(state.visualRoot)state.visualRoot.visible=state.showVisual;$("rigToggleVisual").textContent=state.showVisual?"Ocultar silhueta":"Mostrar silhueta";});
  $("rigRotateMode").onclick=()=>setBoneTransform("rotate");
  $("rigMoveMode").onclick=()=>setBoneTransform("translate");
  $("rigPlaceBone").onclick=beginPlacement;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.placing){state.placing=false;$("rigPlaceBone").classList.remove("active-tool");$("rigStudioStatus").textContent="Posicionamento cancelado."}});
  $("rigStudioStatus").textContent="Escolha um preset ou crie um esqueleto manualmente. Selecione uma criatura antes de iniciar.";
  $("rigInspectWeights")?.addEventListener("click",()=>{try{showWeightReport()}catch(e){say(e.message)}});
  $("rigWeightViewToggle")?.addEventListener("click",()=>{try{if(state.weightOverlays.length)clearWeightOverlay();else showWeightOverlay();}catch(e){say(e.message);}});
  $("rigWeightBoneSelect")?.addEventListener("change",()=>{if(state.weightOverlays.length){try{showWeightOverlay()}catch(e){say(e.message);}}});\n  return {clear:clearRig,getState:()=>state,exportData,adoptNativeSkeleton,placeAtWorld,getPickTargets,selectFromIntersection,getBones:()=>state.bones.slice(),inspectTarget,inspectWeights,showWeightOverlay,clearWeightOverlay,update:()=>{if(state.helper)state.helper.update();updateVisuals();}};
}
