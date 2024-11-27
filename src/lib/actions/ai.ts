"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { Page } from "playwright";

const journeyToActions = async (journey: string) => {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      actions: z.array(
        z.object({
          description: z.string(),
        })
      ),
    }),
    messages: [
      {
        role: "system",
        content: `You are helping break down a user journey into its most basic components. 
        Your task is to split compound actions into individual tasks WITHOUT making assumptions about specific UI elements or implementation details.
        
        Rules:
        1. Keep actions at a high level - don't assume UI elements exist
        2. Split compound tasks into separate actions
        3. Don't add implementation details like "click button" or "open menu"
        4. Keep the original wording from the journey where possible
        
        Examples:
        Journey: "Enable dark mode and create new meeting with others"
        Actions: [
          { description: "Enable dark mode" },
          { description: "Create new meeting with others" }
        ]

        Journey: "Create a new paper document and enter document body"
        Actions: [
          { description: "Create new paper document" },
          { description: "Enter document body" }
        ]

        Journey: "Share document with team and add comments"
        Actions: [
          { description: "Share document with team" },
          { description: "Add comments" }
        ]`,
      },
      {
        role: "user",
        content: `Journey: ${journey}`,
      },
    ],
  });
  return object.actions;
};

const imageToAction = async (
  actionDescription: string,
  imageUrl: string,
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
        content: `You are a helpful assistant that can analyze an image and suggest a clickable element based on the bounding boxes of the elements in the image based on the action description. The output should include the element name and the corresponding bounding box to click in a structured format.`,
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
            image: imageUrl,
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

async function generateNextAction(
  journey: string,
  title: string,
  attributes: {
    productFamiliarity: number;
    patience: number;
    techSavviness: number;
  },
  imageUrl: string,
  stepsTaken: {
    actionDescription: string;
    rationale: string;
  }[] = [],
  previousStep = ""
) {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      actionDescription: z.string(),
      rationale: z.string(),
    }),
    messages: [
      {
        role: "system",
        content: `You are embodying the persona of ${title}, a real person using this application. Your characteristics shape how you interact with interfaces:

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
- Be attracted to prominent UI elements
- If something isn't immediately visible, look in common places first (menus, settings icons)
- Don't randomly click everything
- Consider your personality traits when deciding how to interact (e.g., low patience means you prefer quick, obvious solutions)

For the next action, explain your human-like reasoning for choosing it.`,
      },
      {
        role: "assistant",
        content: `${
          previousStep
            ? `Your previous action was: ${previousStep}\n Try alternative paths if you are blocked.`
            : ""
        }`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Your goal is: ${journey}
                  ${
                    stepsTaken && stepsTaken.length > 0
                      ? `Previous steps taken:\n${stepsTaken
                          .map(
                            (step) =>
                              `Action: ${step.actionDescription}\nRationale: ${step.rationale}`
                          )
                          .join(
                            "\n"
                          )}\nTry alternative paths if you are blocked.`
                      : ""
                  }`,
          },
          {
            type: "image",
            image: imageUrl,
          },
        ],
      },
    ],
  });

  return object;
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
        content: `You are a helpful assistant that can analyze an image and determine if the user's goal has been achieved based on the current state of the application.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Your goal is: ${journey}` },
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
  stepsTaken: {
    actionDescription: string;
    rationale: string;
    beforeImageUrl: string;
    annotatedImageUrl: string;
  }[],
  journey: string
) => {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specializing in user experience (UX) evaluation and best practices, 
particularly experienced with Nielsen's 10 Usability Heuristics for User Interface Design.

Your task is to analyze the user journey and provide:
1. Overall Journey Analysis
   - Evaluate the completion efficiency
   - Identify any points of friction
   - Assess the intuitiveness of the path taken

2. Heuristic Evaluation (focusing on key heuristics):
   - Visibility of system status
   - Match between system and real world
   - User control and freedom
   - Consistency and standards
   - Error prevention

For each section, provide:
- Rating: Score out of 5
- Top Issues: List up to 3 key problems identified
- Recommendations: List up to 3 specific improvements
Base your analysis only on the provided steps and screenshot, Focus on the static elements visible in the screenshot and how they adhere to the heuristics. Only use the screenshot and do not make assumptions about the website's functionality beyond what is visible. 
Don't add similar or redundant feedback`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `User Journey Goal: ${journey}

Steps Taken:
${stepsTaken
  .map(
    (step, index) =>
      `Step ${index + 1}: \n
   Action: ${step.actionDescription} \n
   Rationale: ${step.rationale} \n
   Original Image of UI State: ${step.beforeImageUrl} \n
   Annotated Image of UI State: ${step.annotatedImageUrl} \n
   `
  )
  .join("\n")}`,
          },
        ],
      },
    ],
  });
  return text;
};

export {
  imageToAction,
  generateNextAction,
  checkGoalAchieved,
  generateSummary,
  journeyToActions,
};
