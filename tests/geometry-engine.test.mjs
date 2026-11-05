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
