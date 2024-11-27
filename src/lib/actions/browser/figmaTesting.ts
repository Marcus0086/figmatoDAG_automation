"use server";

import { v4 as uuidv4 } from "uuid";

import {
  imageToAction,
  generateNextAction,
  checkGoalAchieved,
  generateSummary,
} from "@/lib/actions/ai";
import { processImage } from "@/lib/imageProcessing";
import { uploadToS3 } from "@/lib/s3";
import { Automation } from "@/lib/automation";

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

  await page.waitForSelector("canvas");
  await page.waitForTimeout(2000);

  const maxRetries = 2;
  const maxStepsPerAttempt = 10;
  let retries = 0;
  let success = false;
  const stepsTaken = [];
  while (!success && retries < maxRetries) {
    retries++;

    let stepsInCurrentAttempt = 0;
    const currentNodeId = uuidv4();

    // Get the canvas bounding box
    const canvasBoundingBox = await page.locator("canvas").boundingBox();
    if (!canvasBoundingBox) {
      throw new Error("Canvas element not found");
    }

    while (stepsInCurrentAttempt < maxStepsPerAttempt) {
      stepsInCurrentAttempt++;

      // Capture the current state
      const beforeClickImageBuffer = await page.screenshot({ fullPage: true });
      const beforeImageKey = `manual/before_click_${currentNodeId}_${stepsInCurrentAttempt}.png`;
      const beforeImageUrl = await uploadToS3(
        beforeClickImageBuffer,
        beforeImageKey
      );

      // Generate the next action
      const { actionDescription, rationale } = await generateNextAction(
        journey,
        title,
        attributes,
        beforeImageUrl,
        stepsTaken,
        stepsTaken.length > 0
          ? stepsTaken[stepsTaken.length - 1].actionDescription
          : ""
      );

      console.log("actionDescription", actionDescription);

      // Process the image
      const { annotatedImageBuffer, validRectangles } = await processImage(
        page,
        currentNodeId,
        stepsInCurrentAttempt
      );

      const annotatedImageKey = `manual/annotated_${currentNodeId}_${stepsInCurrentAttempt}.png`;
      const annotatedImageUrl = await uploadToS3(
        annotatedImageBuffer,
        annotatedImageKey
      );

      // Get the action bounding box
      const action = await imageToAction(
        actionDescription,
        annotatedImageUrl,
        validRectangles
      );

      if (action && action.boundingBox) {
        const { minX, minY, maxX, maxY } = action.boundingBox;
        const clickX = canvasBoundingBox.x + minX + (maxX - minX) / 2;
        const clickY = canvasBoundingBox.y + minY + (maxY - minY) / 2;
        await page.mouse.click(clickX, clickY);
        await page.waitForTimeout(2000);

        const step: {
          step: number;
          actionDescription: string;
          action: {
            elementName: string;
            boundingBox: {
              minX: number;
              minY: number;
              maxX: number;
              maxY: number;
            };
          };
          beforeImageUrl: string;
          annotatedImageUrl: string;
          rationale: string;
        } = {
          step: stepsInCurrentAttempt,
          actionDescription,
          action: {
            boundingBox: action.boundingBox,
            elementName: action.elementName,
          },
          beforeImageUrl,
          annotatedImageUrl,
          rationale,
        };
        stepsTaken.push(step);

        console.log("Taking step", step);

        // Check if the goal is achieved
        const goalAchieved = await checkGoalAchieved(page, journey);
        if (goalAchieved) {
          success = true;
          break;
        }
      } else {
        console.warn("No valid action found.");
        break; // Break the loop if no valid action is found
      }
    }

    if (!success) {
      console.log("Goal not achieved in this attempt. Will retry.");
    }
  }

  await automation.resetPage();

  const summary = await generateSummary(stepsTaken, journey);
  return { success, stepsTaken, summary };
}

export { manualTesting };
