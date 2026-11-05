/** Initial deterministic depth profile for a single-view silhouette. */
export function createDepthProfile(options={}) {
  const depth=options.depth??8,cellSize=options.cellSize??1,axis=options.axis??"z";
  if(!Number.isFinite(depth)||depth<=0||!Number.isFinite(cellSize)||cellSize<=0)
    throw new RangeError("Depth and cellSize must be positive finite numbers.");
  if(!["x","y","z"].includes(axis))throw new TypeError("Depth axis must be x, y or z.");
  return Object.freeze({depth,cellSize,axis,centered:options.centered!==false,
    origin:Array.isArray(options.origin)?[...options.origin]:[0,0,0],
    source:"single-view-estimated-depth"});
}
