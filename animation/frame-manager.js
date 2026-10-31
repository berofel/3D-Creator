// Armazenamento local de poses por IDs estáveis de osso.
export function createFrameManager({getBones,getSkeletonId,onPoseApplied=()=>{},onChange=()=>{}}={}) {
  let frames=[],selectedId=null,nextId=1;const $=id=>document.getElementById(id);
  const clone=v=>JSON.parse(JSON.stringify(v));
  const finiteVector=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);
  function capture(label){
    const bones=getBones?.()||[];
    if(!bones.length)throw new Error("Crie um esqueleto antes de salvar um quadro.");
    const ids=new Set();
    const pose=bones.map(b=>{
      const id=b.userData?.berofelBoneId;
      if(!id||ids.has(id))throw new Error("O rig possui ID de osso ausente ou duplicado.");
      ids.add(id);
      return{boneId:id,position:b.position.toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray()};
    });
    return{id:"frame-"+(nextId++),label:label||("Frame "+(frames.length+1)),skeletonId:getSkeletonId?.()||null,duration:.5,pose};
  }
  function apply(frame){
    const activeSkeleton=getSkeletonId?.()||null;
    if(frame.skeletonId&&activeSkeleton&&frame.skeletonId!==activeSkeleton)throw new Error("Este quadro pertence a outro esqueleto. Importe o rig correspondente.");
    if(!Array.isArray(frame.pose))throw new Error("O quadro não contém uma pose válida.");
    const map=new Map((getBones?.()||[]).map(b=>[b.userData?.berofelBoneId,b]));
    const operations=[];
    for(const p of frame.pose){
      if(!p||typeof p.boneId!=="string"||!finiteVector(p.position,3)||!finiteVector(p.quaternion,4)||!finiteVector(p.scale,3))throw new Error("A pose contém uma transformação inválida.");
      const b=map.get(p.boneId);
      if(b)operations.push({b,p});
    }
    if(!operations.length)throw new Error("Nenhum osso deste quadro corresponde ao rig ativo.");
    for(const {b,p} of operations){b.position.fromArray(p.position);b.quaternion.fromArray(p.quaternion);b.scale.fromArray(p.scale);b.updateMatrix();b.updateMatrixWorld(true);}
    onPoseApplied();
    return{applied:operations.length,missing:frame.pose.length-operations.length};
  }
  let playing=false,loopPlayback=true,playIndex=0,playElapsed=0,timelineCurrent=0,lastTimelineUi=0;
  function setStatus(message){const el=$("frameStatus");if(el)el.textContent=message;}
function getFrameDuration(frame){return Math.max(.05,Math.min(30,Number(frame?.duration)||.5));}
function getTotalDuration(){return frames.reduce((sum,f)=>sum+getFrameDuration(f),0);}
function getFrameStart(index){let time=0;for(let i=0;i<index;i++)time+=getFrameDuration(frames[i]);return time;}
function formatTime(seconds){const value=Math.max(0,Number(seconds)||0),minutes=Math.floor(value/60),whole=Math.floor(value%60),centiseconds=Math.floor((value%1)*100);return String(minutes).padStart(2,"0")+":"+String(whole).padStart(2,"0")+"."+String(centiseconds).padStart(2,"0");}
function renderTimelineCursor(){
 const total=getTotalDuration(),time=Math.max(0,Math.min(total,timelineCurrent));
 const slider=$("timelineScrubber");if(slider)slider.value=String(total?Math.round(time/total*10000):0);
 const label=$("timelineTime");if(label)label.textContent=formatTime(time);
 const playhead=$("timelinePlayhead"),canvas=$("timelineCanvas");
 if(playhead&&canvas){const widths=frames.map(f=>Math.max(64,Math.min(240,getFrameDuration(f)*140)));let x=112,remaining=time;for(let i=0;i<widths.length;i++){const d=getFrameDuration(frames[i]);if(remaining<=d){x+=widths[i]*(remaining/d);break;}x+=widths[i];remaining-=d;}playhead.style.left=x+"px";}
}
function renderTimeline(){
 const canvas=$("timelineCanvas"),ruler=$("timelineRulerCells"),tracks=$("timelineTracks");if(!canvas||!ruler||!tracks)return;
 ruler.replaceChildren();tracks.replaceChildren();
 if(!frames.length){const empty=document.createElement("div");empty.className="timeline-empty";empty.textContent="Salve pelo menos uma pose para visualizar as articulações na timeline.";tracks.append(empty);canvas.style.width="100%";renderTimelineCursor();return;}
 const widths=frames.map(f=>Math.max(64,Math.min(240,getFrameDuration(f)*140)));
 const columns=widths.map(w=>w+"px").join(" ");
 ruler.style.gridTemplateColumns=columns;
 let cursor=0;
 frames.forEach((f,i)=>{const cell=document.createElement("div");cell.className="timeline-ruler-cell";cell.textContent=formatTime(cursor);cell.title=f.label+" — "+getFrameDuration(f).toFixed(2)+" s";ruler.append(cell);cursor+=getFrameDuration(f);});
 const bones=getBones?.()||[];
 if(!bones.length){const empty=document.createElement("div");empty.className="timeline-empty";empty.textContent="Crie ou conecte um rig para exibir as trilhas de articulação.";tracks.append(empty);}
 else for(const bone of bones){
  const row=document.createElement("div");row.className="timeline-track";row.style.gridTemplateColumns="112px "+columns;
  const label=document.createElement("div");label.className="timeline-track-label";label.textContent=bone.name;label.title=bone.name;row.append(label);
  frames.forEach(f=>{const cell=document.createElement("div");cell.className="timeline-cell";const key=f.pose.some(p=>p.boneId===bone.userData?.berofelBoneId)?document.createElement("button"):null;if(key){key.type="button";key.className="timeline-key";key.title=bone.name+" — "+f.label;key.setAttribute("aria-label","Selecionar "+f.label+" na articulação "+bone.name);key.addEventListener("click",()=>{stopPlayback("Reprodução pausada para editar.");selectFrame(f.id,true);});cell.append(key);}row.append(cell);});
  tracks.append(row);
 }
 canvas.style.width=(112+widths.reduce((a,b)=>a+b,0))+"px";
 renderTimelineCursor();
}
function interpolatePose(from,to,t){
 const eased=t*t*(3-2*t),map=new Map((getBones?.()||[]).map(b=>[b.userData?.berofelBoneId,b]));
 const fromPose=new Map(from.pose.map(p=>[p.boneId,p])),toPose=new Map(to.pose.map(p=>[p.boneId,p]));
 for(const [id,b] of map){const a=fromPose.get(id),z=toPose.get(id);if(!a||!z)continue;
  b.position.set(a.position[0]+(z.position[0]-a.position[0])*eased,a.position[1]+(z.position[1]-a.position[1])*eased,a.position[2]+(z.position[2]-a.position[2])*eased);
  const qa=b.quaternion.clone().fromArray(a.quaternion),qz=b.quaternion.clone().fromArray(z.quaternion);b.quaternion.slerpQuaternions(qa,qz,eased);
  b.scale.set(a.scale[0]+(z.scale[0]-a.scale[0])*eased,a.scale[1]+(z.scale[1]-a.scale[1])*eased,a.scale[2]+(z.scale[2]-a.scale[2])*eased);b.updateMatrix();
 }
 for(const b of map.values())b.updateMatrixWorld(true);onPoseApplied();
}
function seek(seconds){
 if(!frames.length)return false;
 const total=getTotalDuration();timelineCurrent=Math.max(0,Math.min(total,Number(seconds)||0));
 if(timelineCurrent>=total){const last=frames[frames.length-1];selectedId=last.id;apply(last);renderTimelineCursor();return true;}
 let cursor=0,index=0;
 while(index<frames.length-1&&timelineCurrent>=cursor+getFrameDuration(frames[index])){cursor+=getFrameDuration(frames[index]);index++;}
 const from=frames[index],to=frames[(index+1)%frames.length],duration=getFrameDuration(from);
 const t=Math.max(0,Math.min(1,(timelineCurrent-cursor)/duration));selectedId=from.id;
 if(t<1e-7)apply(from);else interpolatePose(from,to,t);
 const status=$("frameStatus");if(status)status.textContent="Timeline: "+from.label+" → "+to.label+" ("+(t*100).toFixed(0)+"%).";
 renderTimelineCursor();return true;
}

  function setDuration(value){
    const frame=frames.find(x=>x.id===selectedId);if(!frame)return;
    const duration=Number(value);
    if(!Number.isFinite(duration)||duration<0.05||duration>30){setStatus("A duração deve estar entre 0,05 e 30 segundos.");return;}
    frame.duration=duration;persist();render();setStatus("Duração do intervalo atualizada: "+duration.toFixed(2)+" s.");
  }
  function selectFrame(id,restore=true){
    const frame=frames.find(x=>x.id===id);if(!frame)return false;
    selectedId=id;timelineCurrent=getFrameStart(frames.indexOf(frame));
    if(restore){try{const result=apply(frame);setStatus("Pose aplicada: "+result.applied+" osso(s).");}catch(err){setStatus(err.message);return false;}}
    render();return true;
  }
  function stopPlayback(message="Reprodução pausada."){
    playing=false;const btn=$("framePlay");if(btn)btn.textContent="▶ Reproduzir";
    if(message)setStatus(message);
  }
  function play(){
    if(frames.length<2){setStatus("Salve pelo menos dois quadros para reproduzir a animação.");return;}
    if(playing){stopPlayback();return;}
    const selectedIndex=Math.max(0,frames.findIndex(f=>f.id===selectedId));
    timelineCurrent=getFrameStart(selectedIndex);loopPlayback=$("frameLoop")?.checked!==false;playing=true;
    const btn=$("framePlay");if(btn)btn.textContent="Ⅱ Pausar";
    seek(timelineCurrent);setStatus("Reproduzindo timeline de articulações…");
  }
  function update(delta){
    if(!playing||!Number.isFinite(delta)||delta<=0)return;
    const total=getTotalDuration();if(total<=0){stopPlayback("Timeline vazia.");return;}
    timelineCurrent+=Math.min(delta,.1);
    if(timelineCurrent>=total){
      if(loopPlayback)timelineCurrent=timelineCurrent%total;
      else{timelineCurrent=total;seek(timelineCurrent);stopPlayback("Animação concluída.");return;}
    }
    seek(timelineCurrent);
  }
  $("timelineScrubber")?.addEventListener("input",e=>{stopPlayback("");const total=getTotalDuration();seek(total*(Number(e.target.value)/10000));});
  $("framePlay")?.addEventListener("click",play);
  $("frameLoop")?.addEventListener("change",e=>{loopPlayback=e.target.checked;});
  $("frameDuration")?.addEventListener("change",e=>setDuration(e.target.value));
  function persist(){
    try{localStorage.setItem("berofel.motion.frames.v2",JSON.stringify({version:2,nextId,frames}));}
    catch(e){console.warn("Falha ao salvar quadros",e);const status=$("frameStatus");if(status)status.textContent="Não foi possível salvar no armazenamento local. Exporte o JSON para não perder as poses.";}
  }
  function move(id,delta){
    const index=frames.findIndex(f=>f.id===id),target=index+delta;
    if(index<0||target<0||target>=frames.length)return;
    const [item]=frames.splice(index,1);frames.splice(target,0,item);selectedId=id;render();persist();
  }
  function rename(id){
    const f=frames.find(x=>x.id===id);if(!f)return;
    const value=window.prompt("Nome do quadro:",f.label);
    if(value===null)return;
    const label=value.trim();if(!label){$("frameStatus").textContent="O nome do quadro não pode ficar vazio.";return;}
    f.label=label.slice(0,48);render();persist();
  }
  function render(){
    const box=$("frameList");if(!box)return;box.replaceChildren();
    for(let index=0;index<frames.length;index++){
      const f=frames[index],card=document.createElement("div");card.dataset.frameId=f.id;
      card.className="frame-card"+(f.id===selectedId?" active":"");
      const b=document.createElement("button");b.type="button";b.className="frame-select";b.textContent=f.label;
      b.onclick=()=>{stopPlayback("Reprodução interrompida para editar a pose.");selectFrame(f.id,true);};
      const up=document.createElement("button");up.type="button";up.textContent="↑";up.title="Mover para cima";up.disabled=index===0;up.onclick=()=>move(f.id,-1);
      const down=document.createElement("button");down.type="button";down.textContent="↓";down.title="Mover para baixo";down.disabled=index===frames.length-1;down.onclick=()=>move(f.id,1);
      const edit=document.createElement("button");edit.type="button";edit.textContent="✎";edit.title="Renomear";edit.onclick=()=>rename(f.id);
      const d=document.createElement("button");d.type="button";d.textContent="⧉";d.title="Duplicar";d.onclick=()=>duplicate(f.id);
      card.append(b,up,down,edit,d);box.append(card);
    }
    const count=$("frameCount");if(count)count.textContent=frames.length+" quadros";
    const del=$("frameDelete");if(del)del.disabled=frames.length<2||!selectedId;const duration=$("frameDuration");const selected=frames.find(x=>x.id===selectedId);if(duration&&selected)duration.value=String(selected.duration||.5);
    onChange(frames);renderTimeline();
  }
  function add(){stopPlayback("");const f=capture();frames.push(f);selectedId=f.id;timelineCurrent=getFrameStart(frames.length-1);render();persist();}
  function duplicate(id=selectedId){stopPlayback("");const f=frames.find(x=>x.id===id);if(!f)return;const c=clone(f);c.id="frame-"+(nextId++);c.label="Frame "+(frames.length+1);frames.splice(frames.indexOf(f)+1,0,c);selectedId=c.id;timelineCurrent=getFrameStart(frames.indexOf(c));render();persist();}
  function remove(){stopPlayback("");if(frames.length<2)return;const i=frames.findIndex(x=>x.id===selectedId);if(i<0)return;frames.splice(i,1);selectedId=frames[Math.max(0,i-1)].id;timelineCurrent=getFrameStart(frames.findIndex(f=>f.id===selectedId));render();persist();}
  function updateCurrent(){
    const f=frames.find(x=>x.id===selectedId);if(!f)return;
    try{const current=capture(f.label);f.skeletonId=current.skeletonId;f.pose=current.pose;render();persist();$("frameStatus").textContent="Pose atualizada.";}
    catch(err){$("frameStatus").textContent=err.message;}
  }
  function exportData(){return{format:"BerofelMotionFrames",version:2,skeletonId:getSkeletonId?.()||null,frames:clone(frames)};}
  function importData(data){
    if(!data||data.format!=="BerofelMotionFrames"||!Array.isArray(data.frames))throw new Error("Arquivo de poses inválido.");
    const active=getSkeletonId?.()||null;
    if(data.skeletonId&&active&&data.skeletonId!==active)throw new Error("Importe primeiro o rig correspondente a este arquivo de poses.");
    const ids=new Set();
    for(const f of data.frames){
      if(!f||typeof f.id!=="string"||ids.has(f.id)||!Array.isArray(f.pose)||typeof f.label!=="string")throw new Error("O arquivo contém quadros inválidos ou IDs repetidos.");
      ids.add(f.id);
      const boneIds=new Set();
      for(const p of f.pose){
        if(!p||typeof p.boneId!=="string"||boneIds.has(p.boneId)||!finiteVector(p.position,3)||!finiteVector(p.quaternion,4)||!finiteVector(p.scale,3))throw new Error("Transformação inválida ou osso repetido em "+f.label+".");
        boneIds.add(p.boneId);
      }
    }
    frames=clone(data.frames);nextId=Math.max(1,...frames.map(f=>Number(String(f.id).replace("frame-",""))+1||1));selectedId=frames[0]?.id||null;render();persist();
  }
  $("frameAdd")?.addEventListener("click",()=>{try{add();$("frameStatus").textContent="Pose salva.";}catch(e){$("frameStatus").textContent=e.message;}});
  $("frameDuplicate")?.addEventListener("click",()=>duplicate());$("frameDelete")?.addEventListener("click",remove);$("frameUpdate")?.addEventListener("click",updateCurrent);
  $("frameImport")?.addEventListener("click",()=>$("frameImportFile")?.click());
  $("frameImportFile")?.addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{importData(JSON.parse(await file.text()));$("frameStatus").textContent="Quadros importados.";}catch(err){$("frameStatus").textContent=err.message;}finally{e.target.value="";}});
  $("frameExport")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="berofel-poses.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  try{const s=JSON.parse(localStorage.getItem("berofel.motion.frames.v2")||localStorage.getItem("berofel.motion.frames.v1")||"null");if((s?.version===1||s?.version===2)&&Array.isArray(s.frames)){frames=s.frames;nextId=s.nextId||1;selectedId=frames[0]?.id||null;}}catch{}
  render();
  return{add,duplicate,remove,move,rename,importData,play,stop:()=>stopPlayback(),update,seek,applySelected:()=>{const f=frames.find(x=>x.id===selectedId);return f?apply(f):0;},updateCurrent,exportData,getFrames:()=>clone(frames)};
}
