/** Deterministic 2D mask symmetry around the vertical center line. */
export function mirrorReferenceMask(mask,width,height,{axis="x",includeOriginal=true}={}) {
  if(!mask||mask.length!==width*height||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
    throw new TypeError("A valid binary mask and dimensions are required.");
  if(axis!=="x")throw new TypeError("Only horizontal mirroring (axis x) is currently supported.");
  const out=new Uint8Array(mask.length);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const value=mask[y*width+x]?1:0;
    if(includeOriginal&&value)out[y*width+x]=1;
    if(value)out[y*width+(width-1-x)]=1;
  }
  return out;
}
