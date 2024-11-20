"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const imageToAction = async (
  query: string,
  image: Buffer,
  validRectangles: { minX: number; minY: number; maxX: number; maxY: number }[]
) => {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: z.object({
      action: z.string(),
      boundingBox: z.object({
        minX: z.number(),
        minY: z.number(),
        maxX: z.number(),
        maxY: z.number(),
      }),
    }),
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that can analyze an image and suggest actions based on the bounding boxes of the elements in the image. The output should include the action to perform and the corresponding bounding box to click in a structured format.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: query },
          {
            type: "image",
            image: `data:image/png;base64,${image.toString("base64")}`,
          },
          {
            type: "text",
            text: JSON.stringify(validRectangles),
          },
        ],
      },
    ],
  });
  return object;
};

export { imageToAction };
