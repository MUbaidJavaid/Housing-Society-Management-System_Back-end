// utils/google.validator.ts
import { OAuth2Client } from 'google-auth-library';

export class GoogleTokenValidator {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async validateIdToken(idToken: string): Promise<{
    googleId: string;
    email: string;
    emailVerified: boolean;
    name?: string;
    givenName?: string;
    familyName?: string;
    picture?: string;
  }> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Invalid Google ID token');
      }

      // Verify audience
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        throw new Error('Invalid token audience');
      }

      // Verify issuer
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        throw new Error('Invalid token issuer');
      }

      // Check expiry
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new Error('Token has expired');
      }

      return {
        googleId: payload.sub,
        email: payload.email!,
        emailVerified: payload.email_verified || false,
        name: payload.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      console.error('Google token validation error:', error);
      throw new Error('Invalid Google token');
    }
  }
}

export const googleTokenValidator = new GoogleTokenValidator();
