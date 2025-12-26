import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/monitoring/logger';
import axios from 'axios';

/**
 * LinkedIn OAuth Authentication Endpoints
 * Handles OAuth 2.0 flow for LinkedIn integration
 */

// Step 1: Redirect to LinkedIn authorization
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'authorize') {
    // Generate authorization URL
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/linkedin/callback`;
    const state = searchParams.get('state') || crypto.randomUUID();
    const scopes = 'r_liteprofile r_emailaddress w_member_social rw_organization_admin';

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scopes)}`;

    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ message: 'LinkedIn OAuth endpoint' });
}

// Step 2: Handle OAuth callback
export async function GET_CALLBACK(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    logger.error('LinkedIn OAuth error', { error });
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID || '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Store or update integration
    const integration = await prisma.partnerIntegration.upsert({
      where: {
        partner: 'LINKEDIN',
      },
      create: {
        partner: 'LINKEDIN',
        status: 'ACTIVE',
        accessToken: access_token,
        refreshToken: refresh_token,
        config: {
          expiresIn: expires_in,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      },
      update: {
        status: 'ACTIVE',
        accessToken: access_token,
        refreshToken: refresh_token,
        config: {
          expiresIn: expires_in,
          tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
        lastSyncAt: new Date(),
      },
    });

    logger.info('LinkedIn OAuth successful', { integrationId: integration.id });

    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?success=linkedin_connected`
    );
  } catch (error: any) {
    logger.error('LinkedIn OAuth token exchange failed', { error: error.message });
    return NextResponse.redirect(
      `${request.nextUrl.origin}/integrations?error=oauth_failed`
    );
  }
}

