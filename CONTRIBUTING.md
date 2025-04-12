# Contributing to Result Monad

Thank you for considering contributing to Result Monad! This document provides guidelines and
instructions to help you get started.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.
Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

- **Check if the bug has already been reported** by searching through existing issues.
- **Create a new issue** if your bug hasn't been reported yet. Be sure to include:
  - A clear title and description
  - Steps to reproduce the bug
  - Expected vs. actual behavior
  - Version information (Deno/Node.js version, package version)
  - Any relevant code snippets or error messages

### Suggesting Features

- **Check if the feature has already been suggested** in existing issues.
- **Create a new issue** with the "enhancement" label.
- **Provide a clear description** of the feature and why it would be valuable.
- **Include examples** of how the feature would be used.

### Pull Requests

1. **Fork the repository** and create your branch from `main`.
2. **Install development dependencies** as described in the README.
3. **Make your changes** while following the code style guidelines.
4. **Add tests** for any new functionality.
5. **Run existing tests** to ensure nothing breaks.
6. **Update documentation** to reflect any changes.
7. **Submit your pull request** with a clear description of the changes.

## Development Workflow

1. Clone your fork: `git clone https://github.com/YOUR-USERNAME/result-monad.git`
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Make your changes and commit: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## Style Guidelines

- **Follow existing code style:** Look at the existing code to understand the style.
- **Use TypeScript:** All code should be written in TypeScript with appropriate type annotations.
- **Document your code:** Add JSDoc comments to public APIs and complex functions.
- **Write tests:** Add tests for any new functionality or bug fixes.

## Testing

- Run tests with `deno task test`
- Check coverage with `deno task coverage`
- Format code with `deno task fmt`
- Lint code with `deno task lint`

## Documentation

- Update the README.md if your changes affect usage examples.
- Add JSDoc comments to any new public APIs.
- Update existing documentation to reflect your changes.

## License

By contributing to Result Monad, you agree that your contributions will be licensed under the same
MIT license that covers the project.

Thank you for contributing!
