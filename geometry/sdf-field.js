/**
 * Berofel 3D Create — Signed Distance Field primitives and meshing.
 * SDF convention: negative = inside, zero = surface, positive = outside.
 * No Three.js or browser dependency.
 */
const EPS=1e-8, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const len=v=>Math.hypot(...v), sub=(a,b)=>a.map((v,i)=>v-b[i]), add=(a,b)=>a.map((v,i)=>v+b[i]), mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>{const n=len(v);return n>EPS?mul(v,1/n):[0,1,0];};
function vec(v,name){if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(`${name} must be a finite 3D vector.`);}
export function sdfSphere(p,c=[0,0,0],r=1){vec(p,"point");vec(c,"center");if(!(r>0)||!Number.isFinite(r))throw new RangeError("radius must be positive.");return len(sub(p,c))-r;}
export function sdfBox(p,c=[0,0,0],h=[1,1,1]){
  vec(p,"point");vec(c,"center");vec(h,"halfExtents");if(h.some(v=>v<=0))throw new RangeError("halfExtents must be positive.");
  const q=sub(p,c).map((v,i)=>Math.abs(v)-h[i]);return len(q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0);
}
export function sdfCapsule(p,a,b,r=.5){
  vec(p,"point");vec(a,"a");vec(b,"b");if(!(r>0)||!Number.isFinite(r))throw new RangeError("radius must be positive.");
  const pa=sub(p,a),ba=sub(b,a),h=clamp(dot(pa,ba)/Math.max(dot(ba,ba),EPS),0,1);return len(sub(pa,mul(ba,h)))-r;
}
export function sdfCylinderY(p,c=[0,0,0],r=1,hh=1){
  vec(p,"point");vec(c,"center");if(!(r>0)||!(hh>0))throw new RangeError("Cylinder dimensions must be positive.");
  const q=sub(p,c),d=[Math.hypot(q[0],q[2])-r,Math.abs(q[1])-hh];
  return Math.min(Math.max(d[0],d[1]),0)+Math.hypot(Math.max(d[0],0),Math.max(d[1],0));
}
export const sdfUnion=(a,b)=>p=>Math.min(a(p),b(p));
export const sdfSubtract=(a,b)=>p=>Math.max(a(p),-b(p));
export const sdfIntersect=(a,b)=>p=>Math.max(a(p),b(p));
export function sdfSmoothUnion(a,b,k=.25){
  if(!(k>0))throw new RangeError("Smoothing radius must be positive.");
  return p=>{const da=a(p),db=b(p),h=clamp(.5+.5*(db-da)/k,0,1);return db*(1-h)+da*h-k*h*(1-h);};
}
export function sdfSmoothSubtract(a,b,k=.25){
  if(!(k>0))throw new RangeError("Smoothing radius must be positive.");
  return p=>{const da=a(p),db=-b(p),h=clamp(.5-.5*(db-da)/k,0,1);return db*(1-h)+da*h+k*h*(1-h);};
}
export function sdfFromVoxelField(field){
  if(!field||typeof field.forEach!=="function"||!Number.isFinite(field.cellSize))throw new TypeError("Expected a VoxelField-like object.");
  const boxes=[];field.forEach((_v,x,y,z)=>boxes.push([field.origin[0]+(x+.5)*field.cellSize,field.origin[1]+(y+.5)*field.cellSize,field.origin[2]+(z+.5)*field.cellSize]));
  if(!boxes.length)return ()=>Infinity;const h=field.cellSize*.5;
  return p=>{let best=Infinity;for(const c of boxes)best=Math.min(best,sdfBox(p,c,[h,h,h]));return best;};
}
export function estimateGradient(field,p,e=1e-3){
  if(!(e>0))throw new RangeError("epsilon must be positive.");const [x,y,z]=p;
  return norm([field([x+e,y,z])-field([x-e,y,z]),field([x,y+e,z])-field([x,y-e,z]),field([x,y,z+e])-field([x,y,z-e])]);
}
function interpolate(a,b,va,vb,iso){const d=vb-va,t=Math.abs(d)<EPS?.5:clamp((iso-va)/d,0,1);return a.map((v,i)=>v+(b[i]-v)*t);}
export function sampleSdf(field,bounds,resolution){
  if(typeof field!=="function")throw new TypeError("field must be a function.");vec(bounds?.min,"bounds.min");vec(bounds?.max,"bounds.max");vec(resolution,"resolution");
  const dims=resolution.map(v=>{if(!Number.isInteger(v)||v<2)throw new RangeError("Each resolution axis must be an integer >= 2.");return v;});
  if(dims[0]*dims[1]*dims[2]>8_000_000)throw new RangeError("SDF sample grid exceeds the safe limit.");
  const step=bounds.min.map((v,i)=>(bounds.max[i]-v)/(dims[i]-1));if(step.some(v=>!(v>0)))throw new RangeError("bounds.max must exceed bounds.min on every axis.");
  const values=new Float32Array(dims[0]*dims[1]*dims[2]),idx=(x,y,z)=>x+dims[0]*(y+dims[1]*z);
  for(let z=0;z<dims[2];z++)for(let y=0;y<dims[1];y++)for(let x=0;x<dims[0];x++){
    const p=[bounds.min[0]+x*step[0],bounds.min[1]+y*step[1],bounds.min[2]+z*step[2]],d=field(p);
    if(!Number.isFinite(d))throw new Error(`SDF returned a non-finite value at (${x}, ${y}, ${z}).`);values[idx(x,y,z)]=d;
  }
  return {values,dimensions:dims,min:[...bounds.min],max:[...bounds.max],step};
}
const CORNERS=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
const TETS=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
/** Marching tetrahedra extraction; returns a non-indexed triangle mesh. */
export function extractSdfSurface(field,bounds,resolution,isoLevel=0){
  if(!Number.isFinite(isoLevel))throw new TypeError("isoLevel must be finite.");
  const g=sampleSdf(field,bounds,resolution),[nx,ny,nz]=g.dimensions,{values,min,step}=g;
  const idx=(x,y,z)=>x+nx*(y+ny*z),positions=[],normals=[],eps=Math.min(...step)*.25;
  const tri=(a,b,c)=>{
    const center=mul(add(add(a,b),c),1/3),face=norm(cross(sub(b,a),sub(c,a))),gradient=estimateGradient(field,center,eps);
    if(dot(face,gradient)<0)[b,c]=[c,b];
    for(const p of [a,b,c]){positions.push(...p);normals.push(...estimateGradient(field,p,eps));}
  };
  for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
    const pts=CORNERS.map(([dx,dy,dz])=>[min[0]+(x+dx)*step[0],min[1]+(y+dy)*step[1],min[2]+(z+dz)*step[2]]);
    const vals=CORNERS.map(([dx,dy,dz])=>values[idx(x+dx,y+dy,z+dz)]-isoLevel);
    for(const tet of TETS){
      const inside=[],outside=[];for(const id of tet)(vals[id]<0?inside:outside).push(id);
      if(!inside.length||inside.length===4)continue;
      const edge=(a,b)=>interpolate(pts[a],pts[b],vals[a],vals[b],0);
      if(inside.length===1)tri(edge(inside[0],outside[0]),edge(inside[0],outside[1]),edge(inside[0],outside[2]));
      else if(inside.length===3)tri(edge(outside[0],inside[0]),edge(outside[0],inside[1]),edge(outside[0],inside[2]));
      else{
        const a=edge(inside[0],outside[0]),b=edge(inside[0],outside[1]),c=edge(inside[1],outside[0]),d=edge(inside[1],outside[1]);
        tri(a,b,c);tri(b,d,c);
      }
    }
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),indices:null,vertexCount:positions.length/3,triangleCount:positions.length/9,bounds:{min:[...min],max:[...g.max]}};
}
