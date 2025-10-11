import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from '@agent/db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    debugLogs: true,
  }),
  trustedOrigins: ['http://localhost:5173', 'https://agentize.fly.dev'],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: 'offline', // get a refresh token first try
      prompt: 'select_account consent',
      redirectURI: `http://localhost:3000/api/auth/callback/google`,
      scope: [
        'https://www.googleapis.com/auth/tasks', // or tasks.readonly if you only need read
      ],
    },
  },
  plugins: [],
});
