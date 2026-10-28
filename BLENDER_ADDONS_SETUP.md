# Blender add-ons — Berofel 3D Create

## Important: browser editor versus Blender

Berofel 3D Create is a browser-based Three.js editor. Blender extensions run inside Blender and cannot be embedded into this HTML app as if they were JavaScript plugins. This update adds an animal preset, links, and an AI workflow guide. It does **not** bundle proprietary add-on binaries or claim to install them automatically.

## 1. Auto-Rig Pro / Rig Library

- Official product: https://www.lucky3d.fr/auto-rig-pro/
- Use only a copy obtained from the vendor and covered by your own license.
- Install the downloaded add-on in Blender using the installation instructions supplied with that version.
- Restart Blender and verify the add-on is enabled.
- Treat the Rig Library as a reference for animal rig structure and animation workflows. A quadruped rig must still be fitted and validated for each model.

Auto-Rig Pro is commercial software. This repository does not include its code, assets, presets, or license files.

## 2. Animal Animator

- Blender Extensions page: https://extensions.blender.org/add-ons/animal-animator/
- Review the current Blender version requirements and the extension's own installation instructions before installing.
- Install through Blender's Extensions/Get Extensions interface when available, or follow the extension page's instructions.
- Test on a duplicate .blend file first. Compatibility, supported rigs, and animation quality must be verified with the current extension version.

This repository does not vendor or redistribute the extension.

## 3. Recommended round-trip

1. Create a block-based animal in Berofel 3D Create using pre-sized cuboid parts.
2. Export a GLB and keep the editable JSON project as well.
3. Open the GLB in Blender.
4. Save a working .blend copy before rigging.
5. Fit an appropriate quadruped rig; do not assume every four-legged animal shares the same skeleton or gait.
6. Apply or retarget an animation only after checking bone names, orientation, scale, foot contact, and root motion.
7. Export a test GLB and import it into Godot 4.7.2.
8. Verify the AnimationPlayer/AnimationTree, looping, root motion, camera independence, and in-game movement.

## 4. Current prototype limitations

- The new jaguar is a low-poly/block-based preview assembled from pre-sized pieces.
- Its preview animation is procedural object/pivot animation, not a skinned deformation rig.
- External Blender add-ons are linked as workflow dependencies, not loaded by the browser.
- GLB export, rig compatibility, and animation retargeting must be validated in Blender/Godot before treating the animal as production-ready.
- The editor should not report an add-on as installed merely because its link is present.
