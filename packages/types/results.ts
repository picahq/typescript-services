import { Result } from 'option-t/cjs/PlainResult/Result';
import { BErr, BuildableErrorCodeTypes } from './errors';

export type ExtendedResult<T, E> = Result<T, E> & {
  /** The unwrapOr is safe to use. It must throw or return type T */
  unwrapOr: (fn: (value: E) => T) => T;
  /** The map is safe to use. It will apply the fn if(val) and return Result(ok) ok and return Result(err) otherwise */
  map: <U>(fn: (value: T) => U) => ExtendedResult<U, E>;
  /** The unwrap will return the original type or throw if an error was returned */
  unwrap: () => T;
};

export type BResult<
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown
> = ExtendedResult<T, BErr<ET, ED>>;

/**
 * An implementation of the Result pattern Similar to the Rust Result type
 * https://doc.rust-lang.org/std/result/enum.Result.html
 * THIS IS EXPERIMENTAL AND SUBJECT TO CHANGE DON'T USE IT YET
 */
export class __BuildableResult__<
  T,
  ET extends BuildableErrorCodeTypes,
  ED = unknown
> {
  private readonly _value: T;
  private readonly _error: BErr<ET, ED> | null;

  constructor(value: T, error: BErr<ET, ED> | null) {
    this._value = value;
    this._error = error;
  }

  public static makeOk<T, ET extends BuildableErrorCodeTypes, ED = unknown>(
    value: T
  ): __BuildableResult__<T, ET, ED> {
    return new __BuildableResult__(value, null);
  }

  public static makeErr<T, ET extends BuildableErrorCodeTypes, ED = unknown>(
    error: BErr<ET, ED>
  ): __BuildableResult__<T, ET, ED> {
    return new __BuildableResult__(null as T, error);
  }

  get ok(): boolean {
    return this._error === null;
  }

  get err(): boolean {
    return this._error !== null;
  }

  get val(): T {
    return this._value;
  }

  public unwrap(): T {
    if (this.err) {
      throw this.err;
    }
    return this._value;
  }

  public unwrapOr(fn: (value: BErr<ET, ED>) => void) {
    if (this.err) {
      return fn(this._error);
    }
    return this._value;
  }

  public map<R>(fn: (value: T) => R): __BuildableResult__<R, ET, ED> {
    if (this._error !== null) {
      return __BuildableResult__.makeErr(this._error);
    }
    return __BuildableResult__.makeOk(fn(this._value));
  }
}
