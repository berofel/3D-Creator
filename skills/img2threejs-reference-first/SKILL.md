---
name: img2threejs-reference-first
description: Use when the user supplies a reference image for a Creature Forge model. Reconstruct visual aesthetics with img2threejs first, then add or adapt rigging without removing existing models, animations, styles, controls, or exporters.
---

# img2threejs Reference-First Workflow — Berofel 3D Create

## Non-negotiable preservation rule
This is an additive workflow. Never delete, replace, rename destructively, or simplify existing presets, animations, visual styles, controls, rig mappings, import/export features, or editor behavior. Make a backup branch before editing. Work in a feature branch and provide a diff. If a change breaks existing behavior, revert the feature branch rather than damaging the stable version.

## Phase 0 — inspect and protect
1. Read the current index.html, AI_MODELING_GUIDE.md, SAFE_UPDATE_PROTOCOL.md, and skills/creature-animation-presets/SKILL.md.
2. Identify the current Three.js version, make() conventions, parts, rig pose caching, animation update functions, preset builders, and GLB exporter.
3. Create a backup branch/tag or complete copy before changes. Record the starting commit.
4. Never assume the current file matches a prior conversation; inspect the actual branch first.

## Phase 1 — match the reference with img2threejs
1. Use the user-provided image as the visual source of truth. If the image is not available to the coding agent, stop and request it rather than guessing.
2. Follow the official img2threejs project and installation instructions: https://github.com/img2threejs/img2threejs
3. Reconstruct the silhouette, proportions, color palette, material response, surface details, and recognizable features as procedural Three.js geometry/code.
4. Keep geometry components semantically named and separable wherever later articulation needs it.
5. Render and inspect the result from front, side, and 3/4 views. Refine visual similarity before rigging.
6. Do not claim img2threejs ran if it was only described in a prompt. Record whether the agent/skill was actually available and executed.

## Phase 2 — adapt rig and animation
1. After the visual model is accepted, map its components onto the existing Creature Forge rig conventions.
2. Prefer a small adapter or additional mapping table over rewriting existing rig code.
3. Preserve all existing animation modes and presets. Add new animation support alongside the existing paths, with explicit fallbacks for unrecognized models.
4. Cache a neutral/base pose after the model is complete. Calculate each animation frame from that base pose; avoid accumulated rotations.
5. For quadrupeds, verify front/rear limb lengths, shoulder/hip pivots, elbow/knee pivots, lower limbs, feet/paws, forward reach, stance, recoil and propulsion.
6. Keep the reference-derived aesthetic and materials intact while adding the rig. Rigging must not replace geometry or restyle the model.

## Phase 3 — validation
Run the checks applicable to the actual environment:
- Existing horse, gnu, jaguar, humanoid, ogre, weapon and tree presets still load.
- Existing idle, walk, gallop, chopping and tree sequence animations still work.
- New model can be selected and transformed; hierarchy remains coherent.
- Skin/skeleton visibility controls still work.
- iPhone touch controls and camera orbit still work.
- JSON import/export and GLB/package export still work.
- New model animation loops without jumps or accumulated pose drift.
- Console has no new syntax/runtime errors.

Do not say a check passed unless it was actually executed. If browser testing is unavailable, report it as unverified.

## Required delivery
Report: backup ref, feature branch, changed files, what was preserved, tests run, tests not run, known limitations, and exact rollback instructions.
