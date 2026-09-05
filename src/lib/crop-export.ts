/** Encode only after validating the image, dimensions and drawing context. */
export async function encodeCrop(
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
) {
  const width = Math.round(crop.width),
    height = Math.round(crop.height);
  if (
    !image.naturalWidth ||
    !image.naturalHeight ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  )
    throw new Error('图片尚未加载或裁切尺寸无效，请调整比例后重试。');
  const canvas = document.createElement('canvas');
  try {
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('无法创建绘图环境，请关闭其他图片任务后重试。');
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      width,
      height,
    );
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) resolve(blob);
          else reject(new Error('无法生成裁切图片，请减少图片尺寸后重试。'));
        },
        'image/jpeg',
        0.92,
      ),
    );
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
