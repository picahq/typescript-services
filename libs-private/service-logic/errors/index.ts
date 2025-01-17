import { HttpStatusCode } from 'axios';
import { Errors } from 'moleculer';
const { MoleculerError } = Errors;

export class MissingBuildableSecretInHeaderError extends MoleculerError {
  constructor() {
    super(
      'Missing X-Pica-Secret in headers',
      422,
      'missing-x-pica-secret',
      {}
    );
  }
}

export class MissingApplicationJsonHeaderError extends MoleculerError {
  constructor() {
    super(
      'Missing application/json in Content-Type header',
      400,
      'missing-application-json-content-type',
      {}
    );
  }
}

export class InvalidJSONPayloadError extends MoleculerError {
  constructor() {
    super('The payload is invalid JSON', 400, 'invalid-json-payload', {});
  }
}

export class SomethingWentWrongError extends MoleculerError {
  constructor() {
    super('Something went wrong', 500, 'something-went-wrong', {});
  }
}

export class ParametersValidationError extends MoleculerError {
  constructor(data: any) {
    super('Invalid parameters', 422, 'invalid-parameters', data);
  }
}

export class NotFoundError extends MoleculerError {
  constructor(data: any = {}) {
    super('NotFound', 404, 'not-found', data);
  }
}

export class InvalidSecret extends MoleculerError {
  constructor(data: any = {}) {
    super('Invalid Secret', 401, 'invalid-secret', data);
  }
}
export class InvalidIdentifier extends MoleculerError {
  constructor(data: any = {}) {
    super('Invalid Identifier', 401, 'invalid-identifier', data);
  }
}

export class ServiceUnavailable extends MoleculerError {
  constructor(data: any = {}) {
    super('Service Unavailable', 503, 'service-unavailable', data);
  }
}

export class HttpError extends MoleculerError {
  constructor(
    message: string,
    status: HttpStatusCode,
    type: string,
    data: any = {}
  ) {
    super(message, status, type, data);
  }
}
