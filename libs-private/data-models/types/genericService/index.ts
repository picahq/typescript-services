import { Ownership } from '../generic';

export interface ServiceContextMeta {
  buildable: {
    _id: string;
    buildableId: string;
  };
  user: {
    _id: string;
  };
  ownership: Ownership;
}
