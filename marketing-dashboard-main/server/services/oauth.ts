import axios from "axios";
import { Platform, PLATFORM_CONFIGS, OAuthState } from "../../shared/types";
import { ENV } from "../_core/env";

// In-memory state store for OAuth flows (in production, use Redis or similar)
const oauthStateStore = new Map<string, OAuthState>();

function generateStateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getOAuthRedirectUri(platform: Platform): string {
  const baseUrl = ENV.appId ? `https://${ENV.appId}.manus.space` : "http://localhost:3000";
  return `${baseUrl}/api/oauth/${platform}/callback`;
}

export function generateOAuthUrl(
  platform: Platform,
  userId: number,
  clientId: string,
  redirectUrl: string = "/dashboard/connections"
): string {
  const config = PLATFORM_CONFIGS[platform];
  const state = generateStateToken();
  const redirectUri = getOAuthRedirectUri(platform);

  // Store state for verification
  oauthStateStore.set(state, {
    platform,
    userId,
    redirectUrl,
    timestamp: Date.now(),
  });

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const entries = Array.from(oauthStateStore.entries());
  for (const [key, value] of entries) {
    if (value.timestamp < tenMinutesAgo) {
      oauthStateStore.delete(key);
    }
  }

  const params = new URLSearchParams();

  switch (platform) {
    case "google_ads":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", config.scopes.join(" "));
      params.set("access_type", "offline");
      params.set("prompt", "consent");
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "meta_ads":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", config.scopes.join(","));
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "linkedin_ads":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", config.scopes.join(" "));
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    case "hubspot":
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", config.scopes.join(" "));
      params.set("state", state);
      return `${config.authUrl}?${params.toString()}`;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function verifyOAuthState(state: string): OAuthState | null {
  const storedState = oauthStateStore.get(state);
  if (!storedState) return null;

  // Remove state after verification (one-time use)
  oauthStateStore.delete(state);

  // Check if state is not expired (10 minutes)
  if (Date.now() - storedState.timestamp > 10 * 60 * 1000) {
    return null;
  }

  return storedState;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export async function exchangeCodeForTokens(
  platform: Platform,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const config = PLATFORM_CONFIGS[platform];
  const redirectUri = getOAuthRedirectUri(platform);

  try {
    switch (platform) {
      case "google_ads": {
        const response = await axios.post(config.tokenUrl, {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        });
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
          tokenType: response.data.token_type,
        };
      }

      case "meta_ads": {
        const params = new URLSearchParams();
        params.set("client_id", clientId);
        params.set("client_secret", clientSecret);
        params.set("redirect_uri", redirectUri);
        params.set("code", code);
        
        const response = await axios.get(`${config.tokenUrl}?${params.toString()}`);
        return {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          tokenType: response.data.token_type,
        };
      }

      case "linkedin_ads": {
        const params = new URLSearchParams();
        params.set("grant_type", "authorization_code");
        params.set("code", code);
        params.set("client_id", clientId);
        params.set("client_secret", clientSecret);
        params.set("redirect_uri", redirectUri);

        const response = await axios.post(config.tokenUrl, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
        };
      }

      case "hubspot": {
        const response = await axios.post(
          config.tokenUrl,
          {
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
        };
      }

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    console.error(`OAuth token exchange failed for ${platform}:`, error.response?.data || error.message);
    throw new Error(`Failed to exchange code for tokens: ${error.message}`);
  }
}

export async function refreshAccessToken(
  platform: Platform,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const config = PLATFORM_CONFIGS[platform];

  try {
    switch (platform) {
      case "google_ads": {
        const response = await axios.post(config.tokenUrl, {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
        });
        return {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          tokenType: response.data.token_type,
        };
      }

      case "linkedin_ads": {
        const params = new URLSearchParams();
        params.set("grant_type", "refresh_token");
        params.set("refresh_token", refreshToken);
        params.set("client_id", clientId);
        params.set("client_secret", clientSecret);

        const response = await axios.post(config.tokenUrl, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
        };
      }

      case "hubspot": {
        const response = await axios.post(
          config.tokenUrl,
          {
            grant_type: "refresh_token",
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        return {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresIn: response.data.expires_in,
        };
      }

      case "meta_ads":
        // Meta long-lived tokens don't typically need refresh in the same way
        throw new Error("Meta tokens should be exchanged for long-lived tokens instead of refreshed");

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error: any) {
    console.error(`Token refresh failed for ${platform}:`, error.response?.data || error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}
