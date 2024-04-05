import { HttpStatusCode } from 'axios';
import {
  BCode,
  BErr,
  BuildableErrorCodeTypes,
  ErrorProducer,
  Panic,
} from '@event-inc/types';
import { Errors } from 'moleculer';
const { MoleculerError } = Errors;

class HttpError extends MoleculerError {
  constructor(
    message: string,
    status: HttpStatusCode,
    type: string,
    data: any = {}
  ) {
    super(message, status, type, data);
  }
}

export function BError<C extends BuildableErrorCodeTypes, D = unknown>(
  panic: false | Panic = false,
  code: BCode<C>,
  message: string,
  producer: ErrorProducer,
  retryable = false,
  data?: D
): BErr<C, D> {
  return {
    panic,
    code,
    message,
    producer,
    retryable,
    data,
  };
}

export function handleBuildableError(
  error: BErr<BuildableErrorCodeTypes, unknown>
): void {
  throw error;
}

export async function notifyThenHandleBuildableError(
  error: BErr<BuildableErrorCodeTypes, unknown>,
  notify: (error: BErr<BuildableErrorCodeTypes, unknown>) => Promise<void>
) {
  await notify(error);
  handleBuildableError(error);
}

export function handleHttpError(
  error: BErr<BuildableErrorCodeTypes, unknown>
): void {
  if (typeof error !== 'object') {
    throw new HttpError(
      'Received an error that is not an object',
      500,
      'unknown',
      error
    );
  }

  const { message, code, producer, ...rest } = error;

  const [type, __code] = code.split('_');
  let _code: HttpStatusCode = parseInt(__code);

  if (type !== 'http') {
    const lastDigit = _code % 10;

    _code = (_code - lastDigit) / 10 + lastDigit;
  }

  throw new HttpError(message, _code, producer, rest);
}
