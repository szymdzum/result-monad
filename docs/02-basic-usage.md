# Basic Usage of the Result Monad

This tutorial covers the fundamental operations of the Result monad, showing how to create, transform, and handle both success and failure cases.

## Creating Results

There are several ways to create a Result object:

### Success and Failure Cases

```typescript
import { Result } from 'ts-result-monad';

// Create a success result
const success = Result.ok<number, Error>(42);

// Create a failure result
const failure = Result.fail<string, Error>(new Error('Something went wrong'));
```

### From Functions That Might Throw

Instead of using try/catch blocks, you can convert functions that might throw using `fromThrowable`:

```typescript
function parseJSON(json: string): Result<any, Error> {
  return Result.fromThrowable(() => JSON.parse(json));
}

// Usage
const validResult = parseJSON('{"name": "John"}');
const invalidResult = parseJSON('{not valid json}');
```

### From Promises

Convert Promise-based APIs to Result-returning functions:

```typescript
async function fetchUser(id: string): Promise<Result<User, Error>> {
  return await Result.fromPromise(
    fetch(`/api/users/${id}`).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
  );
}
```

## Checking Result State

You can check if a Result is successful or failed:

```typescript
const result = divide(10, 2);

if (result.isSuccess) {
  console.log(`Result: ${result.value}`);
} else {
  console.error(`Error: ${result.error.message}`);
}

// You can also check if the result was cancelled
if (result.isCancelled) {
  console.log('Operation was cancelled');
}
```

## Transforming Results

### Mapping Success Values

Use `map` to transform the success value while preserving the Result wrapper:

```typescript
const doubled = Result.ok<number, Error>(21)
  .map(x => x * 2);

console.log(doubled.value); // 42
```

### Mapping Errors

Use `mapError` to transform the error value:

```typescript
const betterError = Result.fail<number, Error>(new Error('Database error'))
  .mapError(e => new DatabaseError(e.message));
```

### Chaining Operations with flatMap

Use `flatMap` when the transformation itself might fail:

```typescript
function validateUser(input: any): Result<User, Error> {
  if (!input.name) {
    return Result.fail(new ValidationError('Name is required'));
  }
  return Result.ok({
    id: input.id,
    name: input.name,
    email: input.email
  });
}

function saveUser(user: User): Result<string, Error> {
  // Database operation that might fail
  if (Math.random() < 0.1) {
    return Result.fail(new DatabaseError('Connection failed'));
  }
  return Result.ok(`User ${user.name} saved with ID: ${user.id}`);
}

// Chain operations that might fail
const saveResult = parseJSON('{"id": 123, "name": "John", "email": "john@example.com"}')
  .flatMap(data => validateUser(data))
  .flatMap(user => saveUser(user));
```

## Side Effects with tap and tapError

Perform side effects without breaking the chain:

```typescript
const result = fetchUser('123')
  .tap(user => {
    console.log(`User loaded: ${user.name}`);
    trackAnalytics('user_loaded', { userId: user.id });
  })
  .tapError(error => {
    console.error(`Failed to load user: ${error.message}`);
    reportError(error);
  });
```

## Pattern Matching

Use `match` to handle both success and failure cases in one operation:

```typescript
const message = result.match(
  user => `Welcome back, ${user.name}!`,
  error => `Unable to load user: ${error.message}`
);
```

## Default Values

Provide fallbacks for failure cases:

```typescript
// Get a default value if operation failed
const user = userResult.getOrElse({ id: 0, name: 'Guest', email: '' });

// Or compute a value based on the error
const userMessage = userResult.getOrCall(error => {
  if (error instanceof NotFoundError) {
    return { id: 0, name: 'Guest', email: '' };
  }
  throw error; // Rethrow critical errors
});
```

## Error Recovery

Try to recover from specific errors:

```typescript
const result = fetchUser('123')
  .recover(error => {
    if (error instanceof NotFoundError) {
      // Try to fetch a default user instead
      return fetchUser('default');
    }
    // Other errors are not recoverable
    return Result.fail(error);
  });
```

## Working with Multiple Results

Combine multiple Result objects:

```typescript
import { combineResults } from 'ts-result-monad';

const results = await Promise.all([
  fetchUser('123'),
  fetchUser('456'),
  fetchUser('789')
]);

const combinedResult = combineResults(results);

if (combinedResult.isSuccess) {
  console.log(`Loaded ${combinedResult.value.length} users`);
} else {
  console.error(`Failed to load users: ${combinedResult.error.message}`);
}
```

## Converting to/from Promises

Convert between Results and Promises:

```typescript
// Convert Result to Promise
const promise = Result.ok<number, Error>(42).toPromise();
promise.then(value => console.log(value)); // 42

// Convert Promise to Result
const result = await Result.fromPromise(promise);
```

## Next Steps

Now that you understand the basic operations, check out these advanced tutorials:
- [Error Handling with Specialized Errors](./03-error-handling.md)
- [Async Operations with Result](./04-async-patterns.md)
- [Validation with Result](./05-validation.md)