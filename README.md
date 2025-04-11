# Result Monad for TypeScript

A comprehensive Result type implementation for TypeScript with robust error handling and composition
utilities.

[![JSR Version](https://jsr.io/badges/@kumak/result-monad)](https://jsr.io/@kumak/result-monad)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/kumak/result-monad/deno.yml?branch=main)](https://github.com/kumak/result-monad/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Full TypeScript support with proper type inference
- ⚡ Lightweight and optimized for performance
- 🔄 Functional programming style with map/flatMap/filter operations
- 🛡️ Custom error types with detailed context information
- 🧩 Utility functions for common tasks and patterns
- 🔍 Powerful validation integration
- 📦 Works with both Deno and Node.js

## Installation

### Deno

```ts
// Import from JSR
import { Result, ok, fail } from "jsr:@kumak/result-monad";

// Or import specific version
import { Result, ok, fail } from "jsr:@kumak/result-monad@0.1.0";
```

### Node.js

```bash
# npm
npm install @kumak/result-monad

# yarn
yarn add @kumak/result-monad

# pnpm
pnpm add @kumak/result-monad
```

```ts
import { Result, ok, fail } from "@kumak/result-monad";
```

## Basic Usage

```ts
import { Result } from '@kumak/result-monad';

// Create a success result
const success = Result.ok(42);
console.log(success.isSuccess); // true
console.log(success.value); // 42

// Create a failure result
const failure = Result.fail(new Error('Something went wrong'));
console.log(failure.isFailure); // true
console.log(failure.error.message); // "Something went wrong"

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
