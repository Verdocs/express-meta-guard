import {getMockReq, getMockRes} from '@jest-mock/express';
import {MetaGuard} from '../index';

const {res, next, mockClear} = getMockRes();

describe('Input Handling', () => {
  beforeEach(() => {
    mockClear();
    res.locals = {}; // mockClear() doesn't seem to clear this
  });

  test('metadata should be exposed to parsers', async () => {
    const guard = MetaGuard({parameters: {}});
    expect(guard.metadata).toEqual({parameters: {}});
  });

  test('metadata should not be exposed if "hidden" is set', async () => {
    const guard = MetaGuard({parameters: {}, hidden: true});
    expect(guard.metadata).toBeUndefined();
  });

  test('should have no impact when called with no options', async () => {
    const req = getMockReq();
    await MetaGuard({})(req, res, next);

    expect(next).toBeCalled();
  });

  test('should have no impact when called with no parameters', async () => {
    const req = getMockReq();
    await MetaGuard({parameters: {}})(req, res, next);

    expect(next).toBeCalled();
  });

  test('exceptions should be passed through to Express', async () => {
    const req = getMockReq();
    await expect(
      MetaGuard({parameters: {}})(req, res, () => {
        throw new Error('test');
      }),
    ).rejects.toThrow();
  });
});
