/**
 * Adapter between the pure geometry core and the editor's existing Three.js scene.
 * The adapter does not create UI or mutate the scene automatically.
 */
import { VoxelField, voxelFieldFromMask } from "./voxel-field.js";
import {
  sdfSphere, sdfBox, sdfCapsule, sdfCylinderY,
  sdfUnion, sdfSubtract, sdfIntersect, sdfSmoothUnion, sdfSmoothSubtract,
  sdfFromVoxelField, extractSdfSurface
} from "./sdf-field.js";
import { createVoxelSilhouette, createSdfFromVoxelSilhouette, joinOrganicParts } from "./reference-sculpt.js";
import { normalizeReferenceImage, readReferenceImage } from "./reference-image.js";
import { extractReferenceMask } from "./reference-mask.js";
import { extractMaskContours } from "./contour-engine.js";
import { createDepthProfile } from "./depth-engine.js";
import { mirrorReferenceMask } from "./symmetry-engine.js";
import { processReferenceImage } from "./sculpt-pipeline.js";
import { extractReferenceParts } from "./reference-parts.js";
import { cubicBezier, catmullRom, sampleCurve } from "./parametric-curves.js";
import { sampleParametricSurface, parametricSphere, parametricTorus } from "./parametric-surfaces.js";
import { identityMatrix4, multiplyMatrix4, composeTransform, transformPoint3, transformPositions } from "./geometry-transform.js";

export function createThreeGeometryBridge(THREE) {
  if (!THREE?.BufferGeometry || !THREE?.Float32BufferAttribute) {
    throw new TypeError("A compatible Three.js namespace is required.");
  }

  function toBufferGeometry(data) {
    if (!data?.positions || data.positions.length % 3 !== 0) {
      throw new TypeError("Geometry data must contain XYZ positions.");
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    if (data.normals?.length === data.positions.length) {
      geometry.setAttribute("normal", new THREE.BufferAttribute(data.normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
    if (data.colors?.length === data.positions.length) {
      geometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    }
    if (data.indices?.length) geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function voxelGeometry(field) {
    if (!(field instanceof VoxelField)) throw new TypeError("voxelGeometry expects a VoxelField.");
    return toBufferGeometry(field.toSurfaceMesh());
  }

  function sdfGeometry(field, bounds, resolution, isoLevel = 0) {
    return toBufferGeometry(extractSdfSurface(field, bounds, resolution, isoLevel));
  }

  return Object.freeze({
    VoxelField,
    createVoxelField: config => new VoxelField(config),
    voxelFieldFromMask,
    createVoxelSilhouette,
    createSdfFromVoxelSilhouette,
    normalizeReferenceImage, readReferenceImage, extractReferenceMask,
    extractMaskContours, createDepthProfile, mirrorReferenceMask, processReferenceImage, extractReferenceParts,
    sdfSphere, sdfBox, sdfCapsule, sdfCylinderY,
    sdfUnion, sdfSubtract, sdfIntersect, sdfSmoothUnion, sdfSmoothSubtract,
    sdfFromVoxelField,
    joinOrganicParts,
    extractSdfSurface,
    toBufferGeometry,
    voxelGeometry,
    sdfGeometry
  });
}
