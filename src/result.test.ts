// @ts-nocheck - Deno imports are not recognized by TypeScript
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { Result } from './result.ts';
import { TechnicalError, ValidationError } from './errors.ts';

const { test: _test } = Deno;

Deno.test('Result - Basic functionality', async (t) => {
  await t.step('creates a success result', () => {
    const result = Result.ok<number, Error>(42);
    assertEquals(result.isSuccess, true);
    assertEquals(result.isFailure, false);
    assertEquals(result.value, 42);
  });

  await t.step('creates a failure result', () => {
    const error = new Error('Something went wrong');
    const result = Result.fail<number, Error>(error);
    assertEquals(result.isSuccess, false);
    assertEquals(result.isFailure, true);
    assertEquals(result.error, error);
  });

  await t.step('throws when accessing value of a failure', () => {
    const result = Result.fail<number, Error>(new Error('Error'));
    assertThrows(() => result.value);
  });

  await t.step('throws when accessing error of a success', () => {
    const result = Result.ok<number, Error>(42);
    assertThrows(() => result.error);
  });

  await t.step('creates a cancelled result', () => {
    const result = Result.cancelled<number, Error>();
    assertEquals(result.isSuccess, false);
    assertEquals(result.isFailure, true);
    assertEquals(result.isCancelled, true);
  });
});

Deno.test('Result - Mapping and chaining', async (t) => {
  await t.step('maps a success value', () => {
    const result = Result.ok<number, Error>(42);
    const mapped = result.map((x) => x * 2);
    assertEquals(mapped.isSuccess, true);
    assertEquals(mapped.value, 84);
  });

  await t.step("doesn't map a failure value", () => {
    const error = new Error('Error');
    const result = Result.fail<number, Error>(error);
    const mapped = result.map((x) => x * 2);
    assertEquals(mapped.isSuccess, false);
    assertEquals(mapped.error, error);
  });

  await t.step('maps an error', () => {
    const error = new Error('Original error');
    const result = Result.fail<number, Error>(error);
    const mapped = result.mapError((e) => new ValidationError(e.message));
    assertEquals(mapped.isSuccess, false);
    assertEquals(mapped.error.name, 'ValidationError');
    assertEquals(mapped.error.message, 'Validation Error: Original error');
  });

  await t.step('flatMaps a success value', () => {
    const result = Result.ok<number, Error>(42);
    const flatMapped = result.flatMap((x) => Result.ok<string, Error>(`Value: ${x}`));
    assertEquals(flatMapped.isSuccess, true);
    assertEquals(flatMapped.value, 'Value: 42');
  });

  await t.step('flatMap returns failure on failure', () => {
    const error = new Error('Error');
    const result = Result.fail<number, Error>(error);
    const flatMapped = result.flatMap((x) => Result.ok<string, Error>(`Value: ${x}`));
    assertEquals(flatMapped.isSuccess, false);
    assertEquals(flatMapped.error, error);
  });
});

Deno.test('Result - Side effects', async (t) => {
  await t.step('executes tap on success', () => {
    let sideEffect = 0;
    const result = Result.ok<number, Error>(42);
    const returned = result.tap((x) => {
      sideEffect = x;
    });

    assertEquals(sideEffect, 42);
    assertEquals(returned, result);
  });

  await t.step("doesn't execute tap on failure", () => {
    let sideEffect = 0;
    const error = new Error('Error');
    const result = Result.fail<number, Error>(error);
    const returned = result.tap((x) => {
      sideEffect = x;
    });

    assertEquals(sideEffect, 0);
    assertEquals(returned, result);
  });

  await t.step('executes tapError on failure', () => {
    let errorMessage = '';
    const error = new Error('Test error');
    const result = Result.fail<number, Error>(error);
    const returned = result.tapError((e) => {
      errorMessage = e.message;
    });

    assertEquals(errorMessage, 'Test error');
    assertEquals(returned, result);
  });

  await t.step("doesn't execute tapError on success", () => {
    let errorMessage = '';
    const result = Result.ok<number, Error>(42);
    const returned = result.tapError((e) => {
      errorMessage = e.message;
    });

    assertEquals(errorMessage, '');
    assertEquals(returned, result);
  });
});

Deno.test('Result - Pattern matching and fallbacks', async (t) => {
  await t.step('matches on success', () => {
    const result = Result.ok<number, Error>(42);
    const matched = result.match(
      (value) => `Success: ${value}`,
      (error) => `Failure: ${error.message}`,
    );
    assertEquals(matched, 'Success: 42');
  });

  await t.step('matches on failure', () => {
    const result = Result.fail<number, Error>(new Error('Error message'));
    const matched = result.match(
      (value) => `Success: ${value}`,
      (error) => `Failure: ${error.message}`,
    );
    assertEquals(matched, 'Failure: Error message');
  });

  await t.step('getOrElse returns value on success', () => {
    const result = Result.ok<number, Error>(42);
    const value = result.getOrElse(0);
    assertEquals(value, 42);
  });

  await t.step('getOrElse returns fallback on failure', () => {
    const result = Result.fail<number, Error>(new Error('Error'));
    const value = result.getOrElse(0);
    assertEquals(value, 0);
  });

  await t.step('getOrCall returns value on success', () => {
    const result = Result.ok<number, Error>(42);
    const value = result.getOrCall((e) => e.message.length);
    assertEquals(value, 42);
  });

  await t.step('getOrCall calls function on failure', () => {
    const result = Result.fail<number, Error>(new Error('Error message'));
    const value = result.getOrCall((e) => e.message.length);
    assertEquals(value, 13);
  });

  await t.step('recover returns same result on success', () => {
    const result = Result.ok<number, Error>(42);
    const recovered = result.recover((_e) => Result.ok<number, Error>(0));
    assertEquals(recovered.value, 42);
  });

  await t.step('recover returns new result on failure', () => {
    const result = Result.fail<number, Error>(new Error('Error'));
    const recovered = result.recover((_e) => Result.ok<number, Error>(0));
    assertEquals(recovered.value, 0);
  });

  await t.step('orElse returns same result on success', () => {
    const result = Result.ok<number, Error>(42);
    const alternative = Result.ok<number, Error>(0);
    const final = result.orElse(alternative);
    assertEquals(final.value, 42);
  });

  await t.step('orElse returns alternative on failure', () => {
    const result = Result.fail<number, Error>(new Error('Error'));
    const alternative = Result.ok<number, Error>(0);
    const final = result.orElse(alternative);
    assertEquals(final.value, 0);
  });
});

Deno.test('Result - Async operations', async (t) => {
  await t.step('asyncMap transforms a success value', async () => {
    const result = Result.ok<number, Error>(42);
    const mapped = await result.asyncMap((x) => {
      return x * 2;
    });
    assertEquals(mapped.isSuccess, true);
    assertEquals(mapped.value, 84);
  });

  await t.step("asyncMap doesn't transform a failure", async () => {
    const error = new Error('Error');
    const result = Result.fail<number, Error>(error);
    const mapped = await result.asyncMap((x) => {
      return x * 2;
    });
    assertEquals(mapped.isSuccess, false);
    assertEquals(mapped.error, error);
  });

  await t.step('asyncFlatMap chains operations', async () => {
    const result = Result.ok<number, Error>(42);
    const chained = await result.asyncFlatMap((x) => {
      return Result.ok<string, Error>(`Value: ${x}`);
    });
    assertEquals(chained.isSuccess, true);
    assertEquals(chained.value, 'Value: 42');
  });

  await t.step('asyncFlatMap preserves failure', async () => {
    const error = new Error('Error');
    const result = Result.fail<number, Error>(error);
    const chained = await result.asyncFlatMap((x) => {
      return Result.ok<string, Error>(`Value: ${x}`);
    });
    assertEquals(chained.isSuccess, false);
    assertEquals(chained.error, error);
  });

  await t.step('fromPromise handles successful promises', async () => {
    const promise = Promise.resolve(42);
    const result = await Result.fromPromise(promise);
    assertEquals(result.isSuccess, true);
    assertEquals(result.value, 42);
  });

  await t.step('fromPromise handles promise rejections', async () => {
    const promise = Promise.reject(new Error('Promise error'));
    const result = await Result.fromPromise(promise);
    assertEquals(result.isSuccess, false);
    assertEquals(result.error.message, 'Promise error');
  });

  await t.step("fromThrowable handles functions that don't throw", () => {
    const result = Result.fromThrowable(() => 42);
    assertEquals(result.isSuccess, true);
    assertEquals(result.value, 42);
  });

  await t.step('fromThrowable handles functions that throw', () => {
    const result = Result.fromThrowable(() => {
      throw new Error('Function error');
    });
    assertEquals(result.isSuccess, false);
    assertEquals(result.error.message, 'Function error');
  });
});

Deno.test('Result - Async operations with cancellation', async (t) => {
  await t.step("asyncMap handles abort signal that's already aborted", async () => {
    const result = Result.ok<number, Error>(42);
    const controller = new AbortController();
    controller.abort(); // Already aborted

    const mapped = await result.asyncMap(
      (x) => x * 2,
      controller.signal,
    );

    assertEquals(mapped.isSuccess, false);
    assertEquals(mapped.isCancelled, true);
  });

  await t.step("asyncFlatMap handles abort signal that's already aborted", async () => {
    const result = Result.ok<number, Error>(42);
    const controller = new AbortController();
    controller.abort(); // Already aborted

    const mapped = await result.asyncFlatMap(
      (x) => Result.ok<string, Error>(`Value: ${x}`),
      controller.signal,
    );

    assertEquals(mapped.isSuccess, false);
    assertEquals(mapped.isCancelled, true);
  });

  await t.step("fromPromise handles abort signal that's already aborted", async () => {
    const promise = Promise.resolve(42);
    const controller = new AbortController();
    controller.abort(); // Already aborted

    const result = await Result.fromPromise(promise, controller.signal);

    assertEquals(result.isSuccess, false);
    assertEquals(result.isCancelled, true);
  });
});

Deno.test('Result - Conversion and serialization', async (t) => {
  await t.step('toPromise resolves with value for success', async () => {
    const result = Result.ok<number, Error>(42);
    const value = await result.toPromise();
    assertEquals(value, 42);
  });

  await t.step('toPromise rejects with error for failure', async () => {
    const error = new Error('Promise error');
    const result = Result.fail<number, Error>(error);

    try {
      await result.toPromise();
      throw new Error('Should have rejected');
    } catch (e) {
      assertEquals(e, error);
    }
  });

  await t.step('toJSON serializes success result', () => {
    const result = Result.ok<number, Error>(42);
    const json = result.toJSON();
    assertEquals(json.success, true);
    assertEquals(json.value, 42);
    assertEquals(json.error, undefined);
  });

  await t.step('toJSON serializes failure result', () => {
    const result = Result.fail<number, Error>(new Error('JSON error'));
    const json = result.toJSON();
    assertEquals(json.success, false);
    assertEquals(json.value, undefined);
    assertEquals(json.error?.name, 'Error');
    assertEquals(json.error?.message, 'JSON error');
  });
});

// Advanced test cases
Deno.test('Result - Integration scenarios', async (t) => {
  await t.step('chaining multiple operations', () => {
    const initialResult = Result.ok<number, Error>(42);

    const finalResult = initialResult
      .map((x) => x + 8)
      .flatMap((x) =>
        x >= 50
          ? Result.ok<string, Error>(`Value: ${x}`)
          : Result.fail<string, Error>(new Error('Value too small'))
      )
      .map((str) => str.toUpperCase());

    assertEquals(finalResult.isSuccess, true);
    assertEquals(finalResult.value, 'VALUE: 50');
  });

  await t.step('early failure propagation', () => {
    const initialResult = Result.fail<number, Error>(new Error('Initial error'));

    const finalResult = initialResult
      .map((x) => x + 8)
      .flatMap((x) => Result.ok<string, Error>(`Value: ${x}`))
      .map((str) => str.toUpperCase());

    assertEquals(finalResult.isSuccess, false);
    assertEquals(finalResult.error.message, 'Initial error');
  });

  await t.step('error transformation through chain', () => {
    const initialResult = Result.ok<number, Error>(60);

    const finalResult = initialResult
      .map((x) => x + 8)
      .flatMap((x) =>
        x < 50
          ? Result.ok<string, Error>(`Value: ${x}`)
          : Result.fail<string, Error>(new ValidationError('Value exceeds maximum'))
      )
      .mapError((e) => new TechnicalError(`Processing failed: ${e.message}`));

    assertEquals(finalResult.isSuccess, false);
    assertEquals(finalResult.error.name, 'TechnicalError');
    assertEquals(
      finalResult.error.message,
      'Technical Error: Processing failed: Validation Error: Value exceeds maximum',
    );
  });
});

// Edge cases
Deno.test('Result - Edge cases', async (t) => {
  await t.step('handles undefined success value', () => {
    const result = Result.ok<undefined, Error>(undefined);
    assertEquals(result.isSuccess, true);
    assertEquals(result.value, undefined);
  });

  await t.step('handles null success value', () => {
    const result = Result.ok<null, Error>(null);
    assertEquals(result.isSuccess, true);
    assertEquals(result.value, null);
  });

  await t.step('cancelled result is also a failure', () => {
    const result = Result.cancelled<number, Error>();
    assertEquals(result.isSuccess, false);
    assertEquals(result.isFailure, true);
    assertEquals(result.isCancelled, true);
  });

  await t.step('cancelled error has correct message', () => {
    const result = Result.cancelled<number, Error>('my-operation');
    assertEquals(result.error.message, 'Cancellation: Operation was cancelled');
    assertEquals(result.error.name, 'CancellationError');
  });

  await t.step('toJSON on cancelled result', () => {
    const result = Result.cancelled<number, Error>('my-operation');
    const json = result.toJSON();
    assertEquals(json.success, false);
    assertEquals(json.error?.name, 'CancellationError');
  });
});
