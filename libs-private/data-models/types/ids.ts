export const idPrefixes = {
  event: 'evt',
  eventAcces: 'evt_ac',
  unitTest: 'ut',
  log: 'log',
  logTracking: 'log_trk',
  job: 'job',
  transaction: 'tx',
  link: 'ln',
  linkToken: 'ln_tk',
  setting: 'st',
  token: 'embed_tk',
  earlyAccess: 'ea',
} as const;

export type IdPrefix = (typeof idPrefixes)[keyof typeof idPrefixes];

export type ID = `${IdPrefix}::${string}`;
