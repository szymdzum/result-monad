# Async Operations with Result

This tutorial covers patterns for working with asynchronous operations using the Result monad,
including Promise integration, retries, timeouts, and cancellation.

## Converting Between Promises and Results

### From Promise to Result

Use `Result.fromPromise` to convert a Promise to a Result:

```typescript
import { Result, TechnicalError } from '@szymdzum/result-monad';

async function fetchUserData(userId: string): Promise<Result<User, Error>> {
  return await Result.fromPromise(
    fetch(`/api/users/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      }),
  );
}

// Usage
const userResult = await fetchUserData('123');
if (userResult.isSuccess) {
  console.log('User:', userResult.value);
} else {
  console.error('Error:', userResult.error.message);
}
```

### From Result to Promise

Use `toPromise` to convert a Result back to a Promise:

```typescript
const result = Result.ok<User, Error>({ id: '123', name: 'John' });

try {
  const user = await result.toPromise();
  console.log('User:', user);
} catch (error) {
  console.error('Error:', error);
}
```

## Async Transformations

### asyncMap for Async Transformations

Use `asyncMap` when the transformation function returns a Promise:

```typescript
async function enrichUserData(
  userResult: Result<User, Error>,
): Promise<Result<EnrichedUser, Error>> {
  return await userResult.asyncMap(async (user) => {
    // Fetch additional data asynchronously
    const ordersResponse = await fetch(`/api/users/${user.id}/orders`);
    const orders = await ordersResponse.json();

    return {
      ...user,
      orders,
    };
  });
}
```

### asyncFlatMap for Chained Async Operations

Use `asyncFlatMap` when the async operation itself returns a Result:

```typescript
async function processUserData(userId: string): Promise<Result<ProcessedData, Error>> {
  const userResult = await fetchUserData(userId);

  return await userResult.asyncFlatMap(async (user) => {
    // This operation returns a Result
    const validationResult = await validateUserAsync(user);

    return validationResult.map((validUser) => ({
      id: validUser.id,
      displayName: `${validUser.firstName} ${validUser.lastName}`,
      email: validUser.email,
    }));
  });
}
```

## Parallel Execution

Execute multiple async operations in parallel while maintaining Result semantics:

```typescript
import { combineResults } from '@szymdzum/result-monad';

async function fetchDashboardData(userId: string): Promise<Result<Dashboard, Error>> {
  try {
    // Execute multiple async operations in parallel
    const [userResult, ordersResult, settingsResult] = await Promise.all([
      fetchUserData(userId),
      fetchUserOrders(userId),
      fetchUserSettings(userId),
    ]);

    // Check if any operation failed
    const results = [userResult, ordersResult, settingsResult];
    const failedResult = results.find((result) => result.isFailure);

    if (failedResult) {
      return Result.fail(failedResult.error);
    }

    // Build dashboard with all data
    return Result.ok({
      user: userResult.value,
      orders: ordersResult.value,
      settings: settingsResult.value,
    });
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new TechnicalError(String(error)),
    );
  }
}

// Alternative using combineResults utility
async function fetchDashboardData2(userId: string): Promise<Result<Dashboard, Error>> {
  try {
    // Execute multiple async operations in parallel
    const results = await Promise.all([
      fetchUserData(userId),
      fetchUserOrders(userId),
      fetchUserSettings(userId),
    ]);

    // Combine results - if any fail, the combined result will fail
    return combineResults(results).map(([user, orders, settings]) => ({
      user,
      orders,
      settings,
    }));
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new TechnicalError(String(error)),
    );
  }
}
```

## Retry Pattern

Implement retry logic for operations that might experience transient failures:

```typescript
import { retry, tryCatchAsync } from '@szymdzum/result-monad';

async function fetchWithRetry(url: string): Promise<Result<any, Error>> {
  const fetchOperation = async (): Promise<Result<any, Error>> => {
    return await tryCatchAsync(async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return await response.json();
    });
  };

  // Retry up to 3 times with exponential backoff starting at 1000ms
  return await retry(fetchOperation, { maxAttempts: 3, delayMs: 1000 });
}
```

## Timeouts

Implement timeout handling for async operations:

```typescript
import { Result, TimeoutError } from '@szymdzum/result-monad';

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Result<any, Error>> {
  return await tryCatchAsync(async () => {
    // Create a timeout promise that rejects after timeoutMs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new TimeoutError('fetchWithTimeout', timeoutMs)), timeoutMs);
    });

    // Create the actual fetch promise
    const fetchPromise = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    });

    // Race the fetch against the timeout
    return await Promise.race([fetchPromise, timeoutPromise]);
  });
}
```

## Cancellation

The Result monad supports cancellation through AbortController integration:

```typescript
import { Result } from '@szymdzum/result-monad';

async function fetchUserWithCancellation(
  userId: string,
  abortSignal?: AbortSignal,
): Promise<Result<User, Error>> {
  // Using the built-in AbortSignal support
  return await Result.fromPromise(
    fetch(`/api/users/${userId}`, { signal: abortSignal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.json();
      }),
    abortSignal,
  );
}

// Usage with cancellation
async function main() {
  const controller = new AbortController();
  const signal = controller.signal;

  // Set up a timeout to cancel the operation after 5 seconds
  setTimeout(() => controller.abort(), 5000);

  const result = await fetchUserWithCancellation('123', signal);

  if (result.isCancelled) {
    console.log('Operation was cancelled');
  } else if (result.isSuccess) {
    console.log('User:', result.value);
  } else {
    console.error('Error:', result.error.message);
  }
}
```

## Converting Callback-Based APIs

Many JavaScript APIs use callbacks. You can convert these to Result-based APIs:

```typescript
import { promisifyWithResult } from '@szymdzum/result-monad';

// Example Node.js fs.readFile with callbacks
function readFile(path: string, callback: (error: Error | null, data?: string) => void): void {
  // Implementation omitted for brevity
}

// Convert to Result-based API
async function readFileWithResult(path: string): Promise<Result<string, Error>> {
  return await promisifyWithResult<string>(readFile, path);
}

// Usage
const fileResult = await readFileWithResult('config.json');
fileResult.match(
  (content) => console.log('File content:', content),
  (error) => console.error('Error reading file:', error.message),
);
```

## Sequential Async Processing

Process a list of items sequentially, maintaining the Result context:

```typescript
async function processItemsSequentially<T, U>(
  items: T[],
  processor: (item: T) => Promise<Result<U, Error>>,
): Promise<Result<U[], Error>> {
  const results: U[] = [];

  for (const item of items) {
    const result = await processor(item);

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    results.push(result.value);
  }

  return Result.ok(results);
}

// Usage
const userIds = ['123', '456', '789'];
const processResult = await processItemsSequentially(userIds, fetchUserData);
```

## Best Practices for Async Result Handling

1. **Explicit error mapping**: Map network/infrastructure errors to domain-specific errors
2. **Consistent timeout handling**: Use TimeoutError and AbortController for cancellation
3. **Granular retry policies**: Adjust retry attempts and delays based on operation types
4. **Avoid promise swallowing**: Always handle or propagate rejected promises
5. **Use combineResults**: Prefer combineResults over manual Promise.all result checking
6. **Cancel long-running operations**: Provide cancellation support for long-running tasks
7. **Preserve error context**: Maintain the error chain when wrapping errors

## Next Steps

Now that you understand async patterns with Result, check out these advanced tutorials:

- [Validation with Result](./05-validation.md)
- [Functional Composition](./06-functional-composition.md)
