import { initTRPC } from '@trpc/server';
import { walrusClient, walrusSigner } from './walrus';

export const createContext = async () => {
  return {
    walrusClient: walrusClient,
    walrusSigner: walrusSigner
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;