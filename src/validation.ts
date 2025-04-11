import { ValidationError } from './errors.ts';
import { Result } from './result.ts';

/**
 * Represents a validation context for building validation rules
 * in a fluent, chainable manner.
 */
export class Validator<T> {
  private readonly _value: T;
  private _errors: string[] = [];
  private _currentPropertyPath: string[] = [];
  private _customErrorMessage?: string;

  /**
   * Creates a new validation context for the given value.
   *
   * @param value - The value to validate
   */
  private constructor(value: T) {
    this._value = value;
  }

  /**
   * Creates a new validator for the specified value.
   *
   * @param value - The value to validate
   * @returns A new validator instance
   *
   * @example
   * ```typescript
   * const userValidator = Validator.for(user)
   *   .property('name', v => v.notEmpty().maxLength(100))
   *   .property('email', v => v.notEmpty().email())
   *   .property('age', v => v.isNumber().min(18));
   *
   * const result = userValidator.validate();
   * ```
   */
  public static for<U>(value: U): Validator<U> {
    return new Validator<U>(value);
  }

  /**
   * Validate a specific property of the value.
   *
   * @param propertyName - The name of the property to validate
   * @param validationFn - A function that applies validation rules to the property
   * @returns This validator instance for chaining
   */
  public property<K extends keyof T>(
    propertyName: K,
    validationFn: (validator: Validator<T[K]>) => Validator<T[K]>,
  ): Validator<T> {
    const propertyValue = this._value[propertyName];
    this._currentPropertyPath.push(String(propertyName));

    const propertyValidator = Validator.for(propertyValue);
    validationFn(propertyValidator);

    this._errors.push(
      ...propertyValidator._errors.map((error) => {
        const path = [...this._currentPropertyPath].join('.');
        return error.replace('{path}', path);
      }),
    );

    this._currentPropertyPath.pop();
    return this;
  }

  /**
   * Validate a nested object.
   *
   * @param propertyName - The name of the nested object property
   * @param validationFn - A function that applies validation rules to the nested object
   * @returns This validator instance for chaining
   */
  public nested<K extends keyof T>(
    propertyName: K,
    validationFn: (validator: Validator<T[K]>) => Validator<T[K]>,
  ): Validator<T> {
    return this.property(propertyName, validationFn);
  }

  /**
   * Validate an array of items.
   *
   * @param propertyName - The name of the array property
   * @param itemValidationFn - A function that applies validation rules to each item
   * @returns This validator instance for chaining
   */
  public array<ItemType>(
    propertyName: Extract<keyof T, string>,
    validator: (item: Validator<ItemType>) => Validator<ItemType>,
  ): Validator<T> {
    const property = this._value?.[propertyName];

    if (!property) {
      this.addError(`Property '${propertyName}' is missing or null`);
      return this;
    }

    if (!Array.isArray(property)) {
      this.addError(`Property '${propertyName}' is not an array`);
      return this;
    }

    this._currentPropertyPath.push(String(propertyName));

    property.forEach((item, index) => {
      this._currentPropertyPath.push(`[${index}]`);
      const itemValidator = Validator.for(item);
      validator(itemValidator as Validator<ItemType>);
      this._errors.push(
        ...itemValidator._errors.map((error) =>
          error.replace('{path}', [...this._currentPropertyPath].join('.'))
        ),
      );
      this._currentPropertyPath.pop();
    });

    this._currentPropertyPath.pop();
    return this;
  }

  /**
   * Sets a custom error message for the next validation rule.
   *
   * @param message - The custom error message
   * @returns This validator instance for chaining
   */
  public withMessage(message: string): Validator<T> {
    this._customErrorMessage = message;
    return this;
  }

  /**
   * Requires the value to not be null or undefined.
   *
   * @returns This validator instance for chaining
   */
  public required(): Validator<T> {
    if (this._value === null || this._value === undefined) {
      this.addError(this._customErrorMessage || '{path} is required');
    }
    return this;
  }

  /**
   * Requires a string to not be empty.
   *
   * @returns This validator instance for chaining
   */
  public notEmpty(): Validator<T> {
    if (typeof this._value === 'string' && this._value.trim() === '') {
      this.addError(this._customErrorMessage || '{path} cannot be empty');
    }
    return this;
  }

  /**
   * Validates that a string does not exceed a maximum length.
   *
   * @param length - The maximum allowed length
   * @returns This validator instance for chaining
   */
  public maxLength(length: number): Validator<T> {
    if (typeof this._value === 'string' && this._value.length > length) {
      this.addError(this._customErrorMessage || `{path} cannot exceed ${length} characters`);
    }
    return this;
  }

  /**
   * Validates that a string meets a minimum length.
   *
   * @param length - The minimum required length
   * @returns This validator instance for chaining
   */
  public minLength(length: number): Validator<T> {
    if (typeof this._value === 'string' && this._value.length < length) {
      this.addError(this._customErrorMessage || `{path} must be at least ${length} characters`);
    }
    return this;
  }

  /**
   * Validates that a value is a number.
   *
   * @returns This validator instance for chaining
   */
  public isNumber(): Validator<T> {
    if (typeof this._value !== 'number' || Number.isNaN(this._value)) {
      this.addError(this._customErrorMessage || '{path} must be a number');
    }
    return this;
  }

  /**
   * Validates that a number is at least the specified minimum.
   *
   * @param min - The minimum allowed value
   * @returns This validator instance for chaining
   */
  public min(min: number): Validator<T> {
    if (typeof this._value === 'number' && this._value < min) {
      this.addError(this._customErrorMessage || `{path} must be at least ${min}`);
    }
    return this;
  }

  /**
   * Validates that a number does not exceed the specified maximum.
   *
   * @param max - The maximum allowed value
   * @returns This validator instance for chaining
   */
  public max(max: number): Validator<T> {
    if (typeof this._value === 'number' && this._value > max) {
      this.addError(this._customErrorMessage || `{path} cannot exceed ${max}`);
    }
    return this;
  }

  /**
   * Validates that a string matches the email format.
   *
   * @returns This validator instance for chaining
   */
  public email(): Validator<T> {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof this._value === 'string' && !emailRegex.test(this._value)) {
      this.addError(this._customErrorMessage || '{path} must be a valid email address');
    }
    return this;
  }

  /**
   * Validates that a value matches the given regular expression.
   *
   * @param pattern - The regular expression pattern
   * @returns This validator instance for chaining
   */
  public matches(pattern: RegExp): Validator<T> {
    if (typeof this._value === 'string' && !pattern.test(this._value)) {
      this.addError(this._customErrorMessage || '{path} does not match the required pattern');
    }
    return this;
  }

  /**
   * Validates that a value is one of the allowed values.
   *
   * @param allowedValues - The array of allowed values
   * @returns This validator instance for chaining
   */
  public oneOf(allowedValues: unknown[]): Validator<T> {
    if (!allowedValues.includes(this._value as unknown)) {
      this.addError(
        this._customErrorMessage || `{path} must be one of: ${allowedValues.join(', ')}`,
      );
    }
    return this;
  }

  /**
   * Applies a custom validation function.
   *
   * @param predicate - A function that returns true if valid, false if invalid
   * @param errorMessage - The error message if validation fails
   * @returns This validator instance for chaining
   */
  public custom(
    predicate: (value: T) => boolean,
    errorMessage = 'Validation failed for {path}',
  ): Validator<T> {
    if (!predicate(this._value)) {
      this.addError(this._customErrorMessage || errorMessage);
    }
    return this;
  }

  /**
   * Execute the validation and return a Result.
   *
   * @returns A Result indicating success or failure with validation errors
   */
  public validate(): Result<T, ValidationError> {
    if (this._errors.length === 0) {
      return Result.ok<T, ValidationError>(this._value);
    }

    return Result.fail<T, ValidationError>(new ValidationError(this._errors.join(', ')));
  }

  /**
   * Adds an error message to the validator's error collection.
   *
   * @param errorMessage - The error message to add
   */
  private addError(errorMessage: string): void {
    const path = this._currentPropertyPath.length > 0
      ? this._currentPropertyPath.join('.')
      : 'value';

    this._errors.push(errorMessage.replace('{path}', path));
    this._customErrorMessage = undefined;
  }
}

/**
 * Shorthand function to start a validation chain.
 *
 * @param value - The value to validate
 * @returns A new validator instance
 *
 * @example
 * ```typescript
 * const result = validate(user)
 *   .property('name', v => v.notEmpty().maxLength(100))
 *   .property('email', v => v.notEmpty().email())
 *   .validate();
 * ```
 */
export function validate<T>(value: T): Validator<T> {
  return Validator.for(value);
}

// Zod schema interface
export interface ZodSchema<T> {
  parse: (data: unknown) => T;
}

// Zod error interface
export interface ZodError {
  errors: Array<{ path: string[]; message: string }>;
}

/**
 * Integrates with Zod validation library.
 *
 * @param schema - A Zod schema
 * @returns A function that converts Zod validation to Result
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email()
 * });
 *
 * const validateUser = fromZod(userSchema);
 * const result = validateUser(userData);
 * ```
 */
export const fromZod = <T>(schema: ZodSchema<T>): (data: T) => Result<T, ValidationError> => {
  return (data: T) => {
    try {
      schema.parse(data);
      return Result.ok<T, ValidationError>(data);
    } catch (error) {
      // Zod provides validation errors in a structured format
      if ((error as ZodError).errors) {
        const errorMessages = (error as ZodError).errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`,
        );
        return Result.fail<T, ValidationError>(new ValidationError(errorMessages.join(', ')));
      }
      return Result.fail<T, ValidationError>(new ValidationError(String(error)));
    }
  };
};

// Yup schema interface
export interface YupSchema<T> {
  validateSync: (data: unknown, options?: { abortEarly?: boolean }) => T;
}

// Yup error interface
export interface YupError {
  inner: Array<{ path: string; message: string }>;
}

/**
 * Integrates with Yup validation library.
 *
 * @param schema - A Yup schema
 * @returns A function that converts Yup validation to Result
 *
 * @example
 * ```typescript
 * const userSchema = yup.object({
 *   name: yup.string().required(),
 *   email: yup.string().email().required()
 * });
 *
 * const validateUser = fromYup(userSchema);
 * const result = validateUser(userData);
 * ```
 */
export const fromYup = <T>(schema: YupSchema<T>): (data: T) => Result<T, ValidationError> => {
  return (data: T) => {
    try {
      schema.validateSync(data, { abortEarly: false });
      return Result.ok<T, ValidationError>(data);
    } catch (error) {
      if ((error as YupError).inner) {
        const errorMessages = (error as YupError).inner.map(
          (err) => `${err.path}: ${err.message}`,
        );
        return Result.fail<T, ValidationError>(new ValidationError(errorMessages.join(', ')));
      }
      return Result.fail<T, ValidationError>(new ValidationError(String(error)));
    }
  };
};

// If still needed, add more specialized types and integration functions here

// Move to a dedicated examples file or wrap in comments
/*
// Example usage - not for direct execution
export const userLoader = reactRouterIntegrations.createLoader(async (params: unknown) => {
  try {
    // Example only - fetchUser would be provided by your application
    const user = await fetchUser(params.userId);
    return Result.ok(user);
  } catch (error: unknown) {
    return Result.fail(new Error(`Failed to load user: ${error instanceof Error ? error.message : String(error)}`));
  }
});
*/

// Action with validation example
// export const createUserAction = reactRouterIntegrations.createAction(
//   validator =>
//     validator
//       .property('name', name => name.notEmpty())
//       .property('email', email => email.notEmpty().email())
//       .property('age', age => age.isNumber().min(18)),

//   async validData => {
//     try {
//       const newUser = await createUser(validData);
//       return Result.ok(newUser);
//     } catch (error) {
//       return Result.fail(new Error(`Failed to create user: ${error.message}`));
//     }
//   }
// );

// async function fetchUser(userId: string): Promise<unknown> {
//   // Implementation
//   return { id: userId, name: 'User' };
// }

// async function createUser(userData: unknown): Promise<unknown> {
//   // Implementation
//   return { ...userData, id: 'new-id' };
// }
