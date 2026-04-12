import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const extractionResultSchema = z.object({
  title: z.string().describe("A concise expense title derived from the receipt/invoice"),
  description: z
    .string()
    .describe("One sentence summarizing the purchase, including the vendor/store name and what was bought (e.g. 'Monthly subscription for Cursor Pro from Anysphere Inc.')"),
  amount: z.number().positive().describe("The total/final amount paid on the receipt"),
  currencyCode: z.string().length(3).describe("ISO 4217 currency code (e.g. USD, EUR, BGN)"),
  expenseDate: z
    .string()
    .nullable()
    .describe("The date on the receipt in YYYY-MM-DD format, or null if not visible"),
  parentCategoryId: z
    .string()
    .nullable()
    .describe("Best matching parent category ID from the provided list, or null if unsure"),
  categoryId: z
    .string()
    .nullable()
    .describe("Best matching subcategory ID (must be a child of selected parent), or null if unsure"),
});

export type ReceiptExtractionResult = z.infer<typeof extractionResultSchema>;

type CategoryForAI = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

export const receiptExtractionService = {
  async extractFromFile(
    fileBase64: string,
    mimeType: string,
    categories: CategoryForAI[],
  ): Promise<ReceiptExtractionResult> {
    const categoryList = categories.flatMap((parent) => [
      { id: parent.id, name: parent.name, parentId: null },
      ...parent.children.map((child) => ({
        id: child.id,
        name: child.name,
        parentId: parent.id,
      })),
    ]);

    const isImage = mimeType.startsWith("image/");

    const filePart = isImage
      ? { type: "image" as const, image: fileBase64, mediaType: mimeType }
      : { type: "file" as const, data: fileBase64, mediaType: mimeType };

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: extractionResultSchema,
      prompt: [
        {
          role: "user",
          content: [
            filePart,
            {
              type: "text",
              text: `Extract the expense information from this receipt, invoice, or financial document.

Available categories for matching:
${JSON.stringify(categoryList, null, 2)}

Rules:
- title: concise description of what was purchased
- description: one sentence summarizing the purchase, including vendor/store name and what was bought
- amount: the total/final amount paid
- currencyCode: 3-letter ISO code (e.g., USD, EUR, BGN)
- expenseDate: the date on the receipt in YYYY-MM-DD format, or null if not visible
- parentCategoryId: the id of the best matching parent category from the list above, or null if unsure
- categoryId: the id of the best matching subcategory (must be a child of the selected parent), or null if unsure`,
            },
          ],
        },
      ],
    });

    return object;
  },
};
