import { Ownership } from '@event-inc/types/generic';
import { Platform, LinkSettings as Settings } from '@event-inc/types/settings';

export const generateSettingRecord = ({
  platform,
  ownership,
}: {
  platform: Platform;
} & {
  ownership: Ownership;
}): Settings => {
  return {
    createdAt: Date.now(),
    createdDate: new Date(),
    ownership,
    updatedAt: Date.now(),
    updatedDate: new Date(),
    connectedPlatforms: [platform],
  };
};
