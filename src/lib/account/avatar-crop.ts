export const AVATAR_OUTPUT_SIZE = 512

export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

export async function loadImageFromFile(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Unable to load image'))
      image.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function cropImageToWebpBase64(input: {
  image: HTMLImageElement
  crop: CropArea
  zoom: number
  outputSize: number
}) {
  const canvas = document.createElement('canvas')
  canvas.width = input.outputSize
  canvas.height = input.outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to crop image')
  }
  const { crop } = input
  ctx.drawImage(
    input.image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    input.outputSize,
    input.outputSize,
  )
  const dataUrl = canvas.toDataURL('image/webp', 0.92)
  const base64 = dataUrl.split(',')[1] ?? ''
  return base64
}

/** Square crop centered on the image, adjusted by zoom (1 = tightest square). */
export function defaultSquareCrop(
  width: number,
  height: number,
  zoom: number,
): CropArea {
  const side = Math.min(width, height) / zoom
  const x = (width - side) / 2
  const y = (height - side) / 2
  return { x, y, width: side, height: side }
}
