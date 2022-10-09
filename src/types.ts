import {Request} from 'express';

export type TValidator = (val: any, req: Request) => Promise<boolean | string | undefined | void> | boolean | string | undefined | void;

export type TFormatter = (val: any, req: Request) => any;

export type TParamSource = 'path' | 'query' | 'header' | 'cookie' | 'body';

export interface IParameterSchema {
  type?: 'integer' | 'number' | 'string' | 'boolean';
  format?: 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password' | string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: (string | number)[];
  // TODO: See https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#schema-object
  // title
  // multipleOf
  // exclusiveMaximum
  // exclusiveMinimum
  // pattern (This string SHOULD be a valid regular expression, according to the Ecma-262 Edition 5.1 regular expression dialect)
  // maxItems
  // minItems
  // uniqueItems
  // maxProperties
  // minProperties
  // required
}

export interface IParameter {
  in: TParamSource;
  description?: string;
  example?: string;
  validator?: TValidator;
  formatter?: TFormatter;
  required?: boolean;
  deprecated?: boolean;
  default?: any;
  schema?: IParameterSchema;
}

export interface IMetaGuardProps {
  path?: string;
  name?: string;
  description?: string;
  tags?: string[];
  parameters?: Record<string, IParameter>;
  output?: any;
  annotateLocals?: string;
  hidden?: boolean;
}
