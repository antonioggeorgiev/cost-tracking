import type { PlatformConfig } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createPaginatedResult, resolvePagination } from "@/lib/pagination";

let cachedConfig: PlatformConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;
const PLATFORM_CONFIG_ID = "singleton";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const platformConfigService = {
  async getConfig(): Promise<PlatformConfig> {
    if (cachedConfig && Date.now() - cachedAt < CACHE_TTL_MS) {
      return cachedConfig;
    }

    const config = await db.platformConfig.upsert({
      where: { id: PLATFORM_CONFIG_ID },
      update: {},
      create: { id: PLATFORM_CONFIG_ID },
    });

    cachedConfig = config;
    cachedAt = Date.now();
    return config;
  },

  async updateConfig(data: { signupsEnabled: boolean }) {
    const config = await db.platformConfig.upsert({
      where: { id: PLATFORM_CONFIG_ID },
      update: { signupsEnabled: data.signupsEnabled },
      create: { id: PLATFORM_CONFIG_ID, signupsEnabled: data.signupsEnabled },
    });

    cachedConfig = config;
    cachedAt = Date.now();
    return config;
  },

  async isSignupAllowed(email: string): Promise<boolean> {
    const config = await platformConfigService.getConfig();
    if (config.signupsEnabled) return true;

    const whitelisted = await db.allowedSignupEmail.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true },
    });

    return !!whitelisted;
  },

  async listAllowedEmails(options?: { page?: number; perPage?: number }) {
    const pagination = resolvePagination(options);

    const [items, total] = await Promise.all([
      db.allowedSignupEmail.findMany({
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.perPage,
      }),
      db.allowedSignupEmail.count(),
    ]);

    return createPaginatedResult(items, total, pagination);
  },

  async addAllowedEmail(email: string, note?: string) {
    const normalized = normalizeEmail(email);

    const existing = await db.allowedSignupEmail.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existing) {
      throw new Error("This email is already in the whitelist.");
    }

    return db.allowedSignupEmail.create({
      data: { email: normalized, note: note || null },
    });
  },

  async removeAllowedEmail(id: string) {
    return db.allowedSignupEmail.delete({ where: { id } });
  },
};
