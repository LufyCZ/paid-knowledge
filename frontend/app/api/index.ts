import { router } from './trpc';
import { questionCreate } from './questions/create';
import { questionGet } from './questions/get_one';
import { questionsGet } from './questions/get';
import { answersGet } from './questions/answers/get';
import { answerCreate } from './questions/answers/create';

export const appRouter = router({
  questions: {
    create: questionCreate,
    get_one: questionGet,
    get: questionsGet,
    answers: {
      get: answersGet,
      create: answerCreate,
    }
  }
})

export type AppRouter = typeof appRouter;