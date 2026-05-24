/**
 * Preloads a list of image URLs.
 * Resolves as soon as the first starting batch (e.g. 30 frames) is loaded for immediate playback,
 * and continues to stream and cache the remaining frames in the background.
 */
export const preloadStartingBatch = (
  urls: string[],
  batchSize: number = 30,
  onProgress?: (progress: number) => void
): Promise<{ startingImages: HTMLImageElement[]; allImagesPromise: Promise<HTMLImageElement[]> }> => {
  const total = urls.length;
  const loadedImages: HTMLImageElement[] = new Array(total);

  const startingBatchUrls = urls.slice(0, Math.min(batchSize, total));
  
  // Promise that resolves once initial starting batch is loaded
  const startingBatchPromise = new Promise<HTMLImageElement[]>((resolve) => {
    let loadedCount = 0;
    const countToLoad = startingBatchUrls.length;

    if (countToLoad === 0) {
      resolve([]);
      return;
    }

    startingBatchUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        loadedImages[index] = img;
        if (onProgress) {
          onProgress(Math.round((loadedCount / countToLoad) * 100));
        }
        if (loadedCount === countToLoad) {
          resolve(loadedImages.slice(0, countToLoad));
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (onProgress) {
          onProgress(Math.round((loadedCount / countToLoad) * 100));
        }
        if (loadedCount === countToLoad) {
          resolve(loadedImages.slice(0, countToLoad));
        }
      };
    });
  });

  // Background promise that sequentially loads the remaining frames
  const allImagesPromise = new Promise<HTMLImageElement[]>(async (resolve) => {
    const startingImages = await startingBatchPromise;

    if (total <= batchSize) {
      resolve(startingImages);
      return;
    }

    let loadedCount = batchSize;
    let failedCount = 0;

    // Load remaining frames in the background
    for (let i = batchSize; i < total; i++) {
      const img = new Image();
      img.src = urls[i];
      img.onload = () => {
        loadedCount++;
        loadedImages[i] = img;
        if (loadedCount + failedCount === total) {
          resolve(loadedImages);
        }
      };
      img.onerror = () => {
        failedCount++;
        if (loadedCount + failedCount === total) {
          resolve(loadedImages);
        }
      };
    }
  });

  return startingBatchPromise.then((startingImages) => {
    return {
      startingImages,
      allImagesPromise,
    };
  });
};
