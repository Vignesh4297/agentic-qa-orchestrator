const REQUIRED_VARIABLES = ['BASE_URL', 'STANDARD_USER', 'LOCKED_USER', 'USER_PASSWORD'] as const;

type RequiredVariable = (typeof REQUIRED_VARIABLES)[number];

export interface Env {
  baseUrl: string;
  standardUser: string;
  lockedUser: string;
  userPassword: string;
}

/**
 * Reads the base URL and credentials from process.env (populated from .env by
 * playwright.config.ts). Throws a clear error naming every missing variable.
 */
export function getEnv(): Env {
  const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and set a value for each.',
    );
  }

  const read = (name: RequiredVariable): string => process.env[name] as string;

  return {
    baseUrl: read('BASE_URL'),
    standardUser: read('STANDARD_USER'),
    lockedUser: read('LOCKED_USER'),
    userPassword: read('USER_PASSWORD'),
  };
}
