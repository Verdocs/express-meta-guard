import {Request} from 'express';
import {IParameterSchema, TParamSource} from './types';
import { InvalidParameterError } from './errors';

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
  let newParam = param;
  if (schema.type === 'string' && typeof param !== 'string') {
    newParam = '' + param;
  } else if (schema.type === 'integer' && typeof param === 'string') {
    newParam = +param;
    if (isNaN(newParam)) {
      throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: integer required`);
    }
  } else if (schema.type === 'number' && typeof param === 'string') {
    newParam = parseFloat(param);
    if (isNaN(newParam)) {
      throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: number required`);
    }
  } else if (schema.type === 'boolean' && typeof param === 'string') {
    if (!['0', '1', 'True', 'False', 'TRUE', 'FALSE', 'true', 'false'].includes(param)) {
      throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: boolean required`);
    }

    newParam = param === '1' || param === 'True' || param === 'TRUE' || param === 'true';
  }

  // Do any additional validations requested
  if (schema.minimum !== undefined && newParam < schema.minimum) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: must be >= ${schema.minimum}`);
  }

  if (schema.maximum !== undefined && newParam > schema.maximum) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: must be <= ${schema.maximum}`);
  }

  if (schema.exclusiveMinimum !== undefined && newParam <= schema.exclusiveMinimum) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: must be > ${schema.exclusiveMinimum}`);
  }

  if (schema.exclusiveMaximum !== undefined && newParam >= schema.exclusiveMaximum) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: must be < ${schema.exclusiveMaximum}`);
  }

  if (schema.minLength !== undefined && typeof newParam === 'string' && newParam.length < schema.minLength) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: length must be >= ${schema.minLength}`);
  }

  if (schema.maxLength !== undefined && typeof newParam === 'string' && newParam.length > schema.maxLength) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: length must be <= ${schema.maxLength}`);
  }

  if (schema.enum !== undefined && !schema.enum.includes(newParam)) {
    throw new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}: must be one of "${schema.enum.join(', ')}"`);
  }

  return newParam;
};
