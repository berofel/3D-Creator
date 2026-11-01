// Timeline por frames com poses locais, IDs estáveis e salvamento explícito.
export function createFrameManager({getBones,getSkeletonId,onPoseApplied=()=>{},onChange=()=>{},onBoneSelected=()=>{}}={}) {
  let frames=[],selectedId=null,nextId=1;
  let playing=false,loopPlayback=true,pingPongPlayback=false,direction=1;
  let timelineCurrent=0,playbackAccumulator=0;
  let fps=12,easing="ease-in-out";
  let baseSkeletonId=null;
  const basePose=new Map();
  const $=id=>document.getElementById(id);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const finiteVector=(value,length)=>Array.isArray(value)&&value.length===length&&value.every(Number.isFinite);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const validFps=[6,8,12,15,18,24,30];
  const smooth=value=>value*value*(3-2*value);

  function setStatus(message){const el=$("frameStatus");if(el)el.textContent=message;}
  function getActiveSkeletonId(){return getSkeletonId?.()||null;}
  function getFrameDuration(frame){const value=Number(frame?.duration);return Number.isFinite(value)?clamp(value,.05,30):.5;}
  function getTotalDuration(){return frames.reduce((sum,frame)=>sum+getFrameDuration(frame),0);}
  function getFrameStart(index){let time=0;for(let i=0;i<index;i++)time+=getFrameDuration(frames[i]);return time;}
  function formatTime(seconds){const value=Math.max(0,Number(seconds)||0),minutes=Math.floor(value/60),whole=Math.floor(value%60),centiseconds=Math.floor((value%1)*100);return String(minutes).padStart(2,"0")+":"+String(whole).padStart(2,"0")+"."+String(centiseconds).padStart(2,"0");}
  function readTransform(bone){
    return {position:bone.position.toArray(),quaternion:bone.quaternion.toArray(),scale:bone.scale.toArray()};
  }
  function ensureBasePose(){
    const skeletonId=getActiveSkeletonId();
    if(skeletonId!==baseSkeletonId){basePose.clear();baseSkeletonId=skeletonId;}
    const bones=getBones?.()||[];
    for(const bone of bones){
      const id=bone.userData?.berofelBoneId;
      if(id&&!basePose.has(id))basePose.set(id,readTransform(bone));
    }
  }
  function applyTransform(bone,pose){
    bone.position.fromArray(pose.position);
    bone.quaternion.fromArray(pose.quaternion).normalize();
    bone.scale.fromArray(pose.scale);
    bone.updateMatrix();
    bone.updateMatrixWorld(true);
  }
  function applyBasePose(){
    ensureBasePose();
    const map=new Map((getBones?.()||[]).map(bone=>[bone.userData?.berofelBoneId,bone]));
    let applied=0;
    for(const [id,pose] of basePose){const bone=map.get(id);if(bone){applyTransform(bone,pose);applied++;}}
    if(applied)onPoseApplied();
    return applied;
  }
  function capture(label){
    ensureBasePose();
    const bones=getBones?.()||[];
    if(!bones.length)throw new Error("Crie ou conecte um esqueleto antes de salvar um frame.");
    const skeletonId=getActiveSkeletonId();
    if(frames.length&&frames.some(frame=>frame.skeletonId&&skeletonId&&frame.skeletonId!==skeletonId))
      throw new Error("A timeline pertence a outro esqueleto. Exporte as poses antes de trocar de rig.");
    const ids=new Set();
    const pose=bones.map(bone=>{
      const id=bone.userData?.berofelBoneId;
      if(!id||ids.has(id))throw new Error("O rig possui ID de osso ausente ou duplicado.");
      ids.add(id);
      return {boneId:id,...readTransform(bone)};
    });
    return {id:"frame-"+(nextId++),label:label||("Frame "+(frames.length+1)),skeletonId,duration:.5,pose};
  }
  function validateData(data){
    if(!data||data.format!=="BerofelMotionFrames"||![2,3].includes(Number(data.version))||!Array.isArray(data.frames))
      throw new Error("Arquivo de poses inválido ou versão não compatível.");
    const frameIds=new Set();
    const normalized=[];
    for(const frame of data.frames){
      if(!frame||typeof frame.id!=="string"||!frame.id.trim()||frameIds.has(frame.id)||typeof frame.label!=="string"||!frame.label.trim()||!Array.isArray(frame.pose))
        throw new Error("O arquivo contém frames inválidos ou IDs repetidos.");
      frameIds.add(frame.id);
      const duration=frame.duration===undefined?.5:Number(frame.duration);
      if(!Number.isFinite(duration)||duration<.05||duration>30)throw new Error("Duração inválida no frame "+frame.label+".");
      const boneIds=new Set(),pose=[];
      for(const item of frame.pose){
        if(!item||typeof item.boneId!=="string"||!item.boneId||boneIds.has(item.boneId)||
          !finiteVector(item.position,3)||!finiteVector(item.quaternion,4)||!finiteVector(item.scale,3))
          throw new Error("Transformação inválida ou osso repetido em "+frame.label+".");
        const qLength=Math.hypot(...item.quaternion);
        if(!Number.isFinite(qLength)||qLength<1e-8)throw new Error("Quaternion inválido em "+frame.label+".");
        boneIds.add(item.boneId);
        pose.push({boneId:item.boneId,position:item.position.slice(),quaternion:item.quaternion.map(value=>value/qLength),scale:item.scale.slice()});
      }
      normalized.push({id:frame.id,label:frame.label.trim().slice(0,48),skeletonId:frame.skeletonId||data.skeletonId||null,duration,pose});
    }
    const settings=data.settings&&typeof data.settings==="object"?data.settings:{};
    const importedFps=validFps.includes(Number(settings.fps))?Number(settings.fps):12;
    const importedEasing=["linear","ease-in-out","catmull-rom"].includes(settings.easing)?settings.easing:"ease-in-out";
    return {format:"BerofelMotionFrames",version:3,skeletonId:data.skeletonId||null,settings:{fps:importedFps,easing:importedEasing,loop:settings.loop!==false,pingPong:settings.pingPong===true},frames:normalized};
  }
  function poseAt(frame,boneId){return frame.pose.find(item=>item.boneId===boneId)||null;}
  function catmullValue(p0,p1,p2,p3,t){
    const t2=t*t,t3=t2*t;
    const value=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);
    return clamp(value,Math.min(p1,p2),Math.max(p1,p2));
  }
  function interpolateVector(a,b,t){return a.map((value,index)=>value+(b[index]-value)*t);}
  function getBoneSegment(keys,time,total,wrap){
    if(keys.length===1)return {previous:keys[0],next:keys[0],previousIndex:0,nextIndex:0,t:0};
    const first=keys[0],last=keys[keys.length-1];
    if(wrap&&(time<first.time||time>=last.time)){
      const previous=time<first.time?{...last,time:last.time-total}:last;
      const next=time<first.time?first:{...first,time:first.time+total};
      const adjusted=time<first.time?time:time;
      return {previous,next,previousIndex:keys.length-1,nextIndex:0,t:clamp((adjusted-previous.time)/(next.time-previous.time),0,1)};
    }
    if(time<=first.time)return {previous:first,next:first,previousIndex:0,nextIndex:0,t:0};
    if(time>=last.time)return {previous:last,next:last,previousIndex:keys.length-1,nextIndex:keys.length-1,t:0};
    for(let i=0;i<keys.length-1;i++){
      if(time>=keys[i].time&&time<keys[i+1].time)
        return {previous:keys[i],next:keys[i+1],previousIndex:i,nextIndex:i+1,t:clamp((time-keys[i].time)/(keys[i+1].time-keys[i].time),0,1)};
    }
    return {previous:last,next:last,previousIndex:keys.length-1,nextIndex:keys.length-1,t:0};
  }
  function interpolateBonePose(keys,segment,property,wrap){
    const a=segment.previous.pose[property],b=segment.next.pose[property],t=segment.t;
    if(easing==="catmull-rom"&&(property==="position"||property==="scale")&&keys.length>=3&&segment.previousIndex!==segment.nextIndex){
      const count=keys.length;
      const prevIndex=segment.previousIndex-1;
      const nextIndex=segment.nextIndex+1;
      const prevKey=prevIndex<0?(wrap?keys[count-1]:keys[segment.previousIndex]):keys[prevIndex];
      const nextKey=nextIndex>=count?(wrap?keys[0]:keys[segment.nextIndex]):keys[nextIndex];
      const p0=prevKey.pose[property],p1=a,p2=b,p3=nextKey.pose[property];
      return p1.map((value,index)=>catmullValue(p0[index],value,p2[index],p3[index],t));
    }
    const amount=easing==="linear"?t:smooth(t);
    return interpolateVector(a,b,amount);
  }
  function slerpBone(bone,a,b,t){
    const amount=easing==="linear"?t:smooth(t);
    const qa=bone.quaternion.clone().fromArray(a),qb=bone.quaternion.clone().fromArray(b);
    bone.quaternion.slerpQuaternions(qa,qb,amount).normalize();
  }
  function applyAtTime(seconds,forceEnd=false){
    if(!frames.length)return false;
    ensureBasePose();
    const total=getTotalDuration();
    const time=forceEnd?total:clamp(Number(seconds)||0,0,total);
    const wrap=loopPlayback&&!pingPongPlayback&&!forceEnd&&total>0;
    const bones=getBones?.()||[];
    const starts=frames.map((frame,index)=>({frame,time:getFrameStart(index)}));
    let applied=0;
    for(const bone of bones){
      const id=bone.userData?.berofelBoneId;
      if(!id)continue;
      const keys=[];
      for(const item of starts){const pose=poseAt(item.frame,id);if(pose)keys.push({time:item.time,pose});}
      if(!keys.length){const base=basePose.get(id);if(base){applyTransform(bone,base);applied++;}continue;}
      if(keys.length===1){applyTransform(bone,keys[0].pose);applied++;continue;}
      const segment=getBoneSegment(keys,time,total,wrap);
      const from=segment.previous.pose,to=segment.next.pose;
      if(segment.previousIndex===segment.nextIndex){applyTransform(bone,from);applied++;continue;}
      const position=interpolateBonePose(keys,segment,"position",wrap);
      const scale=interpolateBonePose(keys,segment,"scale",wrap);
      bone.position.fromArray(position);
      bone.scale.fromArray(scale);
      slerpBone(bone,from.quaternion,to.quaternion,segment.t);
      bone.updateMatrix();bone.updateMatrixWorld(true);applied++;
    }
    if(applied)onPoseApplied();
    return true;
  }
  function renderTimelineCursor(){
    const total=getTotalDuration(),time=clamp(timelineCurrent,0,total);
    const slider=$("timelineScrubber");if(slider)slider.value=String(total?Math.round(time/total*10000):0);
    const label=$("timelineTime");if(label)label.textContent=formatTime(time);
    const playhead=$("timelinePlayhead"),canvas=$("timelineCanvas");
    if(playhead&&canvas){
      const widths=frames.map(frame=>Math.max(104,getFrameDuration(frame)*110));
      let x=64,remaining=time;
      for(let i=0;i<widths.length;i++){const duration=getFrameDuration(frames[i]);if(remaining<=duration){x+=widths[i]*(duration?remaining/duration:0);break;}x+=widths[i];remaining-=duration;}
      playhead.style.left=x+"px";
    }
  }
  function renderTimeline(){
    const canvas=$("timelineCanvas"),ruler=$("timelineRulerCells"),tracks=$("timelineTracks");
    if(!canvas||!ruler||!tracks)return;
    ruler.replaceChildren();tracks.replaceChildren();
    const bones=getBones?.()||[];
    if(!frames.length){
      const empty=document.createElement("div");empty.className="timeline-empty";
      empty.textContent=bones.length?"Salve o primeiro frame para registrar as poses dos ossos.":"Adicione ou conecte um rig para começar.";
      tracks.append(empty);canvas.style.width="100%";renderTimelineCursor();return;
    }
    const widths=frames.map(frame=>Math.max(104,getFrameDuration(frame)*110));
    const columns=widths.map(width=>width+"px").join(" ");
    ruler.style.gridTemplateColumns=columns;
    let cursor=0;
    frames.forEach((frame,index)=>{
      const cell=document.createElement("div");cell.className="timeline-ruler-cell";
      cell.textContent=formatTime(cursor);cell.title=frame.label;cell.style.width=widths[index]+"px";
      ruler.append(cell);cursor+=getFrameDuration(frame);
    });
    const boneRows=bones.length?bones:[{name:"POSES",userData:{berofelBoneId:null}}];
    boneRows.forEach((bone,boneIndex)=>{
      const row=document.createElement("div");row.className="timeline-track";
      row.style.gridTemplateColumns="64px "+columns;
      const label=document.createElement("button");label.type="button";label.className="timeline-track-label timeline-bone-select";
      label.textContent=bone.name||("Osso "+(boneIndex+1));label.title="Selecionar "+label.textContent;
      label.addEventListener("click",()=>onBoneSelected?.(bone));row.append(label);
      const boneId=bone.userData?.berofelBoneId;
      frames.forEach((frame,index)=>{
        const cell=document.createElement("div");cell.className="timeline-frame-cell";
        const keyed=!!boneId&&frame.pose.some(item=>item.boneId===boneId);
        const block=document.createElement("button");block.type="button";
        block.className="timeline-frame timeline-bone-key"+(frame.id===selectedId?" active":"")+(keyed?" keyed":" missing");
        block.style.minHeight="30px";
        const marker=document.createElement("span");marker.textContent=(keyed?"◆ ":"· ")+"F"+(index+1);
        const duration=document.createElement("small");duration.textContent=getFrameDuration(frame).toFixed(2)+" s";
        block.append(marker,duration);
        block.title=(bone.name||"Osso")+" — "+frame.label+(keyed?" · pose registrada":" · pose interpolada entre chaves ou pose-base");
        block.addEventListener("click",()=>{pause("Frame selecionado.");onBoneSelected?.(bone);selectFrame(frame.id,true);});
        cell.append(block);row.append(cell);
      });
      tracks.append(row);
    });
    canvas.style.width=(64+widths.reduce((sum,width)=>sum+width,0))+"px";
    renderTimelineCursor();
  }
  function render(){
    const box=$("frameList");
    if(box){
      box.replaceChildren();
      frames.forEach((frame,index)=>{
        const card=document.createElement("div");card.dataset.frameId=frame.id;card.className="frame-card"+(frame.id===selectedId?" active":"");
        const select=document.createElement("button");select.type="button";select.className="frame-select";select.textContent=frame.label;
        select.onclick=()=>{pause("Reprodução pausada para editar a pose.");selectFrame(frame.id,true);};
        const up=document.createElement("button");up.type="button";up.textContent="↑";up.title="Mover para cima";up.disabled=index===0;up.onclick=()=>move(frame.id,-1);
        const down=document.createElement("button");down.type="button";down.textContent="↓";down.title="Mover para baixo";down.disabled=index===frames.length-1;down.onclick=()=>move(frame.id,1);
        const edit=document.createElement("button");edit.type="button";edit.textContent="✎";edit.title="Renomear";edit.onclick=()=>rename(frame.id);
        const duplicateButton=document.createElement("button");duplicateButton.type="button";duplicateButton.textContent="⧉";duplicateButton.title="Duplicar";duplicateButton.onclick=()=>duplicate(frame.id);
        card.append(select,up,down,edit,duplicateButton);box.append(card);
      });
    }
    const count=$("frameCount");if(count)count.textContent=frames.length+" frames";
    const del=$("frameDelete");if(del)del.disabled=frames.length<1||!selectedId;
    const duration=$("frameDuration"),selected=frames.find(frame=>frame.id===selectedId);
    if(duration&&selected)duration.value=String(getFrameDuration(selected));
    const fpsControl=$("frameFPS");if(fpsControl)fpsControl.value=String(fps);
    const easingControl=$("frameEasing");if(easingControl)easingControl.value=easing;
    const loopControl=$("frameLoop");if(loopControl)loopControl.checked=loopPlayback;
    const pingControl=$("framePingPong");if(pingControl)pingControl.checked=pingPongPlayback;
    onChange(frames);renderTimeline();
  }
  function persist(){/* As poses só são persistidas por exportação explícita do usuário. */}
  function pause(message="Reprodução pausada."){
    playing=false;playbackAccumulator=0;
    const button=$("framePlay");if(button)button.textContent="▶ Reproduzir";
    if(message)setStatus(message);
  }
  function stop(message="Animação parada. Pose-base restaurada."){
    pause("");
    timelineCurrent=0;direction=1;
    applyBasePose();renderTimelineCursor();
    if(message)setStatus(message);
  }
  function seek(seconds){
    if(!frames.length)return false;
    const total=getTotalDuration();timelineCurrent=clamp(Number(seconds)||0,0,total);
    let activeIndex=0;
    for(let index=0;index<frames.length;index++){if(getFrameStart(index)<=timelineCurrent)activeIndex=index;else break;}
    selectedId=frames[activeIndex]?.id||selectedId;
    applyAtTime(timelineCurrent,timelineCurrent>=total);
    const status=$("frameStatus");
    if(status&&frames.length>1)status.textContent="Timeline em "+formatTime(timelineCurrent)+".";
    renderTimelineCursor();return true;
  }
  function selectFrame(id,restore=true){
    const frame=frames.find(item=>item.id===id);if(!frame)return false;
    selectedId=id;timelineCurrent=getFrameStart(frames.indexOf(frame));
    if(restore){try{applyAtTime(timelineCurrent);setStatus("Pose do frame aplicada.");}catch(error){setStatus(error.message);return false;}}
    render();return true;
  }
  function setDuration(value){
    const frame=frames.find(item=>item.id===selectedId);if(!frame)return;
    const duration=Number(value);
    if(!Number.isFinite(duration)||duration<.05||duration>30){setStatus("A duração deve estar entre 0,05 e 30 segundos.");return;}
    frame.duration=duration;persist();render();setStatus("Duração do intervalo atualizada: "+duration.toFixed(2)+" s.");
  }
  function setFps(value){
    const selected=Number(value);if(!validFps.includes(selected)){setStatus("FPS inválido.");return;}
    fps=selected;playbackAccumulator=0;persist();render();setStatus("Reprodução configurada para "+fps+" FPS.");
  }
  function setEasing(value){
    if(!["linear","ease-in-out","catmull-rom"].includes(value))return;
    easing=value;persist();setStatus("Interpolação: "+({linear:"Linear","ease-in-out":"Ease-in-out","catmull-rom":"Catmull-Rom"}[easing])+".");
  }
  function setLoop(value){
    loopPlayback=!!value;
    if(!loopPlayback&&pingPongPlayback){pingPongPlayback=false;const ping=$("framePingPong");if(ping)ping.checked=false;}
    persist();render();
  }
  function setPingPong(value){
    pingPongPlayback=!!value;
    if(pingPongPlayback){loopPlayback=true;const loop=$("frameLoop");if(loop)loop.checked=true;}
    persist();render();
  }
  function play(){
    if(frames.length<2){setStatus("Salve pelo menos dois frames para reproduzir a animação.");return;}
    if(playing){pause();return;}
    if(timelineCurrent>=getTotalDuration())timelineCurrent=0;
    const selectedIndex=frames.findIndex(frame=>frame.id===selectedId);
    if(timelineCurrent===0&&selectedIndex>0)timelineCurrent=getFrameStart(selectedIndex);
    loopPlayback=$("frameLoop")?.checked!==false;
    pingPongPlayback=$("framePingPong")?.checked===true;
    if(pingPongPlayback)loopPlayback=true;
    direction=1;playbackAccumulator=0;playing=true;
    const button=$("framePlay");if(button)button.textContent="Ⅱ Pausar";
    applyAtTime(timelineCurrent);setStatus("Reproduzindo a "+fps+" FPS.");
  }
  function update(delta){
    if(!playing||!Number.isFinite(delta)||delta<=0)return;
    const total=getTotalDuration();if(total<=0){pause("Timeline vazia.");return;}
    playbackAccumulator+=Math.min(delta,.25);
    const step=1/fps;let steps=0,finished=false;
    while(playbackAccumulator>=step&&steps<8){
      playbackAccumulator-=step;steps++;
      let next=timelineCurrent+step*direction;
      if(pingPongPlayback){
        if(next>=total){if(loopPlayback){next=total-(next-total);direction=-1;}else{next=total;finished=true;}}
        else if(next<=0){if(loopPlayback){next=-next;direction=1;}else{next=0;finished=true;}}
      }else if(next>=total){
        if(loopPlayback)next=next%total;
        else{next=total;finished=true;}
      }
      timelineCurrent=clamp(next,0,total);
      if(finished)break;
    }
    if(steps){applyAtTime(timelineCurrent,finished&&timelineCurrent>=total);renderTimelineCursor();}
    if(finished){pause("Animação concluída. Pose final mantida.");}
  }
  function move(id,delta){
    const index=frames.findIndex(frame=>frame.id===id),target=index+delta;
    if(index<0||target<0||target>=frames.length)return;
    const [item]=frames.splice(index,1);frames.splice(target,0,item);
    selectedId=id;timelineCurrent=getFrameStart(target);applyAtTime(timelineCurrent);render();persist();
  }
  function rename(id){
    const frame=frames.find(item=>item.id===id);if(!frame)return;
    const value=window.prompt("Nome do frame:",frame.label);if(value===null)return;
    const label=value.trim();if(!label){setStatus("O nome do frame não pode ficar vazio.");return;}
    frame.label=label.slice(0,48);render();persist();
  }
  function add(){
    pause("");const frame=capture();frames.push(frame);selectedId=frame.id;
    timelineCurrent=getFrameStart(frames.length-1);render();persist();setStatus("Frame salvo na timeline.");
  }
  function duplicate(id=selectedId){
    pause("");const frame=frames.find(item=>item.id===id);if(!frame)return;
    const copy=clone(frame);copy.id="frame-"+(nextId++);copy.label="Frame "+(frames.length+1);
    frames.splice(frames.indexOf(frame)+1,0,copy);selectedId=copy.id;
    timelineCurrent=getFrameStart(frames.indexOf(copy));render();persist();
  }
  function remove(){
    pause("");if(!frames.length)return;
    const index=frames.findIndex(frame=>frame.id===selectedId);if(index<0)return;
    frames.splice(index,1);selectedId=frames[Math.max(0,index-1)]?.id||null;
    timelineCurrent=selectedId?getFrameStart(frames.findIndex(frame=>frame.id===selectedId)):0;
    if(!frames.length)applyBasePose();render();persist();
  }
  function updateCurrent(){
    const frame=frames.find(item=>item.id===selectedId);if(!frame)return;
    try{
      const current=capture(frame.label);frame.skeletonId=current.skeletonId;frame.pose=current.pose;
      render();persist();setStatus("Pose do frame atualizada.");
    }catch(error){setStatus(error.message);}
  }
  function clearAll(){
    pause("");frames=[];selectedId=null;nextId=1;timelineCurrent=0;direction=1;
    basePose.clear();baseSkeletonId=null;ensureBasePose();render();setStatus("Timeline limpa para o novo rig.");
  }
  function importData(data){
    const validated=validateData(data),active=getActiveSkeletonId();
    if(validated.skeletonId&&active&&validated.skeletonId!==active)
      throw new Error("Importe primeiro o rig correspondente a este arquivo de poses.");
    pause("");frames=clone(validated.frames);nextId=Math.max(1,...frames.map(frame=>Number(String(frame.id).replace("frame-",""))+1||1));
    selectedId=frames[0]?.id||null;timelineCurrent=0;fps=validated.settings.fps;easing=validated.settings.easing;
    loopPlayback=validated.settings.loop;pingPongPlayback=validated.settings.pingPong;
    ensureBasePose();render();persist();
    if(selectedId)applyAtTime(0);
    setStatus("Poses importadas e validadas.");
    return frames.length;
  }
  function exportData(){
    return {format:"BerofelMotionFrames",version:3,skeletonId:getActiveSkeletonId(),settings:{fps,easing,loop:loopPlayback,pingPong:pingPongPlayback},frames:clone(frames)};
  }
  $("timelineScrubber")?.addEventListener("input",event=>{pause("");seek(getTotalDuration()*(Number(event.target.value)/10000));});
  $("framePlay")?.addEventListener("click",play);
  $("frameStop")?.addEventListener("click",()=>stop());
  $("frameLoop")?.addEventListener("change",event=>setLoop(event.target.checked));
  $("framePingPong")?.addEventListener("change",event=>setPingPong(event.target.checked));
  $("frameFPS")?.addEventListener("change",event=>setFps(event.target.value));
  $("frameEasing")?.addEventListener("change",event=>setEasing(event.target.value));
  $("frameDuration")?.addEventListener("change",event=>setDuration(event.target.value));
  $("frameAdd")?.addEventListener("click",()=>{try{add();}catch(error){setStatus(error.message);}});
  $("frameDuplicate")?.addEventListener("click",()=>duplicate());
  $("frameDelete")?.addEventListener("click",remove);
  $("frameUpdate")?.addEventListener("click",updateCurrent);
  $("frameImport")?.addEventListener("click",()=>$("frameImportFile")?.click());
  $("frameImportFile")?.addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{importData(JSON.parse(await file.text()));}catch(error){setStatus(error.message);}
    finally{event.target.value="";}
  });
  $("frameExport")?.addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download="berofel-poses-v3.json";link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
  return {
    add,clearAll,duplicate,remove,move,rename,importData,validateData,play,pause,stop,update,seek,
    refresh:()=>{ensureBasePose();renderTimeline();},
    applySelected:()=>{const frame=frames.find(item=>item.id===selectedId);return frame?seek(getFrameStart(frames.indexOf(frame))):0;},
    updateCurrent,exportData,getFrames:()=>clone(frames),isPlaying:()=>playing,
    getDrivenBoneIds:()=>[...new Set(frames.flatMap(frame=>frame.pose.map(item=>item.boneId)))],
    getSettings:()=>({fps,easing,loop:loopPlayback,pingPong:pingPongPlayback})
  };
}
