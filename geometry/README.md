# Reference-guided geometric sculpting core

First UI-free foundation for reference-guided modeling in Berofel 3D Create.

- `voxel-field.js`: bounded voxel storage, mask extrusion, exposed-face mesh data and JSON serialization.
- `sdf-field.js`: signed-distance primitives, boolean/smooth operations, voxel-to-SDF conversion, grid sampling and marching-tetrahedra surface extraction.
- `reference-sculpt.js`: high-level helpers connecting a 2D mask to voxel and SDF representations.
- `../tests/geometry-engine.test.mjs`: Node's built-in test suite.

SDF convention: negative values are inside the solid, zero is the surface and positive values are outside.

These modules deliberately do not import Three.js or modify the editor UI. A later integration step will adapt their typed arrays into `THREE.BufferGeometry` and connect the geometry to the editor's existing scene/export pipeline.

## Reference shape engine

- `reference-image.js`: normalizes RGBA input and can read browser image/canvas sources.
- `reference-mask.js`: deterministic alpha, flat-background flood-fill and luminance extraction, stable connected-component IDs, per-component bounds/centroids/pixel indices, and optional morphology.
- `reference-parts.js`: keeps disconnected regions independent and builds a local mask, contours, voxel volume and SDF for each region. Small regions are retained unless the caller explicitly sets a minimum component area.
- `contour-engine.js`: extracts closed pixel-boundary loops, including holes.
- `depth-engine.js`: describes the initial single-view depth extrusion.
- `symmetry-engine.js`: mirrors a binary mask around its vertical center.
- `sculpt-pipeline.js`: coordinates image → mask → contour → symmetry/depth → voxel field → SDF.

The initial depth is an explicit modeling parameter: a single side-view image cannot uniquely reveal true body width or hidden anatomy. The pipeline returns geometry data only and does not add objects to the editor scene.

## Uso programático

O editor expõe o motor em `window.__berofelGeometryEngine`. Com uma fonte já convertida para `ImageData`:

```js
const engine = window.__berofelGeometryEngine;
const result = engine.processReferenceImage(imageData, {
  mask: { mode: "auto", minComponentArea: 8 },
  symmetry: { enabled: true, axis: "x" },
  depth: { depth: 12, cellSize: 1, axis: "z", centered: true },
  color: "#9b8b72"
});

// Dados prontos para inspeção ou conversão; nada é adicionado à cena.
const geometry = engine.voxelGeometry(result.voxelField);
```

Para fontes HTMLImageElement, ImageBitmap ou canvas, use primeiro `await engine.readReferenceImage(source)`. A etapa de criação de objeto Three.js e inclusão na cena permanece explícita e sob controle do chamador.
