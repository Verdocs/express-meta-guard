import {NextFunction, Request, Response} from 'express';
import {IMetaGuardProps} from './types';
import {getParam, validateSchema} from './params';
export * from './types';

export const MetaGuard = (props: IMetaGuardProps) => {
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedInputs: Record<string, any> = {};
      const inputs = props.parameters ? Object.entries(props.parameters) : [];
      if (inputs.length > 0) {
        for await (let input of inputs) {
          const [fieldName, fieldConfig] = input;
          const {in: fieldIn, required = false, validator, formatter, schema, default: fieldDefault} = fieldConfig;

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
                  next(new Error(validationResult));
                  return;
                } else if (validationResult === false) {
                  next(new Error(`Invalid param '${fieldName}' in ${fieldIn}`));
                  return;
                }
              }
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

  if (!props.hidden) {
    guard.metadata = props;
  }

  return guard;
};
