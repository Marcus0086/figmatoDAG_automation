"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { Page } from "playwright";
const imageToAction = async (
  actionDescription: string,
  image: Buffer,
  validRectangles: { minX: number; minY: number; maxX: number; maxY: number }[]
) => {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      elementName: z.string(),
      boundingBox: z
        .object({
          minX: z.number(),
          minY: z.number(),
          maxX: z.number(),
          maxY: z.number(),
        })
        .nullable(),
    }),
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that can analyze an image and suggest actions based on the bounding boxes of the elements in the image. The output should include the element name and the corresponding bounding box to click in a structured format.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Action Description: ${actionDescription}`,
          },
          {
            type: "image",
            image: `data:image/png;base64,${image.toString("base64")}`,
          },
          {
            type: "text",
            text: `Valid Bounding boxes: ${JSON.stringify(validRectangles)}`,
          },
        ],
      },
    ],
  });
  return object;
};

async function generateActionPlan(
  journey: string,
  title: string,
  attributes: {
    productFamiliarity: number;
    patience: number;
    techSavviness: number;
  },
  stepsTaken?: {
    actionDescription: string;
    rationale: string;
  }[],
  previousStep?: string
) {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      steps: z.array(
        z.object({
          actionDescription: z.string(),
          rationale: z.string(),
        })
      ),
    }),
    messages: [
      {
        role: "system",
        content: `You are embodying the persona of ${title}, a real person using this application. You are provided a screenshot of the current state of the application in figma. Your characteristics shape how you interact with interfaces:

- Product familiarity: ${
          attributes.productFamiliarity * 100
        }% (how well you know this type of application)
- Patience level: ${
          attributes.patience * 100
        }% (how likely you are to persist when facing obstacles)
- Technical savviness: ${
          attributes.techSavviness * 100
        }% (how comfortable you are with technology)

Think and act like a real human user and your goal is to test the usability and discoverability of the application:
- Choose the most obvious and natural paths to achieve your goal
- Be attracted to prominent UI elements.
- If something isn't immediately visible, look in common places first (menus, settings icons).
- Don't randomly click everything.
- Consider your personality traits when deciding how to interact (e.g., low patience means you prefer quick, obvious solutions)

For each action you suggest, explain your human-like reasoning for choosing it.`,
      },
      {
        role: "assistant",
        content: `${
          previousStep ? `Your previous action was: ${previousStep}` : ""
        }`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Your goal is: ${journey}` },
          {
            type: "text",
            text: `${
              stepsTaken && stepsTaken.length > 0
                ? `Previous steps taken: \n ${stepsTaken
                    .map(
                      (step) =>
                        `Action: ${step.actionDescription} \n Rationale: ${step.rationale}`
                    )
                    .join("\n")} \n Try alternative paths if you are blocked.`
                : ""
            }`,
          },
        ],
      },
    ],
  });

  return object.steps;
}

async function checkGoalAchieved(page: Page, journey: string) {
  // Take a screenshot of the current state
  const currentScreenshot = await page.screenshot({ fullPage: true });

  // Use the LLM to assess if the goal is achieved
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      goalAchieved: z.boolean(),
    }),
    messages: [
      {
        role: "system",
        content: `You determine if the user's goal has been achieved based on the current state of the application.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Goal: ${journey}` },
          {
            type: "image",
            image: `data:image/png;base64,${currentScreenshot.toString(
              "base64"
            )}`,
          },
        ],
      },
    ],
  });

  return object.goalAchieved;
}

const generateSummary = async (
  stepstaken: {
    actionDescription: string;
    rationale: string;
  }[]
) => {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that can analyze the user experience based on the steps taken, providing insights on difficulties faced and suggestions for improvements following UX/UI best practices.`,
      },
      {
        role: "user",
        content: `Steps taken: ${stepstaken
          .map(
            (step) =>
              `Action: ${step.actionDescription} \n Rationale: ${step.rationale}`
          )
          .join("\n")}`,
      },
    ],
  });
  return text;
};

export {
  imageToAction,
  generateActionPlan,
  checkGoalAchieved,
  generateSummary,
};
