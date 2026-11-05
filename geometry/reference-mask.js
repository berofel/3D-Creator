/**
 * Deterministic RGBA-to-binary-mask extraction.
 * Mask convention: 1 = subject, 0 = background.
 */
import { normalizeReferenceImage } from "./reference-image.js";

const clampByte = v => Math.max(0, Math.min(255, Math.round(v)));
function borderColor(data, width, height) {
  const sums=[0,0,0]; let count=0;
  const add=(x,y)=>{const i=(y*width+x)*4;for(let c=0;c<3;c++)sums[c]+=data[i+c];count++;};
  for(let x=0;x<width;x++){add(x,0);if(height>1)add(x,height-1);}
  for(let y=1;y<height-1;y++){add(0,y);if(width>1)add(width-1,y);}
  return sums.map(v=>v/Math.max(1,count));
}
function closeToColor(data,index,color,tolerance) {
  const dr=data[index]-color[0],dg=data[index+1]-color[1],db=data[index+2]-color[2];
  return Math.sqrt(dr*dr+dg*dg+db*db)<=tolerance;
}
function floodBackground(data,width,height,color,tolerance) {
  const total=width*height,background=new Uint8Array(total),queue=new Int32Array(total);
  let head=0,tail=0;
  const seed=i=>{if(!background[i]&&closeToColor(data,i*4,color,tolerance)){background[i]=1;queue[tail++]=i;}};
  for(let x=0;x<width;x++){seed(x);if(height>1)seed((height-1)*width+x);}
  for(let y=1;y<height-1;y++){seed(y*width);if(width>1)seed(y*width+width-1);}
  while(head<tail){
    const i=queue[head++],x=i%width,y=(i/width)|0;
    if(x>0)seed(i-1);if(x+1<width)seed(i+1);
    if(y>0)seed(i-width);if(y+1<height)seed(i+width);
  }
  return background;
}
function componentFilter(mask,width,height,minArea,keepLargest) {
  const total=mask.length,seen=new Uint8Array(total),queue=new Int32Array(total),raw=[];
  for(let start=0;start<total;start++){
    if(!mask[start]||seen[start])continue;
    let head=0,tail=0;queue[tail++]=start;seen[start]=1;
    while(head<tail){
      const i=queue[head++],x=i%width,y=(i/width)|0;
      const visit=j=>{if(mask[j]&&!seen[j]){seen[j]=1;queue[tail++]=j;}};
      if(x>0)visit(i-1);if(x+1<width)visit(i+1);
      if(y>0)visit(i-width);if(y+1<height)visit(i+width);
    }
    const pixels=Array.from(queue.subarray(0,tail));
    let minX=width,minY=height,maxX=-1,maxY=-1,sumX=0,sumY=0;
    for(const i of pixels){const x=i%width,y=(i/width)|0;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);sumX+=x;sumY+=y;}
    raw.push({pixels,area:tail,bounds:{minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1},centroid:{x:sumX/tail,y:sumY/tail}});
  }
  raw.sort((a,b)=>a.bounds.minY-b.bounds.minY||a.bounds.minX-b.bounds.minX||b.area-a.area);
  const largest=raw.reduce((best,c,i)=>c.area>(raw[best]?.area??-1)?i:best,-1);
  const components=raw.map((c,index)=>({id:`part-${String(index+1).padStart(4,"0")}`,index,area:c.area,
    bounds:c.bounds,centroid:c.centroid,kept:c.area>=minArea&&(!keepLargest||index===largest),pixelIndices:c.pixels}));
  const out=new Uint8Array(total);
  for(const c of components)if(c.kept)for(const i of c.pixelIndices)out[i]=1;
  return {mask:out,components,kept:components.filter(c=>c.kept).length,discarded:components.filter(c=>!c.kept).length};
}
function morphologyPass(mask,width,height,radius,operation) {
  const out=new Uint8Array(mask.length),r=Math.max(1,Math.floor(radius));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let value=operation==="erode"?1:0;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(dx*dx+dy*dy>r*r)continue;
      const xx=x+dx,yy=y+dy,inside=xx>=0&&xx<width&&yy>=0&&yy<height;
      const sample=inside?mask[yy*width+xx]:0;
      if(operation==="erode")value=Math.min(value,sample);else value=Math.max(value,sample);
    }
    out[y*width+x]=value;
  }
  return out;
}
function applyMorphology(mask,width,height,steps=[]) {
  let out=mask;
  for(const step of steps){
    const radius=step?.radius??1,op=step?.op;
    if(!Number.isInteger(radius)||radius<1||radius>12)throw new RangeError("Morphology radius must be an integer from 1 to 12.");
    if(op==="open"){out=morphologyPass(morphologyPass(out,width,height,radius,"erode"),width,height,radius,"dilate");}
    else if(op==="close"){out=morphologyPass(morphologyPass(out,width,height,radius,"dilate"),width,height,radius,"erode");}
    else if(op==="erode"||op==="dilate")out=morphologyPass(out,width,height,radius,op);
    else throw new TypeError("Morphology op must be erode, dilate, open or close.");
  }
  return out;
}
function measure(mask,width,height) {
  let minX=width,minY=height,maxX=-1,maxY=-1,area=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x]){
    area++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  }
  return {area,bounds:area?{minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1}:null};
}
export function extractReferenceMask(image, options={}) {
  const {width,height,data}=normalizeReferenceImage(image),total=width*height;
  const mode=options.mode??"auto",alphaThreshold=clampByte(options.alphaThreshold??8);
  if(!["auto","alpha","background","luminance"].includes(mode))throw new TypeError("Unknown mask extraction mode.");
  const hasAlpha=(()=>{for(let i=3;i<data.length;i+=4)if(data[i]<255)return true;return false;})();
  const selectedMode=mode==="auto"?(hasAlpha?"alpha":"background"):mode;
  let mask=new Uint8Array(total),background=null;
  if(selectedMode==="alpha"){
    for(let i=0;i<total;i++)mask[i]=data[i*4+3]>=alphaThreshold?1:0;
  }else if(selectedMode==="background"){
    background=options.backgroundColor??borderColor(data,width,height);
    if(!Array.isArray(background)||background.length!==3||!background.every(Number.isFinite))throw new TypeError("backgroundColor must be an RGB triplet.");
    const flood=floodBackground(data,width,height,background,options.tolerance??24);
    for(let i=0;i<total;i++)mask[i]=flood[i]?0:1;
  }else{
    const threshold=clampByte(options.threshold??127),invert=!!options.invert;
    for(let i=0;i<total;i++){
      const p=i*4,l=.2126*data[p]+.7152*data[p+1]+.0722*data[p+2];
      mask[i]=(invert?l>=threshold:l<=threshold)?1:0;
    }
  }
  if(options.morphology?.length)mask=applyMorphology(mask,width,height,options.morphology);
  const filtered=componentFilter(mask,width,height,Math.max(1,Math.floor(options.minComponentArea??1)),!!options.keepLargest);
  const metrics=measure(filtered.mask,width,height);
  return {
    mask:filtered.mask,width,height,bounds:metrics.bounds,area:metrics.area,components:filtered.components,
    stats:{totalPixels:total,foregroundPixels:metrics.area,foregroundRatio:metrics.area/total,
      components:filtered.components.map(({pixelIndices,...component})=>component),
      detectedComponents:filtered.components.length,keptComponents:filtered.kept,discardedComponents:filtered.discarded},
    method:selectedMode,parameters:{alphaThreshold,tolerance:options.tolerance??24,
      backgroundColor:background,threshold:options.threshold??127,invert:!!options.invert,
      minComponentArea:options.minComponentArea??1,keepLargest:!!options.keepLargest,
      morphology:options.morphology??[]}
  };
}
