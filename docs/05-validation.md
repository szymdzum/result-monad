# Validation with Result

This tutorial explains how to use the Result monad's validation API to build robust input validation
with clear error messages and a fluent interface.

## Introduction to the Validation API

The library includes a fluent validation API designed to work seamlessly with the Result monad. It
allows you to define validation rules in a readable, chainable manner and returns a Result
containing either the valid data or validation errors.

## Basic Validation

Start by importing the validation utilities:

```typescript
import { validate, ValidationError } from '@szymdzum/result-monad';
```

Define validation rules for an object:

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

function validateUser(user: User) {
  return validate(user)
    // Define rules for each property
    .property('name', (name) => name.notEmpty().maxLength(100))
    .property('email', (email) => email.notEmpty().email())
    .property('age', (age) => age.isNumber().min(18))
    .validate(); // Returns Result<User, ValidationError>
}

// Usage
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
};

const validationResult = validateUser(user);

if (validationResult.isSuccess) {
  console.log('Valid user:', validationResult.value);
} else {
  console.error('Validation errors:', validationResult.error.message);
}
```

## Available Validation Rules

The validation API includes many built-in validation rules:

```typescript
validate(value)
  // String validations
  .notEmpty() // String must not be empty
  .minLength(length) // String must be at least length characters
  .maxLength(length) // String must not exceed length characters
  .email() // String must be valid email format
  .matches(regex) // String must match regular expression
  // Number validations
  .isNumber() // Value must be a number
  .min(minimum) // Number must be at least minimum
  .max(maximum) // Number must not exceed maximum
  // Value validations
  .required() // Value must not be null or undefined
  .oneOf(allowedValues) // Value must be one of the allowed values
  // Custom validations
  .custom(predicate, errorMessage); // Custom validation with predicate function
```

## Nested Object Validation

Validate nested objects with the `nested` method:

```typescript
interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface UserWithAddress {
  name: string;
  email: string;
  address: Address;
}

function validateUserWithAddress(user: UserWithAddress) {
  return validate(user)
    .property('name', (name) => name.notEmpty())
    .property('email', (email) => email.email())
    .nested('address', (address) => {
      return address
        .property('street', (street) => street.notEmpty())
        .property('city', (city) => city.notEmpty())
        .property('zipCode', (zipCode) => zipCode.matches(/^\d{5}$/));
    })
    .validate();
}
```

## Array Validation

Validate arrays of items with the `array` method:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

interface Order {
  orderId: string;
  customerId: string;
  items: Product[];
}

function validateOrder(order: Order) {
  return validate(order)
    .property('orderId', (id) => id.notEmpty())
    .property('customerId', (id) => id.notEmpty())
    .array<Product>('items', (item) => {
      return item
        .property('id', (id) => id.notEmpty())
        .property('name', (name) => name.notEmpty())
        .property('price', (price) => price.isNumber().min(0.01));
    })
    .validate();
}
```

## Custom Validation Messages

Customize error messages with the `withMessage` method:

```typescript
validate(user)
  .property('name', (name) =>
    name
      .notEmpty()
      .withMessage('Please enter your name')
      .minLength(2)
      .withMessage('Name must have at least 2 characters'))
  .property('email', (email) =>
    email
      .notEmpty()
      .withMessage('Email is required')
      .email()
      .withMessage('Please enter a valid email address'))
  .validate();
```

## Custom Validation Rules

Create custom validation rules with the `custom` method:

```typescript
// Validate that a password meets complexity requirements
function validatePassword(password: string) {
  return validate(password)
    .notEmpty()
    .minLength(8)
    .withMessage('Password must be at least 8 characters')
    .custom(
      (pwd) => /[A-Z]/.test(pwd),
      'Password must contain at least one uppercase letter',
    )
    .custom(
      (pwd) => /[a-z]/.test(pwd),
      'Password must contain at least one lowercase letter',
    )
    .custom(
      (pwd) => /[0-9]/.test(pwd),
      'Password must contain at least one number',
    )
    .custom(
      (pwd) => /[^A-Za-z0-9]/.test(pwd),
      'Password must contain at least one special character',
    )
    .validate();
}
```

## Framework Integrations

### Express.js Integration

Use the validation API with Express.js middleware:

```typescript
import { validationIntegrations } from '@szymdzum/result-monad';
import express from 'express';

const app = express();
app.use(express.json());

// Create validation middleware
const validateUserMiddleware = validationIntegrations.validateBody<User>((user) =>
  user
    .property('name', (name) => name.notEmpty())
    .property('email', (email) => email.email())
    .property('age', (age) => age.isNumber().min(18))
);

// Use middleware in routes
app.post('/api/users', validateUserMiddleware, (req, res) => {
  // If we get here, validation passed
  const user = req.body;
  // Process valid user data...
  res.status(201).json({ message: 'User created', user });
});
```

### React Hook Form Integration

Use the validation API with React Hook Form:

```typescript
import { validationIntegrations } from '@szymdzum/result-monad';
import { useForm } from 'react-hook-form';

// In your React component
function UserForm() {
  // Create validation resolver
  const validationResolver = validationIntegrations.createHookFormResolver<User>((user) =>
    user
      .property('name', (name) => name.notEmpty())
      .property('email', (email) => email.email())
      .property('age', (age) => age.isNumber().min(18))
  );

  // Use with React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: validationResolver,
  });

  const onSubmit = (data) => {
    console.log('Valid form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <p>{errors.name.message}</p>}
      </div>
      {/* Other form fields */}
      <button type='submit'>Submit</button>
    </form>
  );
}
```

## Composing Validators

Create reusable validators by composing them:

```typescript
// Create a reusable email validator
const validateEmail = (email: string) =>
  validate(email)
    .notEmpty()
    .withMessage('Email is required')
    .email()
    .withMessage('Please enter a valid email address')
    .validate();

// Create a reusable password validator
const validatePassword = (password: string) =>
  validate(password)
    .notEmpty()
    .withMessage('Password is required')
    .minLength(8)
    .withMessage('Password must be at least 8 characters')
    .custom((pwd) => /[A-Z]/.test(pwd), 'Must include uppercase letter')
    .custom((pwd) => /[0-9]/.test(pwd), 'Must include a number')
    .validate();

// Use in login validation
function validateLogin(credentials: { email: string; password: string }) {
  const emailResult = validateEmail(credentials.email);
  const passwordResult = validatePassword(credentials.password);

  // If both are successful, return valid credentials
  if (emailResult.isSuccess && passwordResult.isSuccess) {
    return Result.ok(credentials);
  }

  // Otherwise, collect all error messages
  const errors: string[] = [];

  if (emailResult.isFailure) {
    errors.push(emailResult.error.message);
  }

  if (passwordResult.isFailure) {
    errors.push(passwordResult.error.message);
  }

  return Result.fail(new ValidationError(errors.join(', ')));
}
```

## Validation Best Practices

1. **Separate validation from business logic**: Keep validation focused on input structure and
   format
2. **Compose validators**: Create reusable validator functions for common patterns
3. **Descriptive error messages**: Provide clear, actionable guidance in error messages
4. **Validate at boundaries**: Apply validation at system boundaries (API endpoints, UI forms)
5. **Consistent validation**: Apply the same validation rules on both client and server when
   possible
6. **Use appropriate error types**: Return ValidationError for validation issues
7. **Consider internationalization**: Plan for translating validation messages

## Next Steps

Now that you understand validation with Result, check out:

- [Functional Composition](./06-functional-composition.md)
