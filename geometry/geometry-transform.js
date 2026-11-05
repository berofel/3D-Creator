/** Small immutable-friendly 3D transform utilities (column-major 4x4 matrices). */
const v3=(v,name)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(name+" must be a finite XYZ vector.");return v;};
export function identityMatrix4(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
export function multiplyMatrix4(a,b){
  if(!Array.isArray(a)||a.length!==16||!Array.isArray(b)||b.length!==16||![...a,...b].every(Number.isFinite))throw new TypeError("Expected two finite 4x4 matrices.");
  const out=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;
}
export function composeTransform({translation=[0,0,0],rotation=[0,0,0],scale=[1,1,1]}={}){
  v3(translation,"translation");v3(rotation,"rotation");v3(scale,"scale");if(scale.some(x=>x===0))throw new RangeError("Scale components cannot be zero.");
  const [x,y,z]=rotation,[sx,sy,sz]=scale,cx=Math.cos(x),cy=Math.cos(y),cz=Math.cos(z),rx=Math.sin(x),ry=Math.sin(y),rz=Math.sin(z);
  const rxm=[1,0,0,0,0,cx,rx,0,0,-rx,cx,0,0,0,0,1],rym=[cy,0,-ry,0,0,1,0,0,ry,0,cy,0,0,0,0,1],rzm=[cz,rz,0,0,-rz,cz,0,0,0,0,1,0,0,0,0,1];
  const sm=[sx,0,0,0,0,sy,0,0,0,0,sz,0,0,0,0,1],tm=[1,0,0,0,0,1,0,0,0,0,1,0,translation[0],translation[1],translation[2],1];
  return multiplyMatrix4(tm,multiplyMatrix4(rzm,multiplyMatrix4(rym,multiplyMatrix4(rxm,sm))));
}
export function transformPoint3(point,matrix){
  v3(point,"point");if(!Array.isArray(matrix)||matrix.length!==16||!matrix.every(Number.isFinite))throw new TypeError("matrix must contain 16 finite values.");
  const [x,y,z]=point,w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15]||1;
  return [(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/w,(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/w,(matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14])/w];
}
export function transformPositions(positions,matrix){
  if(!positions||positions.length%3!==0)throw new TypeError("positions must contain XYZ triples.");
  const out=new Float32Array(positions.length);for(let i=0;i<positions.length;i+=3)out.set(transformPoint3([positions[i],positions[i+1],positions[i+2]],matrix),i);return out;
}
