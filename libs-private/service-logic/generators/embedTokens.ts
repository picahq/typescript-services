import {
  EmbedTokenRecord,
  EmbedTokensPayload,
} from '@event-inc/types/embed-tokens';
import { generateId } from '@integrationos/rust-utils';

export const generateEmbedTokensRecord = ({
  label,
  group,
  ttl,
  linkSettings,
  environment,
  features,
}: EmbedTokensPayload): EmbedTokenRecord => {
  return {
    label,
    group,
    linkSettings,
    createdAt: Date.now(),
    createdDate: new Date(),
    expiresAt: new Date().getTime() + ttl,
    environment,
    sessionId: generateId('session_id'),
    features,
  };
};
