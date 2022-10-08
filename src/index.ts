import {NextFunction, Request, Response} from 'express';

export type TValidator = (val: any, req: Request) => Promise<boolean | string | undefined> | boolean | string | undefined;

export type TFormatter = (val: any, req: Request) => any;

export type TParamSource = 'path' | 'query' | 'header' | 'cookie' | 'body';

export interface IInput {
  in: TParamSource;
  description?: string;
  example?: string;
  validator?: TValidator;
  formatter?: TFormatter;
  required?: boolean;
  deprecated?: boolean;
  default?: any;
}

export interface IMetaGuardProps {
  path?: string;
  name?: string;
  description?: string;
  tags?: string[];
  inputs?: Record<string, IInput>;
  output?: any;
  annotateLocals?: string;
}

const getParam = (req: Request, field: string, source: TParamSource) => {
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

export const MetaGuard = (props: IMetaGuardProps) => {
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedInputs: Record<string, any> = {};
      const inputs = props.inputs ? Object.entries(props.inputs) : [];
      if (inputs.length > 0) {
        for await (let input of inputs) {
          const [fieldName, fieldConfig] = input;
          const {in: fieldIn, required = false, validator, formatter, default: fieldDefault} = fieldConfig;

          let param = getParam(req, fieldName, fieldIn);
          if (param !== undefined) {
            if (validator) {
              const validationResult = await validator(param, req);
              if (validationResult !== undefined) {
                if (typeof validationResult === 'string') {
                  next(new Error(validationResult));
                  return;
                } else if (validationResult === false) {
                  next(new Error(`Invalid param '${fieldName}' in ${fieldIn}`));
                  return;
                }
              }
            }

            if (formatter) {
              param = formatter(param, req);
            }

            parsedInputs[fieldName] = param;
          } else {
            if (fieldDefault) {
              param = fieldDefault;
            } else if (required) {
              next(new Error(`Missing required param '${fieldName}' in ${fieldIn}`));
              return;
            }

            parsedInputs[fieldName] = param;
          }
        }

        if (props.annotateLocals) {
          res.locals[props.annotateLocals] = parsedInputs;
        }
      }

      next();
    } catch (e) {
      next(e);
    }
  };

  guard.metadata = props;

  return guard;
};
