"use server";

import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

import { Automation, AutomationError } from "@/lib/automation";
import { Graph } from "@/lib/graph";
import { isRedFlash } from "@/lib/utils";
import floodFill from "@/lib/floodFill";
import { imageToAction } from "@/lib/actions/ai";
interface BrowserResponse {
  success: boolean;
  error?: unknown;
}
interface AutomationResponse extends BrowserResponse {
  screenshots?: string[];
}

const startBrowser = async (): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.startBrowser();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

const startAutomation = async (
  graphString: string,
  startNode: string,
  endNode: string
): Promise<AutomationResponse> => {
  try {
    const graph = new Graph().parse(graphString);
    const automation = await Automation.getInstance();
    const screenshots = await automation.executeGraph(
      graph,
      startNode,
      endNode
    );
    return { success: true, screenshots };
  } catch (error) {
    console.error(error);
    if (error instanceof AutomationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error running automation" };
  }
};

const closeBrowser = async (): Promise<BrowserResponse> => {
  try {
    const automation = await Automation.getInstance();
    await automation.closeBrowser();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: error };
  }
};

async function manualTesting(journey: string) {
  const automation = await Automation.getInstance();
  const page = await automation.getPage();
  if (!page) {
    throw new Error("Page not found");
  }
  const currentNodeId = uuidv4();
  await page.waitForSelector("canvas");
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: `public/images/manual/before_click_${currentNodeId}.png`,
    fullPage: true,
  });

  // Perform click to trigger red flash
  await page.locator("canvas").click({ position: { x: 198, y: 65 } });
  await page.screenshot({
    path: `public/images/manual/after_click_${currentNodeId}.png`,
    fullPage: true,
  });

  // Process the image to detect red flash
  const afterImage = await sharp(
    `public/images/manual/after_click_${currentNodeId}.png`
  )
    .negate()
    .toBuffer();
  await sharp(afterImage).toFile(
    `public/images/manual/after_click_negated_${currentNodeId}.png`
  );
  const path = `public/images/manual/after_click_negated_${currentNodeId}.png`;
  const afterNegatedImage = sharp(path).ensureAlpha();
  const { width, height } = await afterNegatedImage.metadata();
  if (!width || !height) {
    throw new Error("Failed to get image metadata");
  }
  const imageData = await afterNegatedImage.raw().toBuffer();

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

  await sharp(path)
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
    .toFile(`public/images/manual/annotated_${currentNodeId}.png`);

  const annotatedImageBuffer = await sharp(
    `public/images/manual/annotated_${currentNodeId}.png`
  ).toBuffer();

  const action = await imageToAction(
    journey,
    annotatedImageBuffer,
    validRectangles
  );
  if (action) {
    const { minX, minY, maxX, maxY } = action.boundingBox;
    await page.locator("canvas").click({
      position: {
        x: minX + (maxX - minX) / 2,
        y: minY + (maxY - minY) / 2,
      },
    });
    return {
      success: true,
      data: {
        action,
        annotatedImage: `/images/manual/annotated_${currentNodeId}.png`,
        flashImage: `/images/manual/after_click_negated_${currentNodeId}.png`,
        originalImage: `/images/manual/before_click_${currentNodeId}.png`,
        query: journey,
        boundingBoxes: validRectangles,
      },
    };
  } else {
    console.warn("No action found");
    return {
      success: false,
      error: "No action found",
    };
  }
}

async function automatedCreateOrderDemo() {
  const automation = await Automation.getInstance();
  const page = await automation.getPage();
  if (!page) {
    throw new Error("Page not found");
  }
  await page.waitForSelector("canvas");
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: `public/images/automated/create_order_start.png`,
  });

  // click on create order
  await page.locator("canvas").click({
    position: {
      x: 1032,
      y: 75,
    },
  });
  await page.screenshot({
    path: `public/images/automated/create_order.png`,
  });
  await page.waitForTimeout(1000);
  // Fill the Create Order form

  await page.screenshot({
    path: `public/images/automated/create_order_form_blank.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 507,
      y: 106,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_form_filled.png`,
  });
  await page.waitForTimeout(1000);
  await page.locator("canvas").click({
    position: {
      x: 1050,
      y: 574,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_items.png`,
  });
  await page.waitForTimeout(1000);

  // Next to add payment
  await page.screenshot({
    path: `public/images/automated/create_order_payment_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 1051,
      y: 575,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_payment.png`,
  });
  await page.waitForTimeout(1000);

  // Click on Payment milestone
  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 588,
      y: 150,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone.png`,
  });
  await page.waitForTimeout(1000);

  // Change calculated from (Percentage) to (Fixed)
  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone_fixed_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 510,
      y: 261,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone_fixed.png`,
  });
  await page.waitForTimeout(1000);

  // Save the payment milestone
  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone_saved_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 688,
      y: 506,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_payment_milestone_saved.png`,
  });
  await page.waitForTimeout(1000);

  // Click on next to see items and payment milestones
  await page.screenshot({
    path: `public/images/automated/create_order_items_payment_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 1055,
      y: 575,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_items_payment.png`,
  });
  await page.waitForTimeout(1000);

  // Click on create to create the order
  await page.screenshot({
    path: `public/images/automated/create_order_create_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 960,
      y: 582,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_create.png`,
  });
  await page.waitForTimeout(1000);

  // Click on send Acknowledgement
  await page.screenshot({
    path: `public/images/automated/create_order_send_acknowledgement_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 977,
      y: 114,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_send_acknowledgement.png`,
  });
  await page.waitForTimeout(10000);

  // click on generate invoice
  await page.screenshot({
    path: `public/images/automated/create_order_generate_invoice_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 1011,
      y: 124,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_generate_invoice.png`,
  });
  await page.waitForTimeout(1000);

  // click on create invoice
  await page.screenshot({
    path: `public/images/automated/create_order_create_invoice_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 1044,
      y: 24,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_create_invoice.png`,
  });
  await page.waitForTimeout(1000);

  // click on save
  await page.screenshot({
    path: `public/images/automated/create_order_save_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 864,
      y: 15,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_save.png`,
  });
  await page.waitForTimeout(1000);

  // click on view invoice and payment
  await page.screenshot({
    path: `public/images/automated/create_order_view_invoice_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 976,
      y: 120,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_view_invoice.png`,
  });
  await page.waitForTimeout(1000);

  // close the invoice
  await page.screenshot({
    path: `public/images/automated/create_order_close_invoice_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 881,
      y: 44,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_close_invoice.png`,
  });
  await page.waitForTimeout(1000);

  // go back to the orders
  await page.screenshot({
    path: `public/images/automated/create_order_back_to_orders_start.png`,
  });
  await page.locator("canvas").click({
    position: {
      x: 231,
      y: 70,
    },
  });

  await page.screenshot({
    path: `public/images/automated/create_order_back_to_orders.png`,
  });
  await page.waitForTimeout(1000);

  //end
  await automation.closeBrowser();
}

export {
  startBrowser,
  closeBrowser,
  startAutomation,
  automatedCreateOrderDemo,
  manualTesting,
};
export type { BrowserResponse, AutomationResponse };
