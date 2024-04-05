import {
  createErr,
  createOk,
  Result,
  isOk,
  isErr,
} from 'option-t/cjs/PlainResult/Result';
import {
  BCode,
  BErr,
  BuildableErrorCodeTypes,
  ErrorProducer,
  Panic,
  BResult,
} from '@event-inc/types';
import { BError, handleBuildableError, handleHttpError } from './errors';

export type ExtendedResult<T, E> = Result<T, E> & {
  /** The unwrapOr is safe to use. It must throw or return type T */
  unwrapOr: (fn: (value: E) => T) => T;
  /** The map is safe to use. It will apply the fn if(val) and return Result(ok) ok and return Result(err) otherwise */
  map: <U>(fn: (value: T) => U) => ExtendedResult<U, E>;
  /** The unwrap will return the original type or throw if an error was returned */
  unwrap: () => T;
};

const createExtendedOk = <T, E>(value: T): ExtendedResult<T, E> => {
  const result = createOk(value) as ExtendedResult<T, E>;

  result.unwrapOr = (): T => {
    return result.val;
  };

  result.unwrap = () => result.val;

  result.map = <U>(fn: (value: T) => U): ExtendedResult<U, E> => {
    return createExtendedOk(fn(result.val));
  };
  return result;
};

const createExtendedErr = <T, E>(error: E): ExtendedResult<T, E> => {
  const result = createErr(error) as ExtendedResult<T, E>;

  result.unwrapOr = (fn: (value: E) => T): T => {
    return fn(result.err);
  };

  result.unwrap = () => {
    throw result.err;
  };

  result.map = <U>(): ExtendedResult<U, E> => {
    return createExtendedErr(result.err);
  };
  return result;
};

export const resultOk = <T>(value: T): ExtendedResult<T, never> =>
  createExtendedOk(value);

export const resultErr = <ET extends BuildableErrorCodeTypes, ED = unknown>(
  panic: false | Panic = false,
  code: BCode<ET>,
  message: string,
  producer: ErrorProducer,
  retryable = false,
  data?: ED
): ExtendedResult<never, BErr<ET, ED>> =>
  createExtendedErr<never, BErr<ET, ED>>(
    BError<ET, ED>(panic, code, message, producer, retryable, data)
  );

export const isResultOk = isOk;
export const isResultErr = isErr;

export const matchResult = <
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown
>(
  result: BResult<T, ET, ED>,
  ok: (value: T) => unknown,
  err: (error: BErr<ET, ED>) => unknown
) => {
  const unwrap = <U = unknown>(): U => {
    if (isResultOk(result)) {
      return ok(result.val) as U;
    }
    if (result.err.panic === 'PANIC') {
      err(result.err);
      throw result.err;
    }
    return err(result.err) as U;
  };
  return { unwrap, isOk: isResultOk(result), isErr: isResultErr(result) };
};

export const matchAndExecResult = <
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown
>(
  result: BResult<T, ET, ED>,
  ok: (value: T) => unknown,
  err: (error: BErr<ET, ED>) => unknown
) => {
  let resultValue: unknown;

  if (isResultOk(result)) {
    resultValue = ok(result.val);
  }

  resultValue = err(result.err);

  const unwrap = () => {
    if (result.err.panic === 'PANIC') {
      err(result.err);
      throw result.err;
    }
    return resultValue;
  };
  return { unwrap, isOk: isResultOk(result), isErr: isResultErr(result) };
};

export const matchResultAndHandleBuildableError = <
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown,
  R = unknown
>(
  result: BResult<T, ET, ED>,
  ok: (value: T) => R
): R => {
  return matchResult(result, ok, handleBuildableError).unwrap();
};

export const matchResultAndHandleHttpError = <
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown,
  R = unknown
>(
  result: BResult<T, ET, ED>,
  ok: (value: T) => R
): R => {
  return matchResult(result, ok, handleHttpError).unwrap();
};

export const mapResult = <
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown,
  R = unknown
>(
  result: BResult<T, ET, ED>,
  ok: (value: T) => R
): BResult<R, ET, ED> => {
  if (isResultOk(result)) {
    return resultOk(ok(result.val));
  }
  return resultErr(
    result.err.panic,
    result.err.code,
    result.err.message,
    result.err.producer,
    result.err.retryable,
    result.err.data
  );
};
