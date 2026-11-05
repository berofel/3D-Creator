/** Pure parametric curve helpers. Points are finite XYZ vectors. */
const vec3=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(name+" must be a finite XYZ vector.");return v;};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function validateT(t){if(!Number.isFinite(t))throw new TypeError("t must be finite.");return Math.max(0,Math.min(1,t));}
export function cubicBezier(points,t){
  if(!Array.isArray(points)||points.length!==4)throw new TypeError("Cubic Bézier requires exactly four control points.");
  points.forEach((p,i)=>vec3(p,"controlPoints["+i+"]"));t=validateT(t);
  const a=mix(points[0],points[1],t),b=mix(points[1],points[2],t),c=mix(points[2],points[3],t);
  return mix(mix(a,b,t),mix(b,c,t),t);
}
export function catmullRom(points,t,{tension=.5,clamp:clampOutput=true}={}){
  if(!Array.isArray(points)||points.length<2)throw new TypeError("Catmull-Rom requires at least two points.");
  points.forEach((p,i)=>vec3(p,"points["+i+"]"));
  if(!Number.isFinite(tension)||tension<0||tension>1)throw new RangeError("tension must be between 0 and 1.");
  if(!Number.isFinite(t))throw new TypeError("t must be finite.");
  t=clampOutput?validateT(t):t;
  const scaled=t*(points.length-1),i=Math.min(points.length-2,Math.floor(scaled)),u=scaled-i;
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  const s=(1-tension)*.5,u2=u*u,u3=u2*u;
  return p1.map((v,k)=>(2*u3-3*u2+1)*v+(u3-2*u2+u)*2*s*(p2[k]-p0[k])+
    (-2*u3+3*u2)*p2[k]+(u3-u2)*2*s*(p3[k]-p1[k]));
}
export function sampleCurve(evaluate,segments=32){
  if(typeof evaluate!=="function")throw new TypeError("evaluate must be a function.");
  if(!Number.isInteger(segments)||segments<1||segments>1_000_000)throw new RangeError("segments must be an integer from 1 to 1000000.");
  const points=new Float32Array((segments+1)*3);
  for(let i=0;i<=segments;i++){const p=vec3(evaluate(i/segments),"curve point");points.set(p,i*3);}
  return points;
}
