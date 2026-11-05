/**
 * Modular reference analysis. Each connected region remains independent.
 * No anatomical labels are inferred from image position alone.
 */
import { extractReferenceMask } from "./reference-mask.js";
import { extractMaskContours } from "./contour-engine.js";
import { voxelFieldFromMask } from "./voxel-field.js";
import { sdfFromVoxelField } from "./sdf-field.js";

export function extractReferenceParts(image, options = {}) {
  const extracted = extractReferenceMask(image, {
    ...(options.mask ?? {}),
    keepLargest: false
  });
  const { width, height } = extracted;
  const parts = extracted.components
    .filter(component => component.kept)
    .map(component => {
      const { minX, minY, width: partWidth, height: partHeight } = component.bounds;
      const mask = new Uint8Array(partWidth * partHeight);
      for (const index of component.pixelIndices) {
        const x = index % width, y = Math.floor(index / width);
        mask[(y - minY) * partWidth + (x - minX)] = 1;
      }
      const contours = extractMaskContours(mask, partWidth, partHeight);
      const depth = options.depth ?? {};
      const depthCells = Math.max(1, Math.round((depth.depth ?? 1) / (depth.cellSize ?? 1)));
      const axis = depth.axis ?? "z";
      const origin = [...(depth.origin ?? [0, 0, 0])];
      const cellSize = depth.cellSize ?? 1;
      if (axis === "x") { origin[2] += minX * cellSize; origin[1] -= minY * cellSize; }
      else if (axis === "y") { origin[0] += minX * cellSize; origin[2] -= minY * cellSize; }
      else { origin[0] += minX * cellSize; origin[1] -= minY * cellSize; }
      if (depth.centered !== false) origin[{ x: 0, y: 1, z: 2 }[axis]] -= depthCells * (depth.cellSize ?? 1) / 2;
      const voxelField = voxelFieldFromMask(mask, partWidth, partHeight, {
        depth: depthCells, cellSize: depth.cellSize ?? 1, origin,
        depthAxis: axis, color: options.color ?? "#a0a0a0"
      });
      return {
        id: component.id,
        source: { area: component.area, bounds: component.bounds, centroid: component.centroid },
        local: { width: partWidth, height: partHeight, mask, contours },
        voxelField,
        sdf: sdfFromVoxelField(voxelField),
        stats: { contourCount: contours.count, voxelCount: voxelField.size }
      };
    });
  return {
    image: { width, height },
    parts,
    stats: {
      detectedParts: extracted.stats.detectedComponents,
      retainedParts: parts.length,
      discardedParts: extracted.stats.discardedComponents,
      totalPixels: parts.reduce((sum, part) => sum + part.source.area, 0)
    }
  };
}
