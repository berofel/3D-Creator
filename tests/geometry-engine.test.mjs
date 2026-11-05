import test from "node:test";
import assert from "node:assert/strict";
import { VoxelField, voxelFieldFromMask } from "../geometry/voxel-field.js";
import { sdfSphere, sdfBox, sdfCapsule, sdfUnion, sdfSubtract, sdfSmoothUnion, extractSdfSurface } from "../geometry/sdf-field.js";
import { createSdfFromVoxelSilhouette, sidePixelToModel } from "../geometry/reference-sculpt.js";

test("single voxel exposes six faces",()=>{
  const f=new VoxelField({width:2,height:2,depth:2});f.set(0,0,0,{color:"#ff0000"});
  const m=f.toSurfaceMesh();assert.equal(m.faceCount,6);assert.equal(m.triangleCount,12);assert.equal(m.positions.length,72);assert.equal(m.normals.length,72);
});
test("adjacent voxels hide their shared face",()=>{
  const f=new VoxelField({width:2,height:1,depth:1});f.set(0,0,0).set(1,0,0);assert.equal(f.toSurfaceMesh().faceCount,10);
});
test("voxel JSON round trip preserves cells",()=>{
  const f=new VoxelField({width:3,height:2,depth:4,cellSize:.5,origin:[-1,0,2]});f.set(1,1,2,{color:"#123456"});
  const c=VoxelField.fromJSON(f.toJSON());assert.equal(c.size,1);assert.deepEqual(c.get(1,1,2),{color:"#123456"});assert.equal(c.cellSize,.5);
});
test("mask extrusion creates depth and optional mirror",()=>{
  const f=voxelFieldFromMask(new Uint8Array([1,0,0,0,0,0]),3,2,{depth:3,mirrorX:true});
  assert.equal(f.size,6);assert.equal(f.has(0,1,0),true);assert.equal(f.has(2,1,2),true);
});
test("SDF primitives use negative-inside convention",()=>{
  assert.ok(sdfSphere([0,0,0],[0,0,0],1)<0);assert.ok(sdfSphere([2,0,0],[0,0,0],1)>0);
  assert.ok(sdfBox([0,0,0],[0,0,0],[1,1,1])<0);assert.ok(sdfCapsule([0,0,0],[0,-1,0],[0,1,0],.5)<0);
});
test("SDF boolean operations combine and subtract volumes",()=>{
  const a=p=>sdfSphere(p,[0,0,0],1),b=p=>sdfBox(p,[.75,0,0],[.5,.5,.5]);
  assert.ok(sdfUnion(a,b)([.75,0,0])<0);assert.ok(sdfSubtract(a,b)([.75,0,0])>0);assert.ok(sdfSmoothUnion(a,b,.2)([.75,0,0])<0);
});
test("SDF surface extraction creates finite triangle geometry",()=>{
  const m=extractSdfSurface(p=>sdfSphere(p,[0,0,0],.7),{min:[-1,-1,-1],max:[1,1,1]},[18,18,18]);
  assert.ok(m.triangleCount>0);assert.equal(m.positions.length,m.normals.length);
  assert.ok([...m.positions].every(Number.isFinite));assert.ok([...m.normals].every(Number.isFinite));
});
test("reference helpers expose voxel and SDF representations",()=>{
  const r=createSdfFromVoxelSilhouette(new Uint8Array([1]),1,1,{depth:2});
  assert.equal(r.voxelField.size,2);assert.ok(r.sdf([.5,.5,.5])<0);assert.deepEqual(sidePixelToModel(0,0,3,3),[-1,1,0]);
});

import { normalizeReferenceImage } from "../geometry/reference-image.js";
import { extractReferenceMask } from "../geometry/reference-mask.js";
import { extractMaskContours } from "../geometry/contour-engine.js";
import { createDepthProfile } from "../geometry/depth-engine.js";
import { mirrorReferenceMask } from "../geometry/symmetry-engine.js";
import { processReferenceImage } from "../geometry/sculpt-pipeline.js";

function rgba(width,height,paint) {
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=paint(x,y),i=(y*width+x)*4;data.set(p,i);
  }
  return {width,height,data};
}
test("reference image normalization copies RGBA data",()=>{
  const source=rgba(1,1,()=>[10,20,30,255]),normalized=normalizeReferenceImage(source);
  source.data[0]=99;assert.equal(normalized.data[0],10);assert.equal(normalized.width,1);
});
test("alpha mask detects transparent background",()=>{
  const image=rgba(3,3,(x,y)=>x===1&&y===1?[255,0,0,255]:[0,0,0,0]);
  const result=extractReferenceMask(image);
  assert.equal(result.method,"alpha");assert.equal(result.area,1);assert.equal(result.mask[4],1);
});
test("uniform background flood fill isolates enclosed subject",()=>{
  const image=rgba(5,5,(x,y)=>x>=1&&x<=3&&y>=1&&y<=3?[220,40,30,255]:[255,255,255,255]);
  const result=extractReferenceMask(image,{mode:"background",tolerance:5});
  assert.equal(result.area,9);assert.deepEqual(result.bounds,{minX:1,minY:1,maxX:3,maxY:3,width:3,height:3});
});
test("luminance mode and component filtering remove isolated noise",()=>{
  const image=rgba(4,2,(x,y)=>x===0&&y===0||x===1&&y===0||x===2&&y===0?[0,0,0,255]:[255,255,255,255]);
  const result=extractReferenceMask(image,{mode:"luminance",threshold:100,minComponentArea:2});
  assert.equal(result.area,3);assert.equal(result.mask[7],0);
});
test("mask morphology dilation expands a subject deterministically",()=>{
  const image=rgba(5,5,(x,y)=>x===2&&y===2?[0,0,0,255]:[255,255,255,255]);
  const result=extractReferenceMask(image,{mode:"luminance",threshold:100,morphology:[{op:"dilate",radius:1}]});
  assert.equal(result.area,5);
});
test("contour engine returns closed boundary loops",()=>{
  const result=extractMaskContours(new Uint8Array([1]),1,1);
  assert.equal(result.count,1);assert.equal(result.contours[0].closed,true);
  assert.equal(result.contours[0].points.length,5);
});
test("depth profile validates and preserves axis parameters",()=>{
  assert.deepEqual(createDepthProfile({depth:4,cellSize:.5,axis:"x"}),{
    depth:4,cellSize:.5,axis:"x",centered:true,origin:[0,0,0],source:"single-view-estimated-depth"
  });
});
test("symmetry mirrors pixels around the center line",()=>{
  assert.deepEqual([...mirrorReferenceMask(new Uint8Array([1,0,0,0]),4,1)],[1,0,0,1]);
});
test("full reference pipeline creates contours, voxels and SDF without scene mutation",()=>{
  const image=rgba(3,3,(x,y)=>x===0&&y===1?[255,0,0,255]:[0,0,0,0]);
  const result=processReferenceImage(image,{depth:{depth:2,cellSize:1},symmetry:{enabled:true}});
  assert.equal(result.stats.foregroundPixels,2);assert.equal(result.stats.voxelCount,4);
  assert.equal(result.stats.contourCount,2);assert.equal(result.stats.depthCells,2);
  assert.equal(result.voxelField.origin[2],-1);assert.ok(result.sdf([.5,1.5,.5])<0);
});

import { extractReferenceParts } from "../geometry/reference-parts.js";

test("reference mask keeps stable metadata for every disconnected component",()=>{
  const image=rgba(6,4,(x,y)=>(x===0&&y===0)||(x>=3&&x<=4&&y>=2&&y<=3)
    ?[255,0,0,255]:[0,0,0,0]);
  const result=extractReferenceMask(image);
  assert.equal(result.stats.detectedComponents,2);
  assert.equal(result.stats.keptComponents,2);
  assert.deepEqual(result.components.map(c=>c.id),["part-0001","part-0002"]);
  assert.deepEqual(result.components.map(c=>c.area),[1,4]);
  assert.deepEqual(result.components[0].bounds,{minX:0,minY:0,maxX:0,maxY:0,width:1,height:1});
  assert.equal(result.components[0].pixelIndices.length,1);
});

test("modular reconstruction preserves small parts as independent voxel and SDF assets",()=>{
  const image=rgba(7,5,(x,y)=>(x===0&&y===0)||(x>=3&&x<=5&&y>=1&&y<=3)
    ?[220,30,20,255]:[0,0,0,0]);
  const result=extractReferenceParts(image,{depth:{depth:2,cellSize:1,axis:"z"}});
  assert.equal(result.parts.length,2);
  assert.equal(result.stats.detectedParts,2);
  assert.equal(result.parts[0].source.area,1);
  assert.equal(result.parts[0].voxelField.size,2);
  assert.equal(result.parts[1].voxelField.size,18);
  assert.equal(typeof result.parts[0].sdf,"function");
  assert.equal(result.parts[0].local.contours.count,1);
});


import { cubicBezier, catmullRom, sampleCurve } from "../geometry/parametric-curves.js";
import { sampleParametricSurface, parametricSphere, parametricTorus } from "../geometry/parametric-surfaces.js";
import { identityMatrix4, composeTransform, transformPoint3, transformPositions } from "../geometry/geometry-transform.js";

test("cubic Bézier interpolates endpoints and midpoint",()=>{
  const p=[[0,0,0],[1,0,0],[2,1,0],[3,1,0]];
  assert.deepEqual(cubicBezier(p,0),p[0]);assert.deepEqual(cubicBezier(p,1),p[3]);
  const mid=cubicBezier(p,.5);assert.ok(Math.abs(mid[0]-1.5)<1e-9);assert.ok(Math.abs(mid[1]-.5)<1e-9);
});
test("Catmull-Rom passes through endpoints and samples a smooth path",()=>{
  const p=[[0,0,0],[1,1,0],[2,0,0]];
  assert.deepEqual(catmullRom(p,0),p[0]);assert.deepEqual(catmullRom(p,1),p[2]);
  assert.ok(catmullRom(p,.5)[1]>.4);
});
test("curve sampler returns finite XYZ vertices",()=>{
  const data=sampleCurve(t=>[t,t*t,0],8);assert.equal(data.length,27);assert.ok([...data].every(Number.isFinite));
});
test("parametric surface sampler creates indexed grid and finite normals",()=>{
  const m=sampleParametricSurface((u,v)=>[u,v,0],{uSegments:4,vSegments:3,uRange:[0,1],vRange:[0,1]});
  assert.equal(m.vertexCount,20);assert.equal(m.triangleCount,24);assert.equal(m.indices.length,72);
  assert.ok([...m.positions,...m.normals,...m.uvs].every(Number.isFinite));
});
test("parametric sphere and torus generate valid meshes",()=>{
  const sphere=parametricSphere({radius:2,uSegments:12,vSegments:8}),torus=parametricTorus({majorRadius:2,minorRadius:.5,uSegments:12,vSegments:8});
  assert.equal(sphere.vertexCount,13*9);assert.equal(torus.triangleCount,12*8*2);
  assert.ok([...sphere.positions,...torus.positions].every(Number.isFinite));
});
test("transform composition applies scale and translation",()=>{
  const matrix=composeTransform({translation:[3,4,5],scale:[2,2,2]});
  assert.deepEqual(transformPoint3([1,1,1],matrix),[5,6,7]);
  assert.deepEqual(transformPoint3([2,3,4],identityMatrix4()),[2,3,4]);
});
test("position transform returns a new typed array",()=>{
  const source=new Float32Array([0,0,0,1,1,1]),out=transformPositions(source,composeTransform({translation:[1,0,0]}));
  assert.deepEqual([...out],[1,0,0,2,1,1]);assert.deepEqual([...source],[0,0,0,1,1,1]);
});
