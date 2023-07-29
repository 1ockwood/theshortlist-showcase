// calculate the luminance of a provided color
function getLuminance(color) {
  const srgb = color.map(value => {
    value /= 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = srgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// calculate the contrast ratio of two provided colors
function getContrastRatio(color1, color2) {
  const color1Luminance = getLuminance(color1);
  const color2Luminance = getLuminance(color2);
  const contrastRatio = (Math.max(color1Luminance, color2Luminance) + 0.05) / (Math.min(color1Luminance, color2Luminance) + 0.05);
  return contrastRatio;
}

// determine the color that will yield the highest contrast ratio
// if none are found, fall back to something outside the provided palette
export function getHighestContrastColor(primaryColor, palette) {
  const minContrastRatio = 4.5; // WCAG AA minimum contrast ratio
  let highestContrastFound = 0; // keep track of the highest contrast ratio found - initialize at 0
  let highestContrastColor; // keep track of the highest contrast color found
  let chosenColor;

  // loop through palette to check contrast ratio of each color against primaryColor
  for (const color of palette) {
    const contrastRatio = getContrastRatio(color, primaryColor);
    // if this is the highest contrast ratio so far, update the vars keeping track of it
    if (contrastRatio > highestContrastFound) {
      highestContrastFound = contrastRatio;
      highestContrastColor = color;
    }
  }

  // if the highest contrast color found exceeds the WCAG AA minimum, set it as the chosen color
  // else return a known high contrast color based on the primary color's luminance
  if (highestContrastFound >= minContrastRatio) {
    chosenColor = highestContrastColor;
  } else {
    chosenColor = getLuminance(primaryColor) > 0.179 ? [8,8,8] : [255,255,255];
  }

  return chosenColor;
}
