import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Input Handling', () => {
  beforeEach(() => {
    mockClear();
		res.locals = {}; // mockClear() doesn't seem to clear this
  });

  test('no annotation should be performed if not specified', async () => {
    const req = getMockReq();
    await MetaGuard({parameters: {name: {in: 'path'}}})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toBeUndefined();
  });

  test('annotation should be performed if requested', async () => {
    const req = getMockReq();
    await MetaGuard({parameters: {name: {in: 'path'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({name: undefined});
  });

  test('parameters should be parsed from path params', async () => {
    const req = getMockReq({params: {name: 'test'}});
    await MetaGuard({parameters: {name: {in: 'path'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({name: 'test'});
  });

  test('parameters should be parsed from query params', async () => {
    const req = getMockReq({query: {count: '10'}});
    await MetaGuard({parameters: {name: {in: 'path'}, count: {in: 'query'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({count: '10'});
  });

  test('parameters should be parsed from body params', async () => {
    const req = getMockReq({body: {count: 10}});
    await MetaGuard({parameters: {name: {in: 'path'}, count: {in: 'body'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({count: 10});
  });

  test('parameters should be parsed from headers', async () => {
    const req = getMockReq({headers: {Authorization: 'Bearer 1234'}});
    await MetaGuard({parameters: {name: {in: 'path'}, Authorization: {in: 'header'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({Authorization: 'Bearer 1234'});
  });

  test('parameters should be parsed from cookies', async () => {
    const req = getMockReq({cookies: {SessionID: '1234'}});
    await MetaGuard({parameters: {name: {in: 'path'}, SessionID: {in: 'cookie'}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({SessionID: '1234'});
  });

  test('parameters from invalid sources should be ignored', async () => {
    const req = getMockReq({query: {page: '1'}});
    await MetaGuard({parameters: {name: {in: 'path'}, query: {in: 'invalid' as never}}, annotateLocals: 'parameters'})(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({});
  });
});
