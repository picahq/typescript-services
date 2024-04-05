import { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface Migrated {
  _id?: string;
  name?: string;
  key: string;
  migratedDate?: Date;
  migratedBy?: string;
  reason?: string;
  affectedCollections?: string[];
}

export const hasMigrated = (migrated: Migrated[], key: string) => {
  return migrated.find((m) => m.key === key);
};

export const saveMigration = async (db: Db, migrated: Migrated) => {
  const id = ID.now('mig').toString();
  await db.collection('db-migrations').insertOne({
    // @ts-ignore
    _id: id,
    ...migrated,
  });
};

export const getAllMigrations = async (db: Db) => {
  return await db
    .collection('db-migrations')
    .find()
    .project({ key: 1 })
    .toArray();
};

class ID {
  constructor(
    private prefix: string,
    private time: Date,
    private uuid: string
  ) {}

  static now(prefix: string): ID {
    return new ID(prefix, new Date(), uuidv4());
  }

  toString(): string {
    const timestamp = this.time.getTime();
    const encodedTimestamp = Buffer.from(
      new BigInt64Array([BigInt(timestamp)]).buffer
    ).toString('base64url');
    const encodedUuid = Buffer.from(this.uuid, 'utf-8').toString('base64url');
    return `${this.prefix}::${encodedTimestamp}::${encodedUuid}`;
  }

  static fromString(str: string): ID {
    const parts = str.split('::');
    if (parts.length !== 3) {
      throw new Error('Invalid ID format');
    }
    const [prefix, encodedTimestamp, encodedUuid] = parts;

    const timestampBuffer = Buffer.from(encodedTimestamp, 'base64url');
    const timestamp = new BigInt64Array(
      timestampBuffer.buffer,
      timestampBuffer.byteOffset,
      timestampBuffer.byteLength / BigInt64Array.BYTES_PER_ELEMENT
    )[0];
    const time = new Date(Number(timestamp));

    const uuidBuffer = Buffer.from(encodedUuid, 'base64url');
    const uuid = uuidBuffer.toString('utf-8');

    return new ID(prefix, time, uuid);
  }
}
