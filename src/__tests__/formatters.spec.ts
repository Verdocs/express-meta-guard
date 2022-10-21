import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Formatters and Defaults', () => {
  beforeEach(() => {
    mockClear();
    res.locals = {}; // mockClear() doesn't seem to clear this
  });

  test('formatters will be called if specified', async () => {
    const req = getMockReq({params: {page: '10'}});
    await MetaGuard({
      parameters: {
        page: {
          in: 'path',
          formatter: (val: any) => +val,
        },
      },
      annotateLocals: 'parameters',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({page: 10});
  });

  test('defaults will be applied to fields that are not sent', async () => {
    const req = getMockReq({params: {page: '1'}});
    await MetaGuard({
      parameters: {
        page: {in: 'path', formatter: (val: any) => +val},
        count: {in: 'path', formatter: (val: any) => +val, schema: {default: 10}},
      },
      annotateLocals: 'parameters',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({page: 1, count: 10});
  });

  test('defaults will be ignored for fields that are sent', async () => {
    const req = getMockReq({params: {page: '1', count: '20'}});
    await MetaGuard({
      parameters: {
        page: {in: 'path', formatter: (val: any) => +val},
        count: {in: 'path', formatter: (val: any) => +val, schema: {default: 10}},
      },
      annotateLocals: 'parameters',
    })(req, res, next);

    expect(next).toBeCalled();
    expect(res.locals.parameters).toEqual({page: 1, count: 20});
  });
});
