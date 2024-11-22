import { Page } from "playwright";
import sharp from "sharp";

import floodFill from "@/lib/floodFill";
import { uploadToS3 } from "@/lib/s3";

const isRedFlash = (r: number, g: number, b: number, a: number) =>
  r > 150 && g < 80 && b < 80 && a > 128;

const processImage = async (
  page: Page,
  currentNodeId: string,
  index: number
) => {
  await page.locator("canvas").click({ position: { x: 198, y: 65 } });
  const afterClickImageKey = `manual/after_click_${currentNodeId}_${index}.png`;
  const afterClickImageBuffer = await page.screenshot({
    fullPage: true,
  });
  await uploadToS3(afterClickImageBuffer, afterClickImageKey);
  // Process the image to detect red flash
  const afterImage = await sharp(afterClickImageBuffer).negate().toBuffer();
  const afterNegatedImageBuffer = await sharp(afterImage).toBuffer();
  const afterNegatedImageAlpha = sharp(afterNegatedImageBuffer).ensureAlpha();
  const afterNegatedImageKey = `manual/after_negated_${currentNodeId}_${index}.png`;
  await uploadToS3(afterNegatedImageBuffer, afterNegatedImageKey);
  const { width, height } = await afterNegatedImageAlpha.metadata();
  if (!width || !height) {
    throw new Error("Failed to get image metadata");
  }
  const imageData = await afterNegatedImageAlpha.raw().toBuffer();

  const visited = Array.from({ length: height }, () =>
    Array(width).fill(false)
  );
  const validRectangles: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    area: number;
  }[] = [];

  // Detect and process the red flash area
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!visited[y][x]) {
        const index = (y * width + x) * 4;
        const r = imageData[index];
        const g = imageData[index + 1];
        const b = imageData[index + 2];
        const a = imageData[index + 3];

        if (isRedFlash(r, g, b, a)) {
          const { minX, minY, maxX, maxY } = floodFill(
            x,
            y,
            width,
            height,
            imageData,
            visited
          );
          const detectedWidth = maxX - minX;
          const detectedHeight = maxY - minY;
          if (detectedWidth > 10 && detectedHeight > 10) {
            validRectangles.push({
              minX,
              minY,
              maxX,
              maxY,
              area: detectedWidth * detectedHeight,
            });
          }
        }
      }
    }
  }

  const annotatedImageBuffer = await sharp(afterNegatedImageBuffer)
    .composite(
      validRectangles.map((rect) => {
        const minX = Math.round(rect.minX);
        const minY = Math.round(rect.minY);
        const maxX = Math.round(rect.maxX);
        const maxY = Math.round(rect.maxY);

        return {
          input: Buffer.from(
            `<svg width="${width}" height="${height}">
            <rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${
              maxY - minY
            }" fill="none" stroke="blue" stroke-width="2"/>
            <text x="${minX + 2}" y="${
              minY - 2
            }" fill="red" stroke="black" stroke-width="0.2" font-size="8" font-family="Arial" font-weight="bold">
              (${minX}, ${minY} to ${maxX}, ${maxY})
            </text>
          </svg>`
          ),
          top: 0,
          left: 0,
        };
      })
    )
    .toBuffer();

  return { annotatedImageBuffer, validRectangles };
};

export { processImage, isRedFlash };
