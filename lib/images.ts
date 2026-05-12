const SUPPORTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function isSupportedImageType(file: File): boolean {
  return SUPPORTED_TYPES.includes(file.type);
}

export async function compressImage(
  file: File,
  options: { targetReduction?: number; maxWidthOrHeight?: number } = {},
): Promise<File> {
  const { targetReduction = 0, maxWidthOrHeight = 1920 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Optionally downscale large images
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > maxWidthOrHeight || h > maxWidthOrHeight) {
        const ratio = Math.min(maxWidthOrHeight / w, maxWidthOrHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, w, h);

      // Binary search between quality 0.5 – 0.95
      let lo = 0.5,
        hi = 0.95,
        best: Blob | null = null;
      let iterations = 0;

      const tryQuality = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));

            const reduction = 1 - blob.size / file.size;

            if (reduction >= targetReduction) best = blob;

            iterations++;
            if (iterations < 6 && Math.abs(hi - lo) > 0.02) {
              if (reduction >= targetReduction) lo = q;
              else hi = q;
              tryQuality((lo + hi) / 2);
            } else {
              const result = best ?? blob;
              // Never return something larger than the original
              if (result.size >= file.size) return resolve(file);
              resolve(
                new File([result], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
            }
          },
          "image/jpeg",
          q,
        );
      };

      tryQuality((lo + hi) / 2);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}
