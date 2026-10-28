---
name: creature-animation-presets
description: Use when creating, modeling, rigging, animating, or exporting animals in Berofel 3D Create and the RPG Godot pipeline. Reuse pre-sized block parts and validated locomotion families, and check Blender add-on compatibility instead of rebuilding every animal from scratch.
---

# Creature Animation Presets

## Goal
Create blocky, stylized creatures efficiently by assembling pre-sized pieces, selecting a suitable locomotion family, and validating the rig and animation separately from the visual model.

## Modeling workflow
1. Inspect the current Berofel 3D Create implementation and existing animal presets before changing code.
2. Assemble the creature from pre-sized cuboids and tapered low-poly parts; do not create every cube from scratch when a reusable part fits.
3. Build the silhouette first: torso, chest, rump, neck, head, muzzle, ears, legs, feet, and tail as appropriate to the species.
4. Preserve clear part names and a sensible pivot hierarchy so parts can be selected, transformed, animated, and exported.
5. Use species-appropriate proportions and markings. The jaguar preset is a large feline, not a domestic cat.
6. Preserve existing controls, touch interaction, export behavior, and other animal presets.

## Locomotion families
- Equine/running ungulates: horse, zebra, gnu and suitable antelopes; validate gait and skeleton before reuse.
- Heavy quadrupeds: cattle and buffalo; use a heavier movement profile, not automatically the horse gallop.
- Felines: jaguar, tiger, lion and related species; use feline locomotion, stalking, pounce, landing and tail balance when available.
- Canids: wolf, dog and fox.
- Birds: walking, wing flap, takeoff, flight and landing.
- Other: create a new family when existing profiles are unsuitable.

Families are starting points, not proof that skeletons or animation clips are interchangeable.

## Blender add-ons
- Auto-Rig Pro / Rig Library is commercial. Do not bundle its code/assets or claim it is installed unless the user has obtained and installed a licensed copy.
- Animal Animator is an external Blender extension. Follow its current official installation and compatibility guidance.
- The browser editor cannot execute Blender add-ons directly. Use the documented export-to-Blender workflow.
- Before retargeting, inspect bone mapping, local axes, rest pose, scale, root motion, foot contact and animation loop continuity.

## Animation and validation
1. Test the model in isolation.
2. Check idle, walk/run, and species-specific actions only when corresponding clips exist.
3. Ensure a camera is not parented to an animated limb or bone.
4. Ensure looping starts and ends in compatible poses.
5. Avoid applying root motion twice when the game controller also moves the creature.
6. Test GLB in Blender and Godot 4.7.2; report exactly what was tested.
7. Add a preset to the validated library only after a successful test. Do not claim that a preview animation is a production rig.

## Delivery report
Record the chosen family/preset, reused parts, animation source, rig/retargeting steps, tests actually run, and remaining manual work.
