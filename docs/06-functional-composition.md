# Functional Composition with Result

This tutorial shows how to use the Result monad to achieve clean functional composition while
handling errors gracefully.

## Railway-Oriented Programming

The Result monad enables a style of programming called "Railway-Oriented Programming," where success
and failure flow on separate tracks:

```
Success track: ---> [Operation A] ---> [Operation B] ---> [Operation C] ---> Result
                      |                  |                  |
                      v                  v                  v
Failure track: -------->------------------>----------------->------->
```

When any operation fails, the computation switches to the failure track and skips remaining
operations.

## Data Transformation Pipelines

Build data transformation pipelines that handle errors at each step:

```typescript
import { Result } from '@kumak/result-monad';

// Step 1: Parse raw data
function parseInput(input: string): Result<any, Error> {
  return Result.fromThrowable(() => JSON.parse(input));
}

// Step 2: Validate parsed data
function validateData(data: any): Result<ValidData, Error> {
  if (!data.id || typeof data.id !== 'string') {
    return Result.fail(new ValidationError('Invalid ID format'));
  }

  if (!Array.isArray(data.values) || !data.values.every((v) => typeof v === 'number')) {
    return Result.fail(new ValidationError('Values must be an array of numbers'));
  }

  return Result.ok({
    id: data.id,
    values: data.values as number[],
  });
}

// Step 3: Process data
function processData(validData: ValidData): Result<ProcessedData, Error> {
  try {
    const sum = validData.values.reduce((acc, val) => acc + val, 0);
    const average = sum / validData.values.length;

    return Result.ok({
      id: validData.id,
      count: validData.values.length,
      sum,
      average,
    });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// Compose all steps into a single operation
function processInput(input: string): Result<ProcessedData, Error> {
  return parseInput(input)
    .flatMap(validateData)
    .flatMap(processData);
}

// Usage
const result = processInput('{"id": "sample", "values": [1, 2, 3, 4, 5]}');
```

## Function Composition

Create higher-order functions that compose operations:

```typescript
// Compose two functions that return Results
function compose<A, B, C, E extends Error>(
  f: (a: A) => Result<B, E>,
  g: (b: B) => Result<C, E>,
): (a: A) => Result<C, E> {
  return (a: A) => f(a).flatMap(g);
}

// Compose multiple functions that return Results
function pipe<A, E extends Error>(
  a: A,
): Result<A, E>;

function pipe<A, B, E extends Error>(
  a: A,
  ab: (a: A) => Result<B, E>,
): Result<B, E>;

function pipe<A, B, C, E extends Error>(
  a: A,
  ab: (a: A) => Result<B, E>,
  bc: (b: B) => Result<C, E>,
): Result<C, E>;

// Add more overloads for additional steps as needed

function pipe<A, E extends Error>(
  a: A,
  ...fns: Array<(x: any) => Result<any, E>>
): Result<any, E> {
  return fns.reduce(
    (result, fn) => result.flatMap(fn),
    Result.ok<A, E>(a),
  );
}

// Example usage
const parseJSON = (json: string) => Result.fromThrowable(() => JSON.parse(json));
const extractName = (obj: any) =>
  obj.name ? Result.ok(obj.name) : Result.fail(new Error('Name missing'));
const validateName = (name: string) =>
  name.length > 2 ? Result.ok(name) : Result.fail(new Error('Name too short'));
const formatName = (name: string) => Result.ok(name.toUpperCase());

// Using compose
const processName = compose(
  compose(
    compose(
      parseJSON,
      extractName,
    ),
    validateName,
  ),
  formatName,
);

// Using pipe (cleaner)
const processNameWithPipe = (json: string) =>
  pipe(
    json,
    parseJSON,
    extractName,
    validateName,
    formatName,
  );
```

## Processing Collections

Process collections of items with Result:

```typescript
// Map a function that returns Result over an array
function mapResult<T, U, E extends Error>(
  items: T[],
  fn: (item: T) => Result<U, E>,
): Result<U[], E> {
  const results: U[] = [];

  for (const item of items) {
    const result = fn(item);

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    results.push(result.value);
  }

  return Result.ok(results);
}

// Filter collection elements using a predicate that returns Result
function filterResult<T, E extends Error>(
  items: T[],
  predicate: (item: T) => Result<boolean, E>,
): Result<T[], E> {
  const results: T[] = [];

  for (const item of items) {
    const result = predicate(item);

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    if (result.value) {
      results.push(item);
    }
  }

  return Result.ok(results);
}

// Example usage
const numbers = [1, 2, 3, 4, 5];

const doubled = mapResult(numbers, (n) => Result.ok(n * 2));
const evens = filterResult(numbers, (n) => Result.ok(n % 2 === 0));
```

## Context Passing

Pass context through a chain of operations:

```typescript
interface AppContext {
  userId: string;
  authToken: string;
  logger: (message: string) => void;
}

// Create a function with context that returns a Result
function withContext<T, E extends Error>(
  context: AppContext,
  fn: (ctx: AppContext) => Result<T, E>,
): Result<T, E> {
  try {
    return fn(context);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error as E : new Error(String(error)) as E,
    );
  }
}

// Example usage with context
const fetchUserData = (context: AppContext) => {
  context.logger(`Fetching data for user: ${context.userId}`);

  if (!context.authToken) {
    return Result.fail(new UnauthorizedError('Missing authentication token'));
  }

  // Simulate fetch with context
  return Result.ok({
    id: context.userId,
    name: 'John Doe',
    email: 'john@example.com',
  });
};

const processUserProfile = (context: AppContext) => {
  return withContext(context, (ctx) =>
    fetchUserData(ctx).map((user) => {
      ctx.logger(`Processing profile for user: ${user.id}`);
      return {
        displayName: user.name,
        contact: user.email,
      };
    }));
};

// Use with context
const context: AppContext = {
  userId: '123',
  authToken: 'token-123',
  logger: console.log,
};

const profileResult = processUserProfile(context);
```

## Optional Values with Result

Handle optional values more elegantly than with null checks:

```typescript
// Create a Result from an optional value
function fromOptional<T, E extends Error>(
  value: T | null | undefined,
  errorFn: () => E,
): Result<T, E> {
  if (value === null || value === undefined) {
    return Result.fail(errorFn());
  }
  return Result.ok(value);
}

// Example usage
const getUser = (id: string): User | null => {
  // Simulate user lookup that might return null
  return id === '123' ? { id: '123', name: 'John' } : null;
};

const getUserResult = (id: string): Result<User, Error> => {
  return fromOptional(
    getUser(id),
    () => new NotFoundError('User', id),
  );
};
```

## Functional Branching with Result

Implement conditional logic in a functional way:

```typescript
// Execute different functions based on a condition
function branch<T, R, E extends Error>(
  value: T,
  condition: (value: T) => boolean,
  onTrue: (value: T) => Result<R, E>,
  onFalse: (value: T) => Result<R, E>,
): Result<R, E> {
  return condition(value) ? onTrue(value) : onFalse(value);
}

// Example usage
const processPayment = (amount: number): Result<string, Error> => {
  return branch(
    amount,
    (a) => a > 0,
    (a) => Result.ok(`Processed payment of $${a}`),
    (_) => Result.fail(new ValidationError('Payment amount must be positive')),
  );
};
```

## Declarative Validation

Combine Result with predicates for declarative validation:

```typescript
import { fromPredicate } from '@kumak/result-monad';

// Create a Result based on a condition
const isPositive = (n: number): Result<number, Error> =>
  fromPredicate(n, (x) => x > 0, 'Number must be positive');

const isAdult = (age: number): Result<number, Error> =>
  fromPredicate(age, (a) => a >= 18, 'Must be at least 18 years old');

const isValidEmail = (email: string): Result<string, Error> =>
  fromPredicate(
    email,
    (e) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e),
    'Invalid email format',
  );

// Combine predicates
function validateUser(user: any): Result<User, Error> {
  return Result.ok(user)
    .flatMap((u) => isValidEmail(u.email).map(() => u))
    .flatMap((u) => isAdult(u.age).map(() => u));
}
```

## Best Practices for Functional Composition

1. **Keep functions pure**: Functions should avoid side effects for better composition
2. **Single responsibility**: Each function in the chain should do one thing well
3. **Early validation**: Validate inputs early in the pipeline
4. **Descriptive naming**: Name functions to clearly describe their purpose
5. **Type consistency**: Maintain consistent types through the transformation pipeline
6. **Error specificity**: Use specific error types that match the operation's domain
7. **Avoid deep nesting**: Prefer flat chains with `flatMap` over nested `map` calls

## Next Steps

Congratulations! You've completed the tutorial series on using the Result monad. Review previous
tutorials for deeper understanding:

- [What is a Monad](./01-what-is-a-monad.md)
- [Basic Usage](./02-basic-usage.md)
- [Error Handling](./03-error-handling.md)
- [Async Patterns](./04-async-patterns.md)
- [Validation](./05-validation.md)

Check out the [examples directory](../examples/) for complete working examples of these patterns.
