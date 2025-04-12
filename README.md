# Result Monad for TypeScript

The Result pattern is a way of saying: "Hey, things might go wrong—and that's okay." Success and
failure both deserve attention, and using Result means we're choosing to deal with uncertainty up
front, not pretend it doesn't exist.

[![JSR Version](https://jsr.io/badges/@szymdzum/result-monad)](https://jsr.io/@szymdzum/result-monad)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/szymdzum/result-monad/publish.yml?branch=main)](https://github.com/szymdzum/result-monad/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Installation

### Deno

```ts
// Import from JSR
import { fail, ok, Result } from 'jsr:@szymdzum/result-monad';

// Or import specific version
import { fail, ok, Result } from 'jsr:@szymdzum/result-monad@0.1.2';
```

### Node.js

```bash
# npm
npm install @szymdzum/result-monad

# yarn
yarn add @szymdzum/result-monad

# pnpm
pnpm add @szymdzum/result-monad
```

```ts
import { fail, ok, Result } from '@szymdzum/result-monad';
```

## Basic Usage

```ts
import { fail, ok, Result } from '@szymdzum/result-monad';

// Create a success result
const success = ok(42);
console.log(success.isSuccess); // true
console.log(success.value); // 42

// Create a failure result
const failure = fail(new Error('Something went wrong'));
console.log(failure.isFailure); // true
console.log(failure.error.message); // "Something went wrong"

// Or use the Result class directly
const anotherSuccess = Result.ok('hello');
const anotherFailure = Result.fail(new Error('Another error'));

// Chain operations (only runs if previous operations were successful)
const result = await Result.fromPromise(fetchData())
  .map((data) => processData(data))
  .flatMap((processed) => validateData(processed));

// Handle result with pattern matching
const message = result.match(
  (value) => `Successfully processed: ${value}`,
  (error) => `Error: ${error.message}`,
);
```

## Documentation

Full documentation is available in the `docs` folder:

- [What is a Monad?](./docs/01-what-is-a-monad.md)
- [Basic Usage](./docs/02-basic-usage.md)
- [Error Handling](./docs/03-error-handling.md)
- [Async Patterns](./docs/04-async-patterns.md)
- [Validation](./docs/05-validation.md)
- [Functional Composition](./docs/06-functional-composition.md)

## Development

```bash
# Run tests
deno task test

# Check types
deno task check

# Format code
deno task fmt

# Lint code
deno task lint

# Run tests with coverage
deno task coverage
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
