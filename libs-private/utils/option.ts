import {
  Option,
  None,
  Some,
  createNone,
  createSome,
  isNone as _isNone,
  isSome as _isSome,
} from 'option-t/cjs/PlainOption/Option';

import { isNullOrUndefined } from 'option-t/cjs/Maybe/Maybe';

export const optionNone = (): None => createNone();

export const optionSome = <T>(value: T): Some<T> => createSome(value);

type ACKNOWLEDGED_UNSAFE = 'ACKNOWLEDGED_UNSAFE';

export type BOptionType<T> = {
  _val: Option<T>;
  isNone: boolean;
  isSome: boolean;
  unwrapOr: (defaultValue: T) => T;
  __unwrap__: (_ac: ACKNOWLEDGED_UNSAFE) => T;
  unwrapOrElse: (fn: () => T) => T;
};

export function BOption<T>(value: T | null | undefined): BOptionType<T> {
  const val = isNullOrUndefined(value) ? createNone() : createSome(value);
  const isNone = _isNone(val);
  const isSome = _isSome(val);
  const unwrapOr = function (defaultValue: T): T {
    return isSome ? value : defaultValue;
  };

  const unwrapOrElse = function (fn: () => T | unknown): T {
    return isSome ? value : (fn() as T);
  };

  /**
   *  This is to allow us to use the option in the matchOption function.
   *  Caution! Must not be used outside of this file.
   */
  const __unwrap__ = function (_ac: ACKNOWLEDGED_UNSAFE): T {
    if (!_ac)
      throw new Error(
        'Must acknowledge that this is unsafe, use the "unwrapOr" or "unwrapOrElse" functions instead'
      );
    if (isNone) throw new Error('Cannot unwrap a None value');

    return value;
  };
  return { _val: val, isNone, isSome, unwrapOr, __unwrap__, unwrapOrElse };
}

export const matchOption = <T, U = T>(
  option: BOptionType<T>,
  some: (value: T) => U,
  none: () => U
) => {
  return option.isSome
    ? some(option.__unwrap__('ACKNOWLEDGED_UNSAFE'))
    : none();
};
