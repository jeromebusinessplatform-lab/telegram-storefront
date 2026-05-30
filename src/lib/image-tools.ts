const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const colorDistance = (a: [number, number, number], b: [number, number, number]) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const averageColor = (data: Uint8ClampedArray, width: number, samples: Array<[number, number]>) => {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const [x, y] of samples) {
    const idx = (y * width + x) * 4;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
    count += 1;
  }

  return [r / count, g / count, b / count] as [number, number, number];
};

export const removeSimpleBackgroundFromDataUrl = async (dataUrl: string, tolerance = 42) => {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const sampleSize = Math.max(1, Math.floor(Math.min(width, height) * 0.05));

  const samples: Array<[number, number]> = [];
  for (let i = 0; i < sampleSize; i += 1) {
    samples.push([i, i]);
    samples.push([width - 1 - i, i]);
    samples.push([i, height - 1 - i]);
    samples.push([width - 1 - i, height - 1 - i]);
  }

  const bg = averageColor(data, width, samples);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const current: [number, number, number] = [data[idx], data[idx + 1], data[idx + 2]];
      const dist = colorDistance(current, bg);
      if (dist <= tolerance) {
        const alpha = Math.max(0, Math.min(255, Math.round((dist / tolerance) * 255)));
        data[idx + 3] = Math.min(data[idx + 3], alpha);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

