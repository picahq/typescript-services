import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { intersection, startsWith, get } from 'lodash';
const { MoleculerClientError, MoleculerServerError } =
  require('moleculer').Errors;

const NO_TOKEN_ERROR = new MoleculerClientError(
  'No Authorization Token Found',
  403,
  'Forbidden'
);

const UNAUTHORIZED_ERROR = new MoleculerClientError(
  'Invalid Authorization Token',
  403,
  'Forbidden'
);

const decodeToken = (request: any) => {
  const token = getToken(request);
  return jwt.decode(token);
};

const decodeSecureToken = (request: any) => {
  const token = getSecureToken(request);
  return jwt.decode(token);
};

const hasVerifiedEmail = function (user: any) {
  return user.emails && user.emails[0].verified;
};

const verifyCoreToken = (token: any) => {
  const secret = process.env.BUILDABLE_SECRET + process.env.JWT_SECRET;
  return jwt.verify(token, secret, (error: any, payload: any) => {
    if (error) {
      return false;
    }
    return payload;
  });
};

const verifyUserToken = (token: string, buildableId = '') => {
  const secret = process.env.JWT_SECRET + buildableId;
  return jwt.verify(token, secret, (error: any, payload: any) => {
    if (error) {
      return false;
    }
    return payload;
  });
};

const verifyToken = function (token: string, buildableId = '') {
  const decodedToken: any = jwt.decode(token);
  const secret =
    decodedToken && decodedToken.isBuildableCore
      ? process.env.BUILDABLE_SECRET + process.env.JWT_SECRET
      : process.env.JWT_SECRET + buildableId;
  return jwt.verify(token, secret, (error, payload) => {
    if (error) {
      return Promise.reject(UNAUTHORIZED_ERROR);
    }
    return payload;
  });
};

const decodeTestToken = (request: any) => {
  const token = getTestToken(request);
  return jwt.decode(token);
};

const hasTestToken = (request: any) => {
  const testAuth = get(request, 'headers.test-authorization');

  if (testAuth) {
    return true;
  }

  return false;
};

const getTestToken = (request: any) => {
  const testAuth = get(request, 'headers.test-authorization');

  if (testAuth) {
    const authType = startsWith(testAuth, 'Basic ') ? 'basic' : 'bearer';

    if (authType === 'basic') {
      return testAuth.slice(6);
    } else {
      return testAuth.slice(7);
    }
  }
  return null;
};

const sign = (data: any, expiresIn: any, buildableId: any) => {
  const secret = data.isBuildableCore
    ? process.env.BUILDABLE_SECRET + process.env.JWT_SECRET
    : process.env.JWT_SECRET + buildableId;
  return jwt.sign(data, secret, {
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    expiresIn: expiresIn || process.env.JWT_EXPIRES_AFTER,
  });
};

/**
 * Get the authorization token from a request object
 *
 * @param {object} request Moleculer/Node request object
 * @returns {object} With the auth type as key, token as value
 */
const getToken = (request: any) => {
  const { headers } = request;

  const auth = headers['authorization'];

  if (headers && auth) {
    const authType = startsWith(auth, 'Basic ') ? 'basic' : 'bearer';

    if (authType === 'basic') {
      return auth.slice(6);
    } else {
      return auth.slice(7);
    }
  }
  return null;
};

const getSecureToken = (request: any) => {
  const { headers } = request;

  const auth = headers['__authorization__'];

  if (headers && auth) {
    const authType = startsWith(auth, 'Basic ') ? 'basic' : 'bearer';

    if (authType === 'basic') {
      return auth.slice(6);
    } else {
      return auth.slice(7);
    }
  }
  return null;
};

/**
 * Checks if the requesting user has a session/token.
 * Sets the token payload to context.meta if a session/token is found.
 *
 * @param {Object} context Service/Action context information
 *
 * @returns
 */
const isAuthenticated = async (context: any) => {
  if (!context.meta.user) {
    return Promise.reject(UNAUTHORIZED_ERROR);
  }
  return Promise.resolve(context);
};

const getUserDataFromToken = async function (token: string) {
  // try {
  //   return token ? await context.call('v1.auth.isTokenValid', { token }) : null
  // } catch (error) {
  //   this.logger.error('Error validating token:', error)
  //   return Promise.reject(UNAUTHORIZED_ERROR)
  // }
};

/**
 * Checks that the requesting user has the required action role(s)
 *
 * @param {Object} context Service/Action context information
 */
// deprecated
const hasRole = async function (context: any) {
  const { action, meta } = context;
  const isAuthorized =
    action.roles && intersection(meta.user.roles, action.roles).length;
  const isOwner = await this.Owner(context);

  if (!isAuthorized && !isOwner) {
    return Promise.reject(UNAUTHORIZED_ERROR);
  } else {
    return Promise.resolve(context);
  }
};

/**
 * Check if the requesting user owns the requested resource
 *
 * @param {Object} context Service/Action context information
 */
// deprecated
const isOwner = async function (context: any) {
  const { user, resourceId } = context.meta;
  if (user.id === resourceId) {
    return Promise.resolve(context);
  } else {
    return Promise.reject(UNAUTHORIZED_ERROR);
  }
};

/**
 * Check passwords
 *
 * @param {String} password Password used on login
 *
 * @param {Object} user User entity
 *
 * @returns {Boolean} The password exists or not
 */
const checkPassword = function (password: any, user: any) {
  try {
    return bcrypt.compareSync(password, user.password);
  } catch (error) {
    console.warn('Could not compare passwords:', error.message);
    return Promise.reject(
      new MoleculerServerError(
        `Could not compare passwords: ${error.message}`,
        500,
        'InternalServerError'
      )
    );
  }
};

/**
 * Handles the token authorization
 *
 * @param {Object} headers Request headers
 */
const handleAuthorization = (request: any, ctx: any) => {
  const token = getToken(request);

  if (token) {
    const authObject: any = verifyToken(
      token,
      get(ctx, 'meta.buildable._id', '')
    );

    if (authObject._id) {
      // const user = getUserDataFromToken(null, token);
      return {
        tokenVerified: true,
        ...authObject,
      };
    }

    return {
      verified: false,
      error: UNAUTHORIZED_ERROR,
    };
  }

  return {
    verified: false,
    error: NO_TOKEN_ERROR,
  };
};

module.exports = () => {
  return {
    // @ts-ignore
    mixins: [],
    methods: {
      auth: () => {
        return {
          checkPassword,
          getToken,
          getUserDataFromToken,
          hasVerifiedEmail,
          isAuthenticated,
          isOwner,
          hasRole,
          verifyToken,
          decodeToken,
          sign,
          handleAuthorization,
          verifyCoreToken,
          verifyUserToken,
          hasTestToken,
          getTestToken,
          decodeTestToken,
          getSecureToken,
          decodeSecureToken,
        };
      },
    },
  };
};
