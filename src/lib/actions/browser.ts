"use server";

import { v4 as uuidv4 } from "uuid";

import { Automation, AutomationError } from "@/lib/automation";
import { Graph } from "@/lib/graph";
import {
  imageToAction,
  generateActionPlan,
  checkGoalAchieved,
  generateSummary,
} from "@/lib/actions/ai";
import { processImage } from "@/lib/imageProcessing";

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

async function manualTesting(
  journey: string,
  title: string,
  attributes: {
    productFamiliarity: number;
    patience: number;
    techSavviness: number;
  }
) {
  const automation = await Automation.getInstance();
  const page = await automation.getPage();
  if (!page) {
    throw new Error("Page not found");
  }
  const currentNodeId = uuidv4();
  await page.waitForSelector("canvas");
  await page.waitForTimeout(2000);
  // Initialize tracking variables
  const stepsTaken = [];
  let success = false;
  const maxRetries = 5;
  let retries = 0;

  let actionPlan = await generateActionPlan(journey, title, attributes);
  console.log("Action plan", actionPlan);
  while (!success && retries < maxRetries) {
    for (const [
      index,
      { actionDescription, rationale },
    ] of actionPlan.entries()) {
      console.log("actionDescription", actionDescription);
      const beforeClickImage = `public/images/manual/before_click_${currentNodeId}_${index}.png`;
      await page.screenshot({
        path: beforeClickImage,
        fullPage: true,
      });
      const { annotatedImageBuffer, validRectangles } = await processImage(
        page,
        currentNodeId,
        index
      );

      const action = await imageToAction(
        actionDescription,
        annotatedImageBuffer,
        validRectangles
      );
      if (action && action.boundingBox) {
        const { minX, minY, maxX, maxY } = action.boundingBox;
        await page.locator("canvas").click({
          position: {
            x: minX + (maxX - minX) / 2,
            y: minY + (maxY - minY) / 2,
          },
        });
        const step = {
          step: index + 1,
          actionDescription,
          action,
          beforeImagePath: beforeClickImage,
          annotatedImagePath: `public/images/manual/annotated_${currentNodeId}_${index}.png`,
          rationale,
        };
        stepsTaken.push(step);

        console.log("Taking step", step);

        if (await checkGoalAchieved(page, journey)) {
          success = true;
          break;
        }
      } else {
        console.warn(
          "No action found for action and element name",
          actionDescription,
          action.elementName
        );
      }
    }

    if (!success) {
      retries++;
      // regenerate the action plan
      console.log("Regenerating action plan");
      actionPlan = await generateActionPlan(
        journey,
        title,
        attributes,
        stepsTaken
      );
      console.log("New action plan", actionPlan);
    }
  }

  const summary = await generateSummary(stepsTaken);
  console.log("Summary", summary);
  return { success, stepsTaken, summary };
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
