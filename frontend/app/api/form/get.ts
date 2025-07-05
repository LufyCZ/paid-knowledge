import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '..';
import { createContext } from '../trpc';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/form/get',
    req,
    router: appRouter,
    createContext
  });
}
export { handler as GET, handler as POST };