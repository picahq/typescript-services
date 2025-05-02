import { Db } from "mongodb";

interface IndexSpecification {
  field: Record<string, number>;
  collation?: CollationOptions;
  unique?: boolean;
  name?: string;
  partialFilterExpression?: Record<string, any>;
  expireAfterSeconds?: number;
}

interface CollationOptions {
  locale: string;
  caseLevel?: boolean;
  caseFirst?: string;
  strength?: number;
  numericOrdering?: boolean;
  alternate?: string;
  maxVariable?: string;
  backwards?: boolean;
}

const collectionsWithIndexes: Record<string, IndexSpecification[]> = {
  "common-models": [
    { field: { name: 1 }, unique: true, name: "name_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "connection-definitions": [
    { field: { key: 1 }, unique: true, name: "key_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "connection-model-definitions": [
    { field: { key: 1 }, unique: true, name: "key_1" },
    {
      field: { connectionPlatform: 1, action: 1, modelName: 1 },
      name: "connectionPlatform_1_action_1_modelName_1",
    },
    { field: { connectionPlatform: 1 }, name: "connectionPlatform_1" },
    { field: { actionName: 1 }, name: "actionName_1" },
    {
      field: { "mapping.commonModelName": 1 },
      collation: { locale: "en", strength: 2 },
      name: "connectionPlatform_1",
    },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
    { field: { connectionPlatform: 1, deleted: 1, createdAt: -1 }, name: "connectionPlatform_1_deleted_1_createdAt_-1" },
  ],
  "connection-oauth-definitions": [
    { field: { connectionPlatform: 1 }, name: "connectionPlatform_2" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "connection-model-schema": [
    { field: { key: 1 }, unique: true, name: "key_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  connections: [
    {
      field: { key: 1, "ownership.clientId": 1 },
      unique: true,
      name: "key_1_ownership.clientId_1",
      partialFilterExpression: { deleted: false },
    },
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "event-access": [
    {
      field: { key: 1, "ownership.clientId": 1 },
      unique: true,
      name: "key_1_ownership.clientId_1",
    },
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
    { field: { deleted: 1, key: 1, "ownership.buildableId": 1 }, name: "deleted_1_key_1_ownership.buildableId_1" },
    { field: { accessKey: 1, deleted: 1, environment: 1, "ownership.buildableId": 1, createdAt: -1 }, name: "deleted_1_environment_1_ownership.buildableId_1_createdAt_-1" },
    { field: { key: 1, "ownership.buildableId": 1 }, name: "key_1_ownership.buildableId_1" },
  ],
  "event-transactions": [
    {
      field: { txKey: 1, "ownership.clientId": 1 },
      unique: true,
      name: "txKey_1_ownership.clientId_1",
    },
    { field: { eventKey: 1 }, name: "eventKey_1" },
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "external-events": [
    { field: { environment: 1 }, name: "environment_1" },
    { field: { "ownership.buildableId": 1 }, name: "ownership.buildableId_1" },
    { field: { deleted: 1 }, name: "deleted" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  jobs: [
    { field: { jobType: 1 }, name: "jobType_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  links: [
    { field: { token: 1 }, unique: true, name: "token_1" },
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "platform-pages": [
    {
      field: { platformName: 1, modelName: 1 },
      name: "platformName_1_modelName_1",
    },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  secrets: [
    { field: { buildableId: 1, _id: 1 }, name: "buildableId_1__id_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  sessions: [
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    { field: { token: 1 }, name: "token_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  settings: [
    { field: { "ownership.clientId": 1 }, name: "ownership.clientId_1" },
    {
      field: { "ownership.buildableId": 1 },
      name: "ownership.buildableId_1",
      unique: true
    },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  stages: [
    { field: { jobId: 1 }, name: "jobId_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "system-stats": [
    { field: { clientId: 1 }, name: "clientId_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  users: [
    { field: { email: 1 }, unique: true, name: "email_1" },
    { field: { username: 1 }, unique: true, name: "username_1" },
    { field: { userKey: 1 }, unique: true, name: "userKey_1" },
    { field: { deleted: 1 }, name: "deleted_1" },
    { field: { active: 1 }, name: "active_1" },
    { field: { createdAt: 1 }, name: "createdAt_1" },
  ],
  "db-migrations": [{ field: { key: 1 }, unique: true, name: "key_1" }],
  "common-enums": [{ field: { name: 1 }, unique: true, name: "name_1" }],
  "embed-tokens": [
    {
      field: { createdDate: 1 },
      name: "createdDate_ttl",
      expireAfterSeconds: 60 * 5, // 5 Minutes
    },
  ],
  archives: [
    { field: { reference: 1, type: 1 }, name: "reference_1_type_1" },
    { field: { type: 1, endsAt: -1 }, name: "type_1_endsAt_1" },
  ],
  idempotency: [
    {
      field: { date: 1 },
      name: "date_ttl",
      expireAfterSeconds: 60 * 60 * 24 * 30, // 1 month
    },
  ],
  "scheduled-events": [{ field: { scheduledOn: 1 }, name: "scheduledOn_1" }],
  "pipeline-events": [
    { field: { outcome: 1, createdAt: 1 }, name: "outcome_createdAt_1" },
  ],
};

export const createIndexes = async (db: Db) => {
  for (const collectionName of Object.keys(collectionsWithIndexes)) {
    console.log(`Verifying indexes on '${collectionName}' collection...`);
    let collection;

    // Create collection if they do not exist
    const collectionList = await db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .toArray();
    if (collectionList.length === 0) {
      collection = await db.createCollection(collectionName);
      console.log(`Collection created: ${collectionName}`);
    } else {
      collection = db.collection(collectionName);
    }

    try {
      const existingIndexes = await collection.indexes();
      const existingIndexNames = existingIndexes.map(
        (index: any) => index.name
      );

      for (const index of collectionsWithIndexes[collectionName]) {
        const indexField = index.field;

        let indexOptions: {
          unique?: boolean;
          name?: string;
          partialFilterExpression?: Record<string, any>;
          expireAfterSeconds?: number;
          collation?: CollationOptions;
        } = {
          name: index.name,
        };

        if (index.unique) indexOptions["unique"] = true;
        if (index.partialFilterExpression)
          indexOptions["partialFilterExpression"] =
            index.partialFilterExpression;
        if (index.expireAfterSeconds)
          indexOptions["expireAfterSeconds"] = index.expireAfterSeconds;
        if (index.collation) indexOptions["collation"] = index.collation;

        if (!existingIndexNames.includes(index.name)) {
          await collection.createIndex(indexField, indexOptions);
          console.log(
            `New index created on ${collectionName}:`,
            JSON.stringify(indexField),
            indexOptions
          );
        } else {
          console.log(
            `Index already exists on ${collectionName}:`,
            JSON.stringify(indexField),
            indexOptions
          );
        }
      }
    } catch (error) {
      console.error(`Error creating indexes on '${collectionName}':`, error);
      throw error;
    }

    console.log(
      `✅ Finished processing indexes on '${collectionName}' collection.`
    );
  }
};
