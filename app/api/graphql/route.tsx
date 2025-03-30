import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';

import { MyContext, server } from './apollo-server';
import { verifyToken } from '../../../lib2/verifyToken';

const handler = startServerAndCreateNextHandler<NextRequest, MyContext>(
  server,
  {
    context: async (req) => {
      const authorizationHeader = req.headers.get('authorization');
      console.log('AUHORIZATION HEADER ' + authorizationHeader);
      return {
        user: authorizationHeader
          ? await verifyToken(authorizationHeader)
          : undefined,
      };
    },
  },
);

export { handler as GET, handler as POST };
