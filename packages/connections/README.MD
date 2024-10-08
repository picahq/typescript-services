# authkit-node

Secure token generation for [IntegrationOS AuthKit](https://docs.integrationos.com/docs/authkit) using [Node.js](https://nodejs.org/en) .

## Install

With npm:

```jsx
npm i @integrationos/authkit-node
```

With yarn:

```jsx
yarn add @integrationos/authkit-node
```

## Creating a token endpoint

You'll want to create an internal endpoint that's used to generate secure tokens for your frontend. You can do so by adding code that looks like the below snippet.

```jsx
import { AuthKitToken } from "@integrationos/authkit-node";

app.post("/authkit-token", async (request, response) => {
  const authKitToken = new AuthKitToken("sk_live_1234");
  const token = await authKitToken.create();

  response.send(token);
});
```

You'll want to switch out the API Key for your own, which will later tell your frontend which integrations you'd like to make available to your users.

If you pass an `identity` or `identityType` (`user`, `team`, or `organization`), you'll be able to query for all connections scoped to that identity. The identity is used to generate the unique [Connection Key](https://docs.integrationos.com/docs/setup) for the user once they successfully connect an account.

## Full Documentation

Please refer to the official [IntegrationOS AuthKit](https://docs.integrationos.com/docs/authkit) docs for a more holistic understanding of IntegrationOS AuthKit.
