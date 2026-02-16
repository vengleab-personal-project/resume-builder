export const TOKEN_LIMITS = {
  DEFAULT_MAX_TOKENS: 5000,
  CHARS_PER_TOKEN: 4,
} as const;

export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / TOKEN_LIMITS.CHARS_PER_TOKEN);
};

export const validateTokenLimit = (text: string, maxTokens?: number): { valid: boolean; tokenCount: number; limit: number } => {
  const tokenCount = estimateTokenCount(text);
  const limit = maxTokens || TOKEN_LIMITS.DEFAULT_MAX_TOKENS;
  
  return {
    valid: tokenCount <= limit,
    tokenCount,
    limit,
  };
};

export const truncateToTokenLimit = (text: string, maxTokens?: number): string => {
  const limit = maxTokens || TOKEN_LIMITS.DEFAULT_MAX_TOKENS;
  const maxChars = limit * TOKEN_LIMITS.CHARS_PER_TOKEN;
  
  if (text.length <= maxChars) {
    return text;
  }
  
  return text.substring(0, maxChars) + '...';
};
