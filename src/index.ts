import {NextFunction, Request, Response, RequestHandler} from 'express';
import {getParam, validateSchema} from './params';
import {InvalidParameterError} from './errors';
import {IMetaGuardProps} from './types';
export * from './types';

export const MetaGuard = (props: IMetaGuardProps) => {
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedInputs: Record<string, any> = {};
      const inputs = props.parameters ? Object.entries(props.parameters) : [];
      if (inputs.length > 0) {
        for await (const input of inputs) {
          const [fieldName, fieldConfig] = input;
          const {in: fieldIn, required = false, validator, formatter, schema} = fieldConfig;

          let param = getParam(req, fieldName, fieldIn);
          if (param !== undefined) {
            // Format the data
            if (formatter) {
              param = formatter(param, req);
            }

            // Verify/adjust for its schema
            try {
              param = validateSchema(fieldName, fieldIn, param, schema);
            } catch (e) {
              next(e);
              return;
            }

            // Validate the data
            if (validator) {
              const validationResult = await validator(param, req);
              if (validationResult !== undefined) {
                if (typeof validationResult === 'string') {
                  next(new InvalidParameterError(validationResult));
                  return;
                } else if (validationResult === false) {
                  next(new InvalidParameterError(`Invalid param '${fieldName}' in ${fieldIn}`));
                  return;
                }
              }
            }

            parsedInputs[fieldName] = param;
          } else {
            if (schema && schema.default) {
              param = schema.default;
            } else if (required) {
              next(new InvalidParameterError(`Missing required param '${fieldName}' in ${fieldIn}`));
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

  if (!props.hidden) {
    guard.metadata = props;
  }

  return guard as RequestHandler & { metadata: any };
};
