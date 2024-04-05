export type HTTPCodes =
  | '400'
  | '401'
  | '403'
  | '404'
  | '405'
  | '406'
  | '408'
  | '409'
  | '410'
  | '411'
  | '412'
  | '413'
  | '414'
  | '415'
  | '416'
  | '417'
  | '418'
  | '421'
  | '422'
  | '423'
  | '424'
  | '425'
  | '426'
  | '428'
  | '429'
  | '431'
  | '451'
  | '500'
  | '501'
  | '502'
  | '503'
  | '504'
  | '505'
  | '506'
  | '507'
  | '508'
  | '510'
  | '511';
export type BuildableErrorCodeTypes =
  | 'http'
  | 'gRPC'
  | 'worker'
  | 'workflow'
  | 'activity'
  | 'service'
  | 'lib'
  | 'extractor'
  | 'custom';

export enum InternalErrorCodes {
  BadRequest = '4000',
  Unauthorized = '4001',
  PaymentRequired = '4002',
  Forbidden = '4003',
  NotFound = '4004',
  MethodNotAllowed = '4005',
  NotAcceptable = '4006',
  UnknownError = '6000',
}

export type BCode<T extends BuildableErrorCodeTypes> = T extends 'http'
  ? `${T}_${HTTPCodes}`
  : T extends 'worker'
  ? `${T}_${InternalErrorCodes}`
  : T extends 'workflow'
  ? `${T}_${InternalErrorCodes}`
  : T extends 'activity'
  ? `${T}_${InternalErrorCodes}`
  : T extends 'service'
  ? `${T}_${InternalErrorCodes}`
  : T extends 'extractor'
  ? `${T}_${InternalErrorCodes}`
  : `${T}_${string}`;

export type ErrorProducer =
  | 'buildable-core'
  | 'buildable-worker'
  | 'client-middleware'
  | 'client-destination'
  | 'buildable-cli';

export type Panic = 'PANIC';

export type BErr<C extends BuildableErrorCodeTypes, T = unknown> = {
  code: BCode<C>;
  message: string;
  producer: ErrorProducer;
  retryable?: boolean;
  data?: T;
  panic?: false | Panic;
};
