import { Ownership } from '@event-inc/types/generic';
import {
  Platform,
  LinkSettings as Settings,
  Feature,
} from '@event-inc/types/settings';

export const generateSettingsRecord = ({
  ownership,
  features,
  platforms,
  buildKitIntegrations,
}: {
  ownership: Ownership;
  features?: Feature[];
  platforms: Platform[];
  buildKitIntegrations?: {
    connectionDefinitionId: string;
    platformName: string;
    environment: 'test' | 'live';
  }[]
}): Settings => {
  return {
    createdAt: Date.now(),
    createdDate: new Date(),
    ownership,
    updatedAt: Date.now(),
    updatedDate: new Date(),
    connectedPlatforms: platforms,
    features,
    buildKitIntegrations,
  };
};