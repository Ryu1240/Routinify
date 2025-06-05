import { Auth0ProviderOptions } from '@auth0/auth0-react';

if (!process.env.REACT_APP_AUTH0_DOMAIN) {
  throw new Error('REACT_APP_AUTHBan0_DOMAIN is not defined');
}

if (!process.env.REACT_APP_AUTH0_CLIENT_ID) {
  throw new Error('REACT_APP_AUTH0_CLIENT_ID is not defined');
}

export const auth0Config: Auth0ProviderOptions = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/dashboard`,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    scope: "read:tasks"
  },
  cacheLocation: "localstorage",
  useRefreshTokens: true
}; 