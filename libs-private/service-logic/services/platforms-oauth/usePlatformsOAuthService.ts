import { Context } from 'moleculer';
import { Ownership } from '@libs-private/data-models';
import { initialXero, refreshXero } from './xero';

export const usePlatformsOAuthService = (
  ctx: Context,
  ownership: Ownership
) => {
  return {
    initialXero,
    refreshXero,
  };
};
