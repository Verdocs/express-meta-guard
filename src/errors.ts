/**
 * Throw a 406: Invalid Param
 */
export class InvalidParameterError extends Error {
  status = 406;

	// See https://github.com/microsoft/TypeScript/issues/13029
	/* istanbul ignore next */
  constructor(message: string) {
    super(message);
    this.status = 406;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
