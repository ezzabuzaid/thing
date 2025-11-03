import { prisma } from '@thing/db';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
    debugLogs: false,
  }),
  trustedOrigins: process.env.ALLOWED_ORIGINS.split(','),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: 'offline', // get a refresh token first try
      prompt: 'select_account consent',
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      scope: [
        'https://www.googleapis.com/auth/tasks', // or tasks.readonly if you only need read
      ],
    },
  },
  plugins: [],
});
