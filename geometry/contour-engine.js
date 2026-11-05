/**
 * Extract closed pixel-boundary loops from a binary mask.
 * Coordinates are in image space; loops are deterministic and preserve holes.
 */
export function extractMaskContours(mask,width,height) {
  if(!mask||mask.length!==width*height||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
    throw new TypeError("A valid binary mask and dimensions are required.");
  const edges=[];
  const filled=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&!!mask[y*width+x];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(filled(x,y)){
    if(!filled(x,y-1))edges.push([[x,y],[x+1,y]]);
    if(!filled(x+1,y))edges.push([[x+1,y],[x+1,y+1]]);
    if(!filled(x,y+1))edges.push([[x+1,y+1],[x,y+1]]);
    if(!filled(x-1,y))edges.push([[x,y+1],[x,y]]);
  }
  const key=p=>p[0]+","+p[1],outgoing=new Map();
  edges.forEach((e,i)=>{const k=key(e[0]);if(!outgoing.has(k))outgoing.set(k,[]);outgoing.get(k).push(i);});
  const used=new Uint8Array(edges.length),contours=[];
  for(let start=0;start<edges.length;start++){
    if(used[start])continue;
    const points=[edges[start][0]],firstKey=key(edges[start][0]);let edgeIndex=start,guard=0;
    while(!used[edgeIndex]&&guard++<=edges.length+1){
      used[edgeIndex]=1;const end=edges[edgeIndex][1];points.push(end);
      if(key(end)===firstKey)break;
      const candidates=(outgoing.get(key(end))||[]).filter(i=>!used[i]);
      if(!candidates.length)break;
      edgeIndex=candidates[0];
    }
    if(points.length>=4&&key(points[0])===key(points[points.length-1])){
      const area=points.slice(0,-1).reduce((sum,p,i,a)=>sum+p[0]*a[(i+1)%a.length][1]-a[(i+1)%a.length][0]*p[1],0)/2;
      contours.push({points,area,closed:true});
    }
  }
  contours.sort((a,b)=>Math.abs(b.area)-Math.abs(a.area));
  return {contours,count:contours.length,edgeCount:edges.length};
}
