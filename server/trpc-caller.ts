import { cache } from "react";
import { appRouter } from "@/server/routers/_app";
import { createTrpcContext } from "@/server/trpc";

export const getServerCaller = cache(async () => {
  const ctx = await createTrpcContext();

  return appRouter.createCaller(ctx);
});
