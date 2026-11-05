/** Pure parametric surface sampling. Output is ready for the Three.js bridge. */
const vec3=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(name+" must be a finite XYZ vector.");return v;};
function range(value,fallback,name){const r=value??fallback;if(!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[1]<=r[0])throw new RangeError(name+" must contain increasing finite bounds.");return r;}
export function sampleParametricSurface(evaluate,{uSegments=32,vSegments=16,uRange=[0,Math.PI*2],vRange=[0,Math.PI],closedU=false,closedV=false}={}){
  if(typeof evaluate!=="function")throw new TypeError("evaluate must be a function.");
  for(const [name,n] of [["uSegments",uSegments],["vSegments",vSegments]])if(!Number.isInteger(n)||n<2||n>512)throw new RangeError(name+" must be an integer from 2 to 512.");
  const ur=range(uRange,[0,1],"uRange"),vr=range(vRange,[0,1],"vRange"),cols=uSegments+1,rows=vSegments+1;
  const positions=new Float32Array(cols*rows*3),normals=new Float32Array(cols*rows*3),uvs=new Float32Array(cols*rows*2),indices=new Uint32Array(uSegments*vSegments*6);
  const du=(ur[1]-ur[0])/uSegments*0.25,dv=(vr[1]-vr[0])/vSegments*0.25;
  const point=(u,v)=>vec3(evaluate(u,v),"surface point");
  for(let j=0;j<=vSegments;j++)for(let i=0;i<=uSegments;i++){
    const u=ur[0]+(ur[1]-ur[0])*i/uSegments,v=vr[0]+(vr[1]-vr[0])*j/vSegments,p=point(u,v);
    const pu0=point(Math.max(ur[0],u-du),v),pu1=point(Math.min(ur[1],u+du),v),pv0=point(u,Math.max(vr[0],v-dv)),pv1=point(u,Math.min(vr[1],v+dv));
    const a=pu1.map((x,k)=>x-pu0[k]),b=pv1.map((x,k)=>x-pv0[k]);
    let n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n);
    if(length<1e-10)n=[0,1,0];else n=n.map(x=>x/length);
    const id=j*cols+i;positions.set(p,id*3);normals.set(n,id*3);uvs.set([i/uSegments,j/vSegments],id*2);
  }
  let k=0;for(let j=0;j<vSegments;j++)for(let i=0;i<uSegments;i++){const a=j*cols+i,b=a+1,c=a+cols,d=c+1;indices.set([a,b,c,b,d,c],k);k+=6;}
  return {positions,normals,uvs,indices,vertexCount:cols*rows,triangleCount:indices.length/3,parameters:{uSegments,vSegments,uRange:ur,vRange:vr,closedU,closedV}};
}
export function parametricSphere({radius=1,center=[0,0,0],uSegments=32,vSegments=20}={}){
  if(!(radius>0)||!Number.isFinite(radius)||!Array.isArray(center)||center.length!==3||!center.every(Number.isFinite))throw new RangeError("Sphere radius and center must be valid.");
  return sampleParametricSurface((u,v)=>[center[0]+radius*Math.sin(v)*Math.cos(u),center[1]+radius*Math.cos(v),center[2]+radius*Math.sin(v)*Math.sin(u)],{uSegments,vSegments,uRange:[0,Math.PI*2],vRange:[0,Math.PI],closedU:true});
}
export function parametricTorus({majorRadius=1,minorRadius=.25,uSegments=40,vSegments=16,center=[0,0,0]}={}){
  if(!(majorRadius>0)||!(minorRadius>0)||!Number.isFinite(majorRadius)||!Number.isFinite(minorRadius)||!Array.isArray(center)||center.length!==3||!center.every(Number.isFinite))throw new RangeError("Torus radii and center must be valid.");
  return sampleParametricSurface((u,v)=>[(majorRadius+minorRadius*Math.cos(v))*Math.cos(u)+center[0],minorRadius*Math.sin(v)+center[1],(majorRadius+minorRadius*Math.cos(v))*Math.sin(u)+center[2]],{uSegments,vSegments,uRange:[0,Math.PI*2],vRange:[0,Math.PI*2],closedU:true,closedV:true});
}
