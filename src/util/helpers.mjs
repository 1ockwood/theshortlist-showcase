import imageSize from 'image-size';

// return the dimensions of the provided image
export function imageDimensions(image) {
  const imageDimensions = imageSize(`./public${image}`);
  return imageDimensions;
}
