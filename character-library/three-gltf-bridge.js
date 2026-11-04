/**
 * Berofel Character Library — Three.js GLB bridge.
 *
 * This module deliberately receives the editor's existing GLTFLoader and THREE
 * namespace. It does not create a second Three.js runtime or alter existing rigs.
 * It provides a safe loading/assembly primitive for a later UI integration.
 */

export function createCharacterAssetBridge({ THREE, gltfLoader, onStatus = () => {} } = {}) {
  if (!THREE || !gltfLoader) {
    throw new Error("CharacterAssetBridge requires the editor's THREE namespace and GLTFLoader instance.");
  }

  const loaded = new Map();

  async function load(url, options = {}) {
    if (!url || typeof url !== "string") throw new TypeError("A GLB/glTF URL is required.");
    const cacheKey = options.cacheKey || url;
    if (!options.reload && loaded.has(cacheKey)) return cloneAsset(loaded.get(cacheKey));

    onStatus("Carregando componente: " + (options.name || cacheKey));
    const gltf = await gltfLoader.loadAsync(url);
    const source = gltf.scene || gltf.scenes?.[0];
    if (!source) throw new Error("The GLB file contains no scene.");

    source.updateMatrixWorld(true);
    const record = {
      scene: source,
      animations: Array.isArray(gltf.animations) ? gltf.animations : [],
      assetUrl: url,
      name: options.name || source.name || cacheKey
    };
    loaded.set(cacheKey, record);
    onStatus("Componente carregado: " + record.name);
    return cloneAsset(record);
  }

  function cloneAsset(record) {
    const scene = record.scene.clone(true);
    scene.traverse(object => {
      if (object.isSkinnedMesh && object.skeleton) {
        object.skeleton = object.skeleton.clone();
      }
    });
    return {
      scene,
      animations: record.animations.slice(),
      assetUrl: record.assetUrl,
      name: record.name
    };
  }

  function findBone(root, boneName) {
    let found = null;
    root?.traverse(object => {
      if (!found && object.isBone && object.name === boneName) found = object;
    });
    return found;
  }

  /**
   * Attach an accessory (hair, helmet, weapon, etc.) to a named bone.
   * This does not merge meshes or rewrite the target skeleton.
   */
  function attachToBone({ target, asset, boneName, position, rotation, scale } = {}) {
    if (!target || !asset?.scene || !boneName) {
      throw new Error("target, asset.scene and boneName are required.");
    }
    const bone = findBone(target, boneName);
    if (!bone) throw new Error("Bone not found: " + boneName);

    const object = asset.scene;
    bone.add(object);
    if (position) object.position.set(position.x || 0, position.y || 0, position.z || 0);
    if (rotation) object.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    if (scale) object.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
    object.userData = {
      ...object.userData,
      berofelLibraryAsset: true,
      berofelAttachmentBone: boneName,
      berofelAssetUrl: asset.assetUrl || ""
    };
    return object;
  }

  /**
   * Mount a compatible modular component at a named anchor.
   * For skinned clothing, the asset must already use a compatible skeleton;
   * this helper intentionally does not pretend to retarget skin weights.
   */
  function mountAtAnchor({ target, asset, anchorName, position, rotation, scale } = {}) {
    if (!target || !asset?.scene || !anchorName) {
      throw new Error("target, asset.scene and anchorName are required.");
    }
    const anchor = target.getObjectByName(anchorName);
    if (!anchor) throw new Error("Anchor not found: " + anchorName);

    const object = asset.scene;
    anchor.add(object);
    if (position) object.position.set(position.x || 0, position.y || 0, position.z || 0);
    if (rotation) object.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    if (scale) object.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
    object.userData = {
      ...object.userData,
      berofelLibraryAsset: true,
      berofelAnchor: anchorName,
      berofelAssetUrl: asset.assetUrl || ""
    };
    return object;
  }

  function clearCache() {
    loaded.clear();
  }

  return { load, attachToBone, mountAtAnchor, findBone, clearCache };
}
