/**
 * Client-side image preprocessing for better OCR results.
 * Uses Canvas API - runs entirely in the browser.
 *
 * Pipeline: Resize -> Grayscale -> Contrast Stretching -> Adaptive Threshold
 */

const TARGET_LONG_SIDE = 2500;

/** Run the full preprocessing pipeline, return a data URL of the processed image */
export async function preprocessImage(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 1. Resize so longest side is ~2500px (optimal for Tesseract at ~300 DPI)
  const scale = TARGET_LONG_SIDE / Math.max(img.width, img.height);
  if (scale < 1) {
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // 2. Convert to grayscale (luminance formula)
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 3. Contrast stretching (spread histogram to 0-255)
  let min = 255, max = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.round(((gray[i] - min) / range) * 255);
  }

  // 4. Adaptive thresholding (Sauvola-like via integral image)
  const binary = adaptiveThreshold(gray, width, height, 15, 0.2);

  // Write back to canvas
  for (let i = 0; i < binary.length; i++) {
    const v = binary[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Adaptive threshold using integral images for O(1) per pixel local mean.
 * Sauvola variant: threshold = mean * (1 + k * (stddev / 128 - 1))
 */
function adaptiveThreshold(
  gray: Uint8Array,
  width: number,
  height: number,
  windowSize: number,
  k: number,
): Uint8Array {
  const halfW = Math.floor(windowSize / 2);
  const result = new Uint8Array(width * height);

  // Build integral image and integral of squares
  const integral = new Float64Array(width * height);
  const integralSq = new Float64Array(width * height);

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    let rowSumSq = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const v = gray[idx];
      rowSum += v;
      rowSumSq += v * v;
      integral[idx] = rowSum + (y > 0 ? integral[(y - 1) * width + x] : 0);
      integralSq[idx] = rowSumSq + (y > 0 ? integralSq[(y - 1) * width + x] : 0);
    }
  }

  function getSum(img: Float64Array, x1: number, y1: number, x2: number, y2: number): number {
    x1 = Math.max(0, x1);
    y1 = Math.max(0, y1);
    x2 = Math.min(width - 1, x2);
    y2 = Math.min(height - 1, y2);
    let s = img[y2 * width + x2];
    if (x1 > 0) s -= img[y2 * width + (x1 - 1)];
    if (y1 > 0) s -= img[(y1 - 1) * width + x2];
    if (x1 > 0 && y1 > 0) s += img[(y1 - 1) * width + (x1 - 1)];
    return s;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const x1 = x - halfW;
      const y1 = y - halfW;
      const x2 = x + halfW;
      const y2 = y + halfW;
      const count = (Math.min(x2, width - 1) - Math.max(x1, 0) + 1) *
                    (Math.min(y2, height - 1) - Math.max(y1, 0) + 1);
      const sum = getSum(integral, x1, y1, x2, y2);
      const sumSq = getSum(integralSq, x1, y1, x2, y2);
      const mean = sum / count;
      const variance = sumSq / count - mean * mean;
      const stddev = Math.sqrt(Math.max(0, variance));
      const threshold = mean * (1 + k * (stddev / 128 - 1));
      const idx = y * width + x;
      result[idx] = gray[idx] > threshold ? 255 : 0;
    }
  }

  return result;
}
