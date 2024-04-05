import { ValidAccessKey } from '@event-inc/types';
import {
  BuildableIdCasted,
  castToSpecificType,
  CreateEventAccessWithIdentifiersPayload,
  CreateEventAccessWithSecretsPayload,
  EventAccessKeyData,
  EventAccessWithIdentifiers,
  EventAccessWithSecrets,
  EventEnvironment,
  EventNamespace,
  EventObjectIdentifierPath,
  EventPath,
  EventType,
  EventGroup,
  EventTimestampPath,
} from '@libs-private/data-models';
import {
  buildableSlugify,
  generateAccessKey,
  generateKey,
} from '../../service-helper';

export const generateEventAccessWithIdentifier = ({
  _v = '2.0.0',
  name,
  namespace = 'default',
  type,
  ownership,
  paths,
  integrationWebhookId,
  integrationSecretKey,
  environment = 'test',
  active = true,
  identifier,
}: CreateEventAccessWithIdentifiersPayload): EventAccessWithIdentifiers => {
  const group = buildableSlugify(name);

  const eventAccessKeyData: EventAccessKeyData = [
    [castToSpecificType<BuildableIdCasted>(ownership.buildableId)],
    [
      castToSpecificType<EventNamespace>(namespace),
      castToSpecificType<EventEnvironment>(environment),
      castToSpecificType<EventType>(type),
      castToSpecificType<EventGroup>(group),
    ],
    [
      castToSpecificType<EventObjectIdentifierPath>(paths.id),
      castToSpecificType<EventPath>(paths.event),
      castToSpecificType<EventTimestampPath>(paths.timestamp),
    ],
  ];

  const accessKey: ValidAccessKey =
    identifier ||
    generateAccessKey(
      `id_${environment}`,
      JSON.stringify(eventAccessKeyData),
      process.env.EVENT_ACCESS_ENCRYPTION_PASSWORD
    );

  const eventAccessRecord: EventAccessWithIdentifiers = {
    _v,
    namespace,
    type,
    group,
    key: generateKey({ entity: 'event_access', type, group }),
    identifier: accessKey,
    ownership,
    paths,
    integrationWebhookId,
    integrationSecretKey,
    environment,
    active,
    createdAt: Date.now(),
    createdDate: new Date(),
    deleted: false,
  };

  return eventAccessRecord;
};

export const generateEventAccessWithSecrets = ({
  _v = '1.0.0',
  name,
  namespace = 'default',
  type = 'custom',
  group,
  ownership,
  environment = 'test',
  active = true,
  paths = {
    id: '_.body.id',
    event: '_.body.event',
    payload: '_.body.payload',
    timestamp: '_.body.createdAt',
  },
}: CreateEventAccessWithSecretsPayload): EventAccessWithSecrets => {
  const slug = buildableSlugify(name);

  const eventAccessKeyData: EventAccessKeyData = [
    [castToSpecificType<BuildableIdCasted>(ownership.buildableId)],
    [
      castToSpecificType<EventNamespace>(namespace),
      castToSpecificType<EventEnvironment>(environment),
      castToSpecificType<EventType>(type),
      castToSpecificType<EventGroup>(group),
    ],
    [
      castToSpecificType<EventObjectIdentifierPath>(paths.id),
      castToSpecificType<EventPath>(paths.event),
      castToSpecificType<EventTimestampPath>(paths.timestamp),
    ],
  ];

  const accessKey: ValidAccessKey = generateAccessKey(
    `sk_${environment}`,
    JSON.stringify(eventAccessKeyData),
    process.env.EVENT_ACCESS_ENCRYPTION_PASSWORD
  );

  const eventAccessRecord: EventAccessWithSecrets = {
    _v,
    name: buildableSlugify(name),
    slug,
    namespace,
    type,
    group,
    key: generateKey({ entity: 'event_access', type, group }),
    secret: accessKey,
    paths,
    ownership,
    environment,
    active,
    createdAt: Date.now(),
    createdDate: new Date(),
    deleted: false,
  };

  return eventAccessRecord;
};
