import {NextFunction, Request} from 'express';
import {IParameter, IParameterSchema, TParamSource} from './types';

export const getParam = (req: Request, field: string, source: TParamSource) => {
  if (source === 'path') {
    return req.params[field];
  } else if (source === 'query') {
    return req.query[field];
  } else if (source === 'body') {
    return req.body[field];
  } else if (source === 'header') {
    return req.headers[field];
  } else if (source === 'cookie') {
    return req.cookies[field];
  }

  return undefined;
};

export const validateSchema = (fieldName: string, fieldIn: string, param: any, schema: IParameterSchema | undefined) => {
  if (!schema || param === undefined) {
    return param;
  }

  // Do any conversions necessary
  if (schema.type === 'string' && typeof param !== 'string') {
    return '' + param;
  } else if (schema.type === 'integer' && typeof param === 'string') {
    const newParam = +param;
    if (isNaN(newParam)) {
      throw new Error(`Invalid param '${fieldName}' in ${fieldIn}`);
    }

    return newParam;
  } else if (schema.type === 'number' && typeof param === 'string') {
    const newParam = parseFloat(param);
    if (isNaN(newParam)) {
      throw new Error(`Invalid param '${fieldName}' in ${fieldIn}`);
    }

    return newParam;
  } else if (schema.type === 'boolean' && typeof param === 'string') {
    if (!['0', '1', 'True', 'False', 'TRUE', 'FALSE', 'true', 'false'].includes(param)) {
      throw new Error(`Invalid param '${fieldName}' in ${fieldIn}`);
    }

    return param === '1' || param === 'True' || param === 'TRUE' || param === 'true';
  }

  return param;
};
