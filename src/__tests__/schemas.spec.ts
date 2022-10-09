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

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in path"));
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

    expect(next).toBeCalledWith(new Error("Invalid param 'page' in path"));
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

    expect(next).toBeCalledWith(new Error("Invalid param 'enabled' in path"));
    expect(res.locals.inputs).toBeUndefined();
  });
});
