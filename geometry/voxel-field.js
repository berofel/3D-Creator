/**
 * Berofel 3D Create — deterministic voxel volume.
 * Coordinates address cells; origin is the world-space lower corner.
 * No Three.js or browser dependency.
 */
const MAX_CELLS = 16_777_216;
function assertInteger(value, name) {
  if (!Number.isInteger(value)) throw new TypeError(`${name} must be an integer.`);
}
function parseHexColor(value) {
  if (typeof value !== "string") return [1, 1, 1];
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) return [1, 1, 1];
  const full = hex.length === 3 ? [...hex].map(c => c + c).join("") : hex;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
}
const FACES = [
  { n:[1,0,0], normal:[1,0,0], c:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { n:[-1,0,0], normal:[-1,0,0], c:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { n:[0,1,0], normal:[0,1,0], c:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]] },
  { n:[0,-1,0], normal:[0,-1,0], c:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]] },
  { n:[0,0,1], normal:[0,0,1], c:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
  { n:[0,0,-1], normal:[0,0,-1], c:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }
];
export class VoxelField {
  constructor({width,height,depth,cellSize=1,origin=[0,0,0]}={}) {
    for (const [name,v] of [["width",width],["height",height],["depth",depth]]) {
      assertInteger(v,name); if (v<1) throw new RangeError(`${name} must be >= 1.`);
    }
    if (width*height*depth>MAX_CELLS) throw new RangeError("Voxel field exceeds the safe cell limit.");
    if (!Number.isFinite(cellSize)||cellSize<=0) throw new RangeError("cellSize must be positive.");
    if (!Array.isArray(origin)||origin.length!==3||!origin.every(Number.isFinite)) throw new TypeError("origin must contain three finite numbers.");
    this.width=width; this.height=height; this.depth=depth; this.cellSize=cellSize; this.origin=[...origin]; this.cells=new Map();
  }
  _inside(x,y,z){return x>=0&&y>=0&&z>=0&&x<this.width&&y<this.height&&z<this.depth;}
  _key(x,y,z){return `${x},${y},${z}`;}
  set(x,y,z,value=1){
    assertInteger(x,"x");assertInteger(y,"y");assertInteger(z,"z");
    if(!this._inside(x,y,z))throw new RangeError(`Voxel (${x}, ${y}, ${z}) is outside the field.`);
    this.cells.set(this._key(x,y,z),value);return this;
  }
  get(x,y,z){return this._inside(x,y,z)?this.cells.get(this._key(x,y,z)):undefined;}
  has(x,y,z){return this._inside(x,y,z)&&this.cells.has(this._key(x,y,z));}
  delete(x,y,z){return this.cells.delete(this._key(x,y,z));}
  clear(){this.cells.clear();return this;}
  get size(){return this.cells.size;}
  fillBox(min,max,value=1){
    if(min.length!==3||max.length!==3)throw new TypeError("min and max must be 3D coordinates.");
    const lo=min.map((v,i)=>Math.max(0,Math.floor(v)));
    const hi=max.map((v,i)=>Math.min([this.width,this.height,this.depth][i]-1,Math.floor(v)));
    for(let z=lo[2];z<=hi[2];z++)for(let y=lo[1];y<=hi[1];y++)for(let x=lo[0];x<=hi[0];x++)this.set(x,y,z,value);
    return this;
  }
  removeWhere(predicate){
    if(typeof predicate!=="function")throw new TypeError("predicate must be a function.");
    for(const [key,value] of this.cells){const [x,y,z]=key.split(",").map(Number);if(predicate(value,x,y,z))this.cells.delete(key);}
    return this;
  }
  forEach(callback){for(const [key,value] of this.cells){const [x,y,z]=key.split(",").map(Number);callback(value,x,y,z);}}
  toSurfaceMesh(){
    const positions=[],normals=[],colors=[],indices=[];const s=this.cellSize,[ox,oy,oz]=this.origin;let vertexCount=0;
    this.forEach((value,x,y,z)=>{
      const color=parseHexColor(value&&typeof value==="object"?value.color:null);
      for(const face of FACES){
        const [dx,dy,dz]=face.n;if(this.has(x+dx,y+dy,z+dz))continue;
        for(const corner of face.c){
          positions.push(ox+(x+corner[0])*s,oy+(y+corner[1])*s,oz+(z+corner[2])*s);
          normals.push(...face.normal);colors.push(...color);
        }
        indices.push(vertexCount,vertexCount+1,vertexCount+2,vertexCount,vertexCount+2,vertexCount+3);vertexCount+=4;
      }
    });
    return {positions:new Float32Array(positions),normals:new Float32Array(normals),colors:new Float32Array(colors),indices:new Uint32Array(indices),vertexCount,triangleCount:indices.length/3,faceCount:vertexCount/4};
  }
  toJSON(){
    const voxels=[];this.forEach((value,x,y,z)=>voxels.push({x,y,z,value}));
    return {format:"berofel.voxel-field",version:1,dimensions:[this.width,this.height,this.depth],cellSize:this.cellSize,origin:[...this.origin],voxels};
  }
  static fromJSON(data){
    if(!data||data.format!=="berofel.voxel-field"||data.version!==1||!Array.isArray(data.voxels))throw new TypeError("Invalid VoxelField document.");
    const f=new VoxelField({width:data.dimensions?.[0],height:data.dimensions?.[1],depth:data.dimensions?.[2],cellSize:data.cellSize,origin:data.origin});
    for(const item of data.voxels)f.set(item.x,item.y,item.z,item.value);return f;
  }
}
export function voxelFieldFromMask(mask,width,height,{depth=1,cellSize=1,origin=[0,0,0],color="#a0a0a0",mirrorX=false,depthAxis="z"}={}){
  assertInteger(width,"width");assertInteger(height,"height");assertInteger(depth,"depth");
  if(!mask||mask.length!==width*height)throw new TypeError("mask length must equal width * height.");
  if(!["x","y","z"].includes(depthAxis))throw new TypeError("depthAxis must be x, y or z.");
  const dims=depthAxis==="x"?[depth,height,width]:depthAxis==="y"?[width,depth,height]:[width,height,depth];
  const field=new VoxelField({width:dims[0],height:dims[1],depth:dims[2],cellSize,origin});
  for(let py=0;py<height;py++)for(let px=0;px<width;px++){
    if(!mask[py*width+px])continue;
    const xs=mirrorX?new Set([px,width-1-px]):[px];
    for(const x of xs)for(let d=0;d<depth;d++){
      const coord=depthAxis==="x"?[d,height-1-py,x]:depthAxis==="y"?[x,d,height-1-py]:[x,height-1-py,d];
      field.set(...coord,{color,source:"reference-mask"});
    }
  }
  return field;
}
