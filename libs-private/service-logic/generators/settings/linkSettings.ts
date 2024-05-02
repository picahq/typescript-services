import { Ownership } from '@event-inc/types/generic';
import {
  Platform,
  LinkSettings as Settings,
  Feature,
} from '@event-inc/types/settings';

export const generateSettingRecord = ({
  platform,
  ownership,
  features,
}: {
  platform: Platform;
  ownership: Ownership;
  features?: Feature[];
}): Settings => {
  return {
    createdAt: Date.now(),
    createdDate: new Date(),
    ownership,
    updatedAt: Date.now(),
    updatedDate: new Date(),
    connectedPlatforms: [platform],
    features,
  };
};
