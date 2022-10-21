import {Router} from 'express';
// import {MetaGuard} from 'express-meta-guard';
import {MetaGuard} from '../../../src';

let nextId = 2;
const dummyBooks = [{id: 1, title: 'The Cryptonomicon', author: 'Neal Stephenson'}];

export class BooksController {
  public readonly router: Router;

  constructor() {
    this.router = Router();

    // Get a list of the books in the system
    this.router.get(
      '/books',
      MetaGuard({
        tags: ['Books'],
        operationId: 'getBooks',
        description: 'Get a list of the books in the system.',
        parameters: {
          page: {in: 'query', schema: {type: 'integer', minimum: 0, maximum: 999999, default: 0}},
          limit: {in: 'query', schema: {type: 'integer', minimum: 1, maximum: 100, default: 10}},
        },
        responses: {'200': '#/components/schemas/Book[]'},
      }),
      (req, res) => {
        const {page, limit} = res.locals.parameters;
        res.json(dummyBooks.slice(page * limit, page * limit + limit));
      },
    );

    // Get a list of the books in the system
    this.router.post(
      '/books',
      MetaGuard({
        tags: ['Books'],
        operationId: 'createBook',
        description: 'Create a book.',
        parameters: {
          title: {in: 'body', required: true, schema: {type: 'string'}},
          author: {in: 'body', required: true, schema: {type: 'string'}},
        },
        responses: {'200': '#/components/schemas/Book'},
      }),
      (req, res) => {
        const {author, title} = res.locals.inputs;
        dummyBooks.push({id: nextId++, title, author});
        res.json(dummyBooks);
      },
    );
  }
}
