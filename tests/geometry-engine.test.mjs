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
test("mask morphology can close a one-pixel gap",()=>{
  const image=rgba(3,1,(x)=>x===0||x===2?[0,0,0,255]:[255,255,255,255]);
  const result=extractReferenceMask(image,{mode:"luminance",threshold:100,morphology:[{op:"close",radius:1}]});
  assert.equal(result.area,3);
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
  const image=rgba(3,3,(x,y)=>x===1&&y===1?[255,0,0,255]:[0,0,0,0]);
  const result=processReferenceImage(image,{depth:{depth:2,cellSize:1},symmetry:{enabled:true}});
  assert.equal(result.stats.foregroundPixels,2);assert.equal(result.stats.voxelCount,4);
  assert.equal(result.stats.contourCount,1);assert.ok(result.sdf([1.5,1.5,.5])<0);
});
