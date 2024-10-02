import {
  EmbedTokenRecord,
  EmbedTokensPayload,
} from '@event-inc/types/embed-tokens';
import { generateId } from '../service-helper';

export const generateEmbedTokensRecord = async ({
  label,
  group,
  ttl,
  linkSettings,
  environment,
  features,
}: EmbedTokensPayload): Promise<EmbedTokenRecord> => {
  const sessionId = await generateId('session_id');

  return {
    linkSettings,
    createdAt: Date.now(),
    createdDate: new Date(),
    expiresAt: new Date().getTime() + ttl,
    environment,
    sessionId,
    features,
    label,
    group,
  };
};
