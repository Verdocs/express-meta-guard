import {Request} from 'express';

export type TValidator = (val: any, req: Request) => Promise<boolean | string | undefined | void> | boolean | string | undefined | void;

export type TFormatter = (val: any, req: Request) => any;

export type TParamSource = 'path' | 'query' | 'header' | 'cookie' | 'body';

export interface IParameterSchema {
  type?: 'integer' | 'number' | 'string' | 'boolean';
  format?: 'int32' | 'int64' | 'float' | 'double' | 'byte' | 'binary' | 'date' | 'date-time' | 'password' | string;
  minimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  exclusiveMinimum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: (string | number)[];

  // TODO: See https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.3.md#schema-object
  // multipleOf
  // pattern (This string SHOULD be a valid regular expression, according to the Ecma-262 Edition 5.1 regular expression dialect)
  // maxItems
  // minItems
  // uniqueItems
  // maxProperties
  // minProperties
  // required
  title?: string;
  description?: string;
  default?: any;
  deprecated?: boolean;
  example?: string;
  nullable?: boolean;
}

export interface IParameter {
  in: TParamSource;
  required?: boolean;
  formatter?: TFormatter;
  validator?: TValidator;
  schema?: IParameterSchema;
}

export interface IExternalDocs {
  url: string;
  description?: string;
}

export interface IHeader {
  name: string;
  description?: string;
  externalDocs?: IExternalDocs;
}

export interface IResponse {
  description: string;
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/Pet';
      };
    };
  };
}

export interface IMetaGuardProps {
  hidden?: boolean;
  path?: string;

  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: IExternalDocs;
  operationId?: string;
  parameters?: Record<string, IParameter>;
  requestBody?: any;
  responses?: Record<string, string | IResponse>;
  deprecated?: boolean;
  annotateLocals?: string;
}
