/** High-level deterministic helpers for reference-guided sculpting. */
import { voxelFieldFromMask } from "./voxel-field.js";
import { sdfFromVoxelField, sdfSmoothUnion } from "./sdf-field.js";

export function createVoxelSilhouette(mask,width,height,options={}) {
  return voxelFieldFromMask(mask,width,height,options);
}
export function createSdfFromVoxelSilhouette(mask,width,height,options={}) {
  const voxelField=createVoxelSilhouette(mask,width,height,options);
  return {voxelField,sdf:sdfFromVoxelField(voxelField)};
}
export function joinOrganicParts(parts,smoothingRadius=.2) {
  if(!Array.isArray(parts)||!parts.length||parts.some(p=>typeof p!=="function"))throw new TypeError("parts must be a non-empty array of SDF functions.");
  return parts.slice(1).reduce((combined,next)=>sdfSmoothUnion(combined,next,smoothingRadius),parts[0]);
}
export function sidePixelToModel(px,py,width,height,{scale=1,center=[0,0,0],cellSize=1}={}) {
  if(![px,py,width,height,scale,cellSize,...center].every(Number.isFinite)||center.length!==3||width<=0||height<=0||scale<=0||cellSize<=0)throw new RangeError("Invalid side-view mapping parameters.");
  return [center[0]+(px-(width-1)*.5)*cellSize*scale,center[1]+((height-1)*.5-py)*cellSize*scale,center[2]];
}
