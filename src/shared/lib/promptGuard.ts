const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(previous|above|all)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now/i,
  /new\s+(instructions?|prompts?|rules?)/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /\<system\>/i,
  /act\s+as\s+(a\s+)?(?!professional|candidate)/i,
  /pretend\s+to\s+be/i,
  /roleplay/i,
  /jailbreak/i,
  /sudo\s+mode/i,
  /developer\s+mode/i,
  /admin\s+mode/i,
  /override/i,
];

const ROLE_MANIPULATION_PATTERNS = [
  /you\s+are\s+(not\s+)?(a\s+)?(assistant|ai|bot|model)/i,
  /your\s+(role|purpose|function)\s+is/i,
  /from\s+now\s+on/i,
];

export interface PromptGuardResult {
  safe: boolean;
  reason?: string;
  detectedPatterns?: string[];
}

export const validatePromptSafety = (input: string): PromptGuardResult => {
  const detectedPatterns: string[] = [];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  }

  for (const pattern of ROLE_MANIPULATION_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  }

  if (detectedPatterns.length > 0) {
    return {
      safe: false,
      reason: 'Input contains suspicious patterns that may attempt to manipulate the AI system.',
      detectedPatterns,
    };
  }

  const suspiciousCharCount = (input.match(/[{}[\]<>]/g) || []).length;
  if (suspiciousCharCount > input.length * 0.1) {
    return {
      safe: false,
      reason: 'Input contains excessive special characters that may indicate injection attempts.',
    };
  }

  return { safe: true };
};

export const sanitizePromptInput = (input: string): string => {
  return input
    .replace(/\[system\]/gi, '[user-input]')
    .replace(/\<system\>/gi, '<user-input>')
    .replace(/system\s*:/gi, 'user:')
    .trim();
};
