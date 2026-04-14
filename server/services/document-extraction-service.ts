import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

type CategoryForAI = {
  id: string;
  name: string;
  children: Array<{ id: string; name: string }>;
};

function buildCategoryList(categories: CategoryForAI[]) {
  return categories.flatMap((parent) => [
    { id: parent.id, name: parent.name, parentId: null },
    ...parent.children.map((child) => ({
      id: child.id,
      name: child.name,
      parentId: parent.id,
    })),
  ]);
}

function buildFilePart(fileBase64: string, mimeType: string) {
  const isImage = mimeType.startsWith("image/");
  return isImage
    ? { type: "image" as const, image: fileBase64, mediaType: mimeType }
    : { type: "file" as const, data: fileBase64, mediaType: mimeType };
}

// ── Expense extraction ──

const expenseExtractionSchema = z.object({
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

export type ExpenseExtractionResult = z.infer<typeof expenseExtractionSchema>;

// ── Recurring template extraction ──

const recurringTemplateExtractionSchema = z.object({
  title: z.string().describe("A concise name for this recurring expense"),
  description: z
    .string()
    .describe("One sentence describing the recurring charge, including the vendor/provider name"),
  amount: z
    .number()
    .positive()
    .nullable()
    .describe("The recurring amount if fixed/visible, or null if it varies"),
  currencyCode: z.string().length(3).describe("ISO 4217 currency code (e.g. USD, EUR, BGN)"),
  parentCategoryId: z
    .string()
    .nullable()
    .describe("Best matching parent category ID from the provided list, or null if unsure"),
  categoryId: z
    .string()
    .nullable()
    .describe("Best matching subcategory ID (must be a child of selected parent), or null if unsure"),
  frequency: z
    .enum(["weekly", "monthly", "yearly"])
    .nullable()
    .describe("Suggested billing frequency, or null if not determinable"),
  kind: z
    .enum(["fixed_amount", "variable_amount"])
    .describe("Whether the amount is the same every time or varies"),
});

export type RecurringTemplateExtractionResult = z.infer<typeof recurringTemplateExtractionSchema>;

// ── Bulk expense extraction ──

const bulkExpenseExtractionSchema = z.object({
  expenses: z.array(expenseExtractionSchema).describe("Array of individual transactions extracted from the screenshot"),
});

export type BulkExpenseExtractionResult = z.infer<typeof bulkExpenseExtractionSchema>;

// ── Service ──

export const documentExtractionService = {
  async extractExpense(
    fileBase64: string,
    mimeType: string,
    categories: CategoryForAI[],
  ): Promise<ExpenseExtractionResult> {
    const categoryList = buildCategoryList(categories);
    const filePart = buildFilePart(fileBase64, mimeType);

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: expenseExtractionSchema,
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

  async extractRecurringTemplate(
    fileBase64: string,
    mimeType: string,
    categories: CategoryForAI[],
  ): Promise<RecurringTemplateExtractionResult> {
    const categoryList = buildCategoryList(categories);
    const filePart = buildFilePart(fileBase64, mimeType);

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: recurringTemplateExtractionSchema,
      prompt: [
        {
          role: "user",
          content: [
            filePart,
            {
              type: "text",
              text: `Extract recurring expense/subscription information from this document (bill, subscription confirmation, contract, or statement).

Available categories for matching:
${JSON.stringify(categoryList, null, 2)}

Rules:
- title: concise name for the recurring charge (e.g. "Netflix Standard", "Electricity bill")
- description: one sentence including the vendor/provider name
- amount: the recurring amount if fixed/visible, or null if it varies each period
- currencyCode: 3-letter ISO code (e.g., USD, EUR, BGN)
- parentCategoryId: the id of the best matching parent category from the list above, or null if unsure
- categoryId: the id of the best matching subcategory (must be a child of the selected parent), or null if unsure
- frequency: "weekly", "monthly", or "yearly" based on the billing cycle shown, or null if not determinable
- kind: "fixed_amount" if the charge is always the same, "variable_amount" if it changes each period`,
            },
          ],
        },
      ],
    });

    return object;
  },

  async extractMultipleExpenses(
    fileBase64: string,
    mimeType: string,
    categories: CategoryForAI[],
  ): Promise<BulkExpenseExtractionResult> {
    const categoryList = buildCategoryList(categories);
    const filePart = buildFilePart(fileBase64, mimeType);

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: bulkExpenseExtractionSchema,
      prompt: [
        {
          role: "user",
          content: [
            filePart,
            {
              type: "text",
              text: `This is a screenshot of a transaction history, bank statement, or purchasing app (e.g. Revolut, bank app). Extract ALL individual transactions visible as separate expenses.

Available categories for matching:
${JSON.stringify(categoryList, null, 2)}

Rules:
- Extract every fully visible transaction as a separate entry in the expenses array
- Skip any partially visible or cut-off entries at the edges of the screenshot
- For each transaction:
  - title: concise description of the merchant/payee or transaction
  - description: one sentence summarizing the transaction, including the merchant name
  - amount: the transaction amount as a positive number (ignore +/- signs, treat all as expenses)
  - currencyCode: 3-letter ISO code (e.g., USD, EUR, BGN)
  - expenseDate: the date of the transaction in YYYY-MM-DD format, or null if not visible
  - parentCategoryId: the id of the best matching parent category from the list above, or null if unsure
  - categoryId: the id of the best matching subcategory (must be a child of the selected parent), or null if unsure
- Preserve the order of transactions as they appear in the screenshot`,
            },
          ],
        },
      ],
    });

    return object;
  },
};
