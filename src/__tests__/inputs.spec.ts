import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Input Handling', () => {
  beforeEach(() => {
    mockClear();
  });

  test('metadata should be exposed to parsers', async () => {
    const guard = MetaGuard({inputs: {}});
    expect(guard.metadata).toEqual({inputs: {}});
  });

  test('should have no impact when called with no options', async () => {
    const req = getMockReq();
    await MetaGuard({})(req, res, next);

    expect(next).toBeCalled();
  });

  test('should have no impact when called with no inputs', async () => {
    const req = getMockReq();
    await MetaGuard({inputs: {}})(req, res, next);

    expect(next).toBeCalled();
  });

  test('exceptions should be passed through to Express', async () => {
    const req = getMockReq();
    await expect(
      MetaGuard({inputs: {}})(req, res, () => {
        throw new Error('test');
      }),
    ).rejects.toThrow();
  });

  test('no annotation should be performed if not specified', async () => {
    const req = getMockReq();
    await MetaGuard({inputs: {name: {in: 'path'}}})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toBeUndefined();
  });

  test('annotation should be performed if requested', async () => {
    const req = getMockReq();
    await MetaGuard({inputs: {name: {in: 'path'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({name: undefined});
  });

  test('inputs should be parsed from path params', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({inputs: {name: {in: 'path'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({name: 'test'});
  });

  test('inputs should be parsed from query params', async () => {
    const req = getMockReq({query: {count: '10'}});
    await MetaGuard({inputs: {name: {in: 'path'}, count: {in: 'query'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({count: '10'});
  });

  test('inputs should be parsed from body params', async () => {
    const req = getMockReq({body: {count: 10}});
    await MetaGuard({inputs: {name: {in: 'path'}, count: {in: 'body'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({count: 10});
  });

  test('inputs should be parsed from headers', async () => {
    const req = getMockReq({headers: {Authorization: 'Bearer 1234'}});
    await MetaGuard({inputs: {name: {in: 'path'}, Authorization: {in: 'header'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({Authorization: 'Bearer 1234'});
  });

  test('inputs should be parsed from cookies', async () => {
    const req = getMockReq({cookies: {SessionID: '1234'}});
    await MetaGuard({inputs: {name: {in: 'path'}, SessionID: {in: 'cookie'}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({SessionID: '1234'});
  });

  test('inputs from invalid sources should be ignored', async () => {
    const req = getMockReq({query: {page: '1'}});
    await MetaGuard({inputs: {name: {in: 'path'}, query: {in: 'invalid' as never}}, annotateLocals: 'inputs'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.inputs).toEqual({});
  });
});
