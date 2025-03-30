import {
  ApolloClient,
  from,
  HttpLink,
  HttpOptions,
  InMemoryCache,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { auth } from '../firebase/config';

const defaulCmsCacheDuration = 60;

const customFetch: HttpOptions['fetch'] = (uri, options = {}) => {
  return fetch(uri, {
    ...options,
    next: { revalidate: defaulCmsCacheDuration },
  });
};

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    console.error('[GraphQL error]:', JSON.stringify(graphQLErrors));
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

const httpLink = () =>
  new HttpLink({
    //solving CORS from browser via proxy
    uri:
      typeof window === 'undefined'
        ? 'https://https://group-up-cyan.vercel.app/api/graphql' //for now same as on server
        : `https://${window.location.hostname}/api/graphql`,
    fetch: customFetch,
  });

const authLink = setContext(async (req, { headers }) => {
  if (typeof window === 'undefined') {
    // osetreni pro ssr, tam user neexistuje!!
    console.warn('Authentikace na serveru, metoda', req.operationName);
    // return the headers to the context so httpLink can read them
    return {
      headers,
    };
  }
  const user = auth?.currentUser;
  const jwtToken = user ? await user.getIdToken() : undefined;

  // returns the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: jwtToken ? `Bearer ${jwtToken}` : '',
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clientCms: ApolloClient<any> | null = null;

export const getApolloClient = () => {
  const isServer = typeof window === 'undefined';

  if (!clientCms || isServer) {
    clientCms = new ApolloClient({
      link: isServer
        ? from([errorLink, httpLink()]) // Bez `authLink` na serveru
        : from([authLink, errorLink, httpLink()]),
      cache: new InMemoryCache(),
      connectToDevTools: process.env.NODE_ENV === 'development',
    });
  }

  return clientCms;
};

