export declare const GENERATED_SECRET_KEYS: string[]
export declare function generateSecret(): string
export declare function missingSecretKeys(
  envText: string,
  keys?: string[],
): string[]
export declare function addMissingSecrets(
  envText: string,
  keys: string[],
  make?: () => string,
): { text: string; added: string[] }
