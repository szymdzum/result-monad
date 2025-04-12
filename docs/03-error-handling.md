# Error Handling with Specialized Errors

This tutorial explains how to use the specialized error types provided by the Result monad library
to create more expressive and domain-specific error handling.

## The Error Hierarchy

The library provides a hierarchy of error types to represent different failure scenarios:

```
ResultError (base class)
├── ValidationError
├── NotFoundError
├── UnauthorizedError
├── BusinessRuleError
├── TechnicalError
│   ├── TimeoutError
│   └── CancellationError
└── ConcurrencyError
```

Using specialized errors makes your code more expressive and helps consumers of your API understand
what went wrong.

## Using Specialized Errors

### ValidationError

Use `ValidationError` when input data fails validation:

```typescript
import { Result, ValidationError } from '@szymdzum/result-monad';

function validateAge(age: unknown): Result<number, ValidationError> {
  if (typeof age !== 'number') {
    return Result.fail(new ValidationError('Age must be a number'));
  }

  if (age < 18) {
    return Result.fail(new ValidationError('Must be at least 18 years old'));
  }

  return Result.ok(age);
}
```

### NotFoundError

Use `NotFoundError` when requested resources cannot be found:

```typescript
async function findUser(id: string): Promise<Result<User, Error>> {
  const user = await userRepository.findById(id);

  if (!user) {
    return Result.fail(new NotFoundError('User', id));
  }

  return Result.ok(user);
}
```

### UnauthorizedError

Use `UnauthorizedError` for permission and authentication issues:

```typescript
function checkPermission(user: User, resource: string): Result<boolean, Error> {
  if (!user.isAuthenticated) {
    return Result.fail(new UnauthorizedError('User is not authenticated'));
  }

  if (!user.hasPermission(resource, 'read')) {
    return Result.fail(new UnauthorizedError(`User lacks permission to read ${resource}`));
  }

  return Result.ok(true);
}
```

### BusinessRuleError

Use `BusinessRuleError` when operations violate business rules:

```typescript
function processPayment(payment: Payment): Result<Transaction, Error> {
  if (payment.amount <= 0) {
    return Result.fail(new BusinessRuleError('Payment amount must be positive'));
  }

  if (payment.amount > payment.accountBalance) {
    return Result.fail(new BusinessRuleError('Insufficient funds'));
  }

  // Process payment
  return Result.ok(new Transaction(/* ... */));
}
```

### TechnicalError and Derived Classes

Use `TechnicalError` for infrastructure and system issues:

```typescript
async function connectToDatabase(): Promise<Result<DbConnection, Error>> {
  try {
    const connection = await db.connect(connectionString, { timeout: 5000 });
    return Result.ok(connection);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return Result.fail(new TimeoutError('connectToDatabase', 5000, error));
    }
    return Result.fail(new TechnicalError('Database connection failed', error));
  }
}
```

### ConcurrencyError

Use `ConcurrencyError` for optimistic concurrency issues:

```typescript
async function updateDocument(
  id: string,
  data: any,
  version: number,
): Promise<Result<Document, Error>> {
  try {
    const result = await documentRepo.update(id, data, { version });
    return Result.ok(result);
  } catch (error) {
    if (error.code === 'VERSION_CONFLICT') {
      return Result.fail(new ConcurrencyError('Document', id, error));
    }
    return Result.fail(new TechnicalError('Update failed', error));
  }
}
```

## Error Propagation and Chaining

When errors occur deep in a call stack, you can preserve the error chain for better debugging:

```typescript
function processOrder(orderId: string): Result<Order, Error> {
  return findOrder(orderId)
    .flatMap((order) => {
      try {
        return validateOrder(order);
      } catch (error) {
        // Wrap the original error and preserve the chain
        return Result.fail(
          new BusinessRuleError(
            'Order validation failed',
            error instanceof Error ? error : undefined,
          ),
        );
      }
    })
    .flatMap((validOrder) => {
      return processPayment(validOrder.payment)
        .mapError((error) => new BusinessRuleError('Payment processing failed', error));
    });
}
```

## Centralized Error Handling

Create a centralized error handler to consistently manage different error types:

```typescript
function handleOperationResult<T>(result: Result<T, Error>): void {
  if (result.isSuccess) {
    console.log('Operation succeeded:', result.value);
    return;
  }

  const error = result.error;

  // Handle based on error type
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    showValidationErrorToUser(error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Not found:', error.message);
    showNotFoundPage();
  } else if (error instanceof UnauthorizedError) {
    console.error('Authorization error:', error.message);
    redirectToLogin();
  } else if (error instanceof BusinessRuleError) {
    console.error('Business rule violation:', error.message);
    showFriendlyErrorMessage(error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Operation timed out:', error.message);
    suggestRetry();
  } else if (error instanceof ConcurrencyError) {
    console.error('Concurrency error:', error.message);
    suggestRefresh();
  } else if (error instanceof TechnicalError) {
    console.error('Technical error:', error.message);
    logForSupportTeam(error);
    showGenericError();
  } else {
    console.error('Unknown error:', error);
    showGenericError();
  }

  // Log the full error chain for debugging
  logErrorChain(error);
}

// Helper to log the complete error chain
function logErrorChain(error: Error): void {
  let currentError: Error | undefined = error;
  const errorChain: string[] = [];

  while (currentError) {
    errorChain.push(currentError.message);
    currentError = currentError.cause as Error | undefined;
  }

  if (errorChain.length > 1) {
    console.debug('Error chain:', errorChain.join(' → '));
  }
}
```

## Creating Custom Error Types

You can extend the error hierarchy with your own domain-specific errors:

```typescript
import { ResultError } from '@szymdzum/result-monad';

export class PaymentProcessorError extends ResultError {
  constructor(message: string, cause?: Error) {
    super(`Payment Processor Error: ${message}`, cause);
    this.name = 'PaymentProcessorError';
    Object.setPrototypeOf(this, PaymentProcessorError.prototype);
  }
}

export class InsufficientFundsError extends PaymentProcessorError {
  public readonly accountId: string;
  public readonly amount: number;

  constructor(accountId: string, amount: number, cause?: Error) {
    super(`Insufficient funds in account '${accountId}' for amount ${amount}`, cause);
    this.name = 'InsufficientFundsError';
    this.accountId = accountId;
    this.amount = amount;
    Object.setPrototypeOf(this, InsufficientFundsError.prototype);
  }
}
```

## Best Practices for Error Handling

1. **Be specific**: Use the most specific error type that applies to the situation
2. **Preserve context**: Include relevant information like IDs and operation names
3. **Maintain the chain**: Always pass the original error as `cause` when wrapping
4. **Centralize handling**: Create centralized error handling for consistent responses
5. **Map before throwing**: Use `mapError` to transform errors before they reach handlers
6. **Document error types**: Document the possible error types your functions return

## Next Steps

Now that you understand error handling, check out these advanced tutorials:

- [Async Operations with Result](./04-async-patterns.md)
- [Validation with Result](./05-validation.md)
- [Functional Composition](./06-functional-composition.md)
