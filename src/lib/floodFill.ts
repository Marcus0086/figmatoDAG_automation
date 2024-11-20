import { isRedFlash } from "./utils";

function floodFill(
  x: number,
  y: number,
  width: number,
  height: number,
  imageData: Buffer,
  visited: boolean[][]
) {
  const queue = [[x, y]];
  let minX = x,
    minY = y,
    maxX = x,
    maxY = y;
  visited[y][x] = true;

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    const index = (cy * width + cx) * 4;
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const a = imageData[index + 3];

    if (isRedFlash(r, g, b, a)) {
      if (cx < minX) minX = cx;
      if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx;
      if (cy > maxY) maxY = cy;

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          !visited[ny][nx]
        ) {
          const neighborIndex = (ny * width + nx) * 4;
          const nr = imageData[neighborIndex];
          const ng = imageData[neighborIndex + 1];
          const nb = imageData[neighborIndex + 2];
          const na = imageData[neighborIndex + 3];

          if (isRedFlash(nr, ng, nb, na)) {
            visited[ny][nx] = true;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

export default floodFill;
