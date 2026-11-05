/**
 * Normalize browser ImageData-like inputs for deterministic reference processing.
 * No Three.js dependency and no editor/UI side effects.
 */
export function normalizeReferenceImage(source) {
  if (!source || !Number.isInteger(source.width) || !Number.isInteger(source.height) ||
      source.width < 1 || source.height < 1 || !source.data ||
      source.data.length !== source.width * source.height * 4) {
    throw new TypeError("Expected an RGBA image with positive width and height.");
  }
  return {
    width: source.width,
    height: source.height,
    data: new Uint8ClampedArray(source.data)
  };
}

/** Load an image/canvas/ImageBitmap into a normalized RGBA buffer in browsers. */
export async function readReferenceImage(source) {
  if (source?.data) return normalizeReferenceImage(source);
  if (!source) throw new TypeError("An image source is required.");
  let canvas, context;
  if (typeof OffscreenCanvas !== "undefined" && (source.width || source.videoWidth)) {
    canvas = new OffscreenCanvas(source.width || source.videoWidth, source.height || source.videoHeight);
    context = canvas.getContext("2d", {willReadFrequently:true});
  } else if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = source.width || source.naturalWidth || source.videoWidth;
    canvas.height = source.height || source.naturalHeight || source.videoHeight;
    context = canvas.getContext("2d", {willReadFrequently:true});
  } else {
    throw new Error("Canvas image decoding is unavailable in this environment.");
  }
  if (!canvas.width || !canvas.height || !context) throw new TypeError("The image source has no readable dimensions.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return normalizeReferenceImage(context.getImageData(0, 0, canvas.width, canvas.height));
}
