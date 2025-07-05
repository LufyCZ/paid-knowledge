import { initTRPC } from "@trpc/server";
import { walrusClient, createWalrusSigner } from "./walrus";

export const createContext = async () => {
  return {
    walrusClient: walrusClient,
    walrusSigner: createWalrusSigner(),
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
