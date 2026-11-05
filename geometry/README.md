# Reference-guided geometric sculpting core

First UI-free foundation for reference-guided modeling in Berofel 3D Create.

- `voxel-field.js`: bounded voxel storage, mask extrusion, exposed-face mesh data and JSON serialization.
- `sdf-field.js`: signed-distance primitives, boolean/smooth operations, voxel-to-SDF conversion, grid sampling and marching-tetrahedra surface extraction.
- `reference-sculpt.js`: high-level helpers connecting a 2D mask to voxel and SDF representations.
- `../tests/geometry-engine.test.mjs`: Node's built-in test suite.

SDF convention: negative values are inside the solid, zero is the surface and positive values are outside.

These modules deliberately do not import Three.js or modify the editor UI. A later integration step will adapt their typed arrays into `THREE.BufferGeometry` and connect the geometry to the editor's existing scene/export pipeline.
