import { BResult } from '@event-inc/types/results';
import { resultErr, resultOk } from '@event-inc/utils/result';

export class SafeJSON {
  static parse<T>(str: string): BResult<T, 'lib'> {
    try {
      const result = JSON.parse(str);
      return resultOk(result);
    } catch (error) {
      return resultErr(
        false,
        'lib_4000',
        'Failed to parse JSON',
        'buildable-core',
        false,
        {
          incoming: str,
        }
      );
    }
  }

  static stringify<T>(obj: T): BResult<string, 'lib'> {
    try {
      const result = JSON.stringify(obj);
      return resultOk(result);
    } catch (error) {
      return resultErr(
        false,
        'lib_4001',
        'Failed to stringify JSON',
        'buildable-core',
        false,
        {
          incoming: obj,
        }
      );
    }
  }
}
