import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Validators', () => {
  beforeEach(() => {
    mockClear();
    res.locals = {}; // mockClear() doesn't seem to clear this
  });

  test('validators should be able to throw exceptions', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: () => {
            throw new Error('test');
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error('test'));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('validators should be able to return string errors', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: () => 'test',
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error('test'));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('validators should be able to be async', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: async () => {
            return 'test';
          },
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error('test'));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('validators that return false mean invalid', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: async () => false,
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Invalid param 'name' in path"));
    expect(res.locals.inputs).toBeUndefined();
  });

  test('validators that return true mean valid', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: async () => true,
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({name: 'test'});
  });

  test('validators that return undefined mean valid', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {
          in: 'path',
          validator: async () => undefined,
        },
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({name: 'test'});
  });

  test('missing required fields will report an error', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({
      inputs: {
        name: {in: 'path'},
        country: {in: 'path', required: true},
      },
      annotateLocals: 'inputs',
    })(req, res, next);

    expect(next).toBeCalledWith(new Error("Missing required param 'country' in path"));
    expect(res.locals.inputs).toBeUndefined();
  });
});
