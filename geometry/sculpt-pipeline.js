/**
 * End-to-end deterministic image-reference -> mask -> contour -> voxel -> SDF pipeline.
 * It returns data only; it never mutates the editor scene or existing models.
 */
import { normalizeReferenceImage } from "./reference-image.js";
import { extractReferenceMask } from "./reference-mask.js";
import { extractMaskContours } from "./contour-engine.js";
import { createDepthProfile } from "./depth-engine.js";
import { mirrorReferenceMask } from "./symmetry-engine.js";
import { voxelFieldFromMask } from "./voxel-field.js";
import { sdfFromVoxelField } from "./sdf-field.js";

export function processReferenceImage(image,options={}) {
  const normalized=normalizeReferenceImage(image);
  const extracted=extractReferenceMask(normalized,options.mask??{});
  if(!extracted.area)throw new Error("No foreground subject was detected in the reference image.");
  const mask=options.symmetry?.enabled
    ? mirrorReferenceMask(extracted.mask,normalized.width,normalized.height,options.symmetry)
    : extracted.mask;
  const contours=extractMaskContours(mask,normalized.width,normalized.height);
  const depth=createDepthProfile(options.depth??{});
  const depthCells=Math.max(1,Math.round(depth.depth/depth.cellSize));
  const voxelOrigin=[...depth.origin];
  if(depth.centered){const axisIndex={x:0,y:1,z:2}[depth.axis];voxelOrigin[axisIndex]-=depthCells*depth.cellSize/2;}
  const voxelField=voxelFieldFromMask(mask,normalized.width,normalized.height,{
    depth:depthCells,
    cellSize:depth.cellSize,origin:voxelOrigin,depthAxis:depth.axis,
    mirrorX:false,color:options.color??"#a0a0a0"
  });
  const sdf=sdfFromVoxelField(voxelField);
  return {
    image:{width:normalized.width,height:normalized.height},
    mask:{...extracted,mask},
    contours,depth,voxelField,sdf,
    stats:{foregroundPixels:mask.reduce((n,v)=>n+(v?1:0),0),contourCount:contours.count,voxelCount:voxelField.size,depthCells}
  };
}
