import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Schemas', () => {
  beforeEach(() => {
    mockClear();
    res.locals = {}; // mockClear() doesn't seem to clear this
  });

  // This should never really happen UNLESS a prior middleware mutates the request
  test('undefined inputs will be ignored', async () => {
    const req = getMockReq({body: {flagged: undefined}});
    await MetaGuard({
      parameters: {
        flagged: {
          in: 'body',
          required: true,
          schema: {type: 'string'},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Missing required param 'flagged' in body"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('unknown schema types should be ignored', async () => {
    const req = getMockReq({body: {flagged: 1}});
    await MetaGuard({
      parameters: {
        flagged: {
          in: 'body',
          schema: {type: 'other' as never},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({flagged: 1});
  });

  test('general inputs will be converted to strings', async () => {
    const req = getMockReq({body: {flagged: 1}});
    await MetaGuard({
      parameters: {
        flagged: {
          in: 'body',
          schema: {type: 'string'},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({flagged: '1'});
  });

  test('strings will be converted to integers', async () => {
    const req = getMockReq({params: {page: '6'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'path',
          schema: {type: 'integer'},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({page: 6});
  });

  test('strings will be converted to floats', async () => {
    const req = getMockReq({params: {amount: '10.99'}});
    await MetaGuard({
      parameters: {
        amount: {
          in: 'path',
          schema: {type: 'number'},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({amount: 10.99});
  });

  test('strings will be converted to booleans', async () => {
    const req = getMockReq({params: {enabled: 'true'}});
    await MetaGuard({
      parameters: {
        enabled: {
          in: 'path',
          schema: {type: 'boolean'},
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({enabled: true});
  });

  test('invalid integers will be rejected', async () => {
    const req = getMockReq({params: {page: 'asdf'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'path',
          schema: {
            type: 'integer',
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in path: integer required"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('invalid floats will be rejected', async () => {
    const req = getMockReq({params: {page: 'asdf'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'path',
          schema: {
            type: 'number',
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in path: number required"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('invalid booleans will be rejected', async () => {
    const req = getMockReq({params: {enabled: 'asdf'}});
    await MetaGuard({
      parameters: {
        enabled: {
          in: 'path',
          schema: {
            type: 'boolean',
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'enabled' in path: boolean required"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('minimum values will be checked', async () => {
    const req = getMockReq({query: {page: '0'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in query: must be >= 1"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('maximum values will be checked', async () => {
    const req = getMockReq({query: {page: '100'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'query',
          schema: {
            type: 'integer',
            maximum: 50,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in query: must be <= 50"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('exclusive minimum values will be checked', async () => {
    const req = getMockReq({query: {page: '0'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'query',
          schema: {
            type: 'integer',
            exclusiveMinimum: 0,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in query: must be > 0"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('xeclusive maximum values will be checked', async () => {
    const req = getMockReq({query: {page: '100'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'query',
          schema: {
            type: 'integer',
            exclusiveMaximum: 100,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in query: must be < 100"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('minimum lengths will be checked', async () => {
    const req = getMockReq({query: {countryCode: 'A'}});
    await MetaGuard({
      parameters: {
        countryCode: {
          in: 'query',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 3,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'countryCode' in query: length must be >= 2"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('maximum lengths will be checked', async () => {
    const req = getMockReq({query: {countryCode: 'ABCD'}});
    await MetaGuard({
      parameters: {
        countryCode: {
          in: 'query',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 3,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'countryCode' in query: length must be <= 3"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('enums lengths will be checked', async () => {
    const req = getMockReq({body: {lang: 'zz'}});
    await MetaGuard({
      parameters: {
        lang: {
          in: 'body',
          schema: {
            type: 'string',
            enum: ['en', 'es', 'fr'],
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error('Invalid param \'lang\' in body: must be one of "en, es, fr"'));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('defaults will be used for missing parameters', async () => {
    const req = getMockReq({query: {}});
    await MetaGuard({
      parameters: {
        limit: {
          in: 'query',
          schema: {
            type: 'integer',
            default: 10,
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(res.locals.inputs.limit).toEqual(10);
  });
});
