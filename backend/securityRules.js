// securityRules.js - The "Vulnerability Database"
const securityRules = [
  {
    id: 'HARDCODED_SECRET',
    category: 'Identity & Access', // Added for non-coders
    severity: 'CRITICAL',
    pattern: /(key|secret|password|token|auth|api_key|private_key) *= *['"][a-zA-Z0-9-._~+/]{12,}['"]/i,
    description: 'Potential hardcoded credential or API key detected.',
    fix: 'Use environment variables (.env) and ensure .env is in your .gitignore.'
  },
  {
    id: 'EVAL_USAGE',
    category: 'Code Execution', // Added for non-coders
    severity: 'HIGH',
    pattern: /\beval\s*\(.*\)/,
    description: 'Use of eval() detected, which allows execution of arbitrary strings.',
    fix: 'Refactor to use JSON.parse() or direct property access instead.'
  },
  {
    id: 'INSECURE_CORS',
    category: 'Network Security', // Added for non-coders
    severity: 'MEDIUM',
    pattern: /origin: *['"]\*['"]/,
    description: 'CORS policy allows all origins (*), which is a security risk.',
    fix: 'Specify exact trusted domains in your CORS configuration.'
  },
  {
    id: 'SQL_INJECTION_RISK',
    category: 'Database Safety', // Added for non-coders
    severity: 'HIGH',
    pattern: /(\${.*}|['"] *\+ *.*) *(FROM|SELECT|UPDATE|DELETE|INSERT)/i,
    description: 'Potential SQL injection via string concatenation in a query.',
    fix: 'Use parameterized queries or an ORM (Mongoose/Sequelize) to sanitize inputs.'
  },
  {
    id: 'INSECURE_MODEL_LOADING',
    category: 'ML Model Security',
    severity: 'HIGH',
    pattern: /torch\.load\s*\(|pickle\.load\s*\(|np\.load\s*\(/i,
    description: 'Model loading without validation. PyTorch/NumPy deserialization can execute arbitrary code.',
    fix: 'Use torch.load(..., map_location=..., weights_only=True) or validate model sources before loading.'
  },
  {
    id: 'UNVALIDATED_USER_INPUT',
    category: 'Input Validation',
    severity: 'HIGH',
    pattern: /req\.body\[|req\.query\[|argv\[/,
    description: 'User input received without visible validation before processing.',
    fix: 'Add input sanitization, type checking, and bounds validation before using user data.'
  },
  {
    id: 'NO_RATE_LIMITING',
    category: 'Denial of Service',
    severity: 'MEDIUM',
    pattern: /app\.(get|post|put|delete)\s*\(/,
    description: 'Routes defined without rate limiting protection.',
    fix: 'Implement rate limiting middleware (express-rate-limit, slowdown) to prevent DoS attacks.'
  },
  {
    id: 'WEAK_ENCRYPTION',
    category: 'Data Protection',
    severity: 'MEDIUM',
    pattern: /md5|sha1(?!256|512)|(crypt|encrypt).*caesar|rot13/i,
    description: 'Use of weak or deprecated cryptographic algorithms detected.',
    fix: 'Use SHA-256+, bcrypt for passwords, or AES-256 for encryption. Avoid MD5/SHA1.'
  },
  {
    id: 'TENSOR_SHAPE_MISMATCH',
    category: 'ML Pipeline',
    severity: 'MEDIUM',
    pattern: /\.reshape\(|\.view\(|\(.*,.*\)|input_shape|output_shape/i,
    description: 'Potential tensor shape issues that could cause runtime failures or incorrect inferences.',
    fix: 'Add shape validation and assertions before model inference to catch dimension mismatches early.'
  },
  {
    id: 'GPU_MEMORY_LEAK',
    category: 'ML Performance',
    severity: 'MEDIUM',
    pattern: /\.cuda\(|\.to\(device|torch\.device|\.gpu/i,
    description: 'GPU operations detected without explicit memory cleanup.',
    fix: 'Use torch.cuda.empty_cache(), context managers, or properly detach tensors after inference.'
  },
  {
    id: 'DEBUG_MODE_ENABLED',
    category: 'Configuration',
    severity: 'MEDIUM',
    pattern: /debug\s*:\s*true|DEBUG\s*=\s*['"]*true/i,
    description: 'Debug mode is enabled, which exposes sensitive information in error messages.',
    fix: 'Set debug=False in production. Use environment variables to control debug mode.'
  }
];

module.exports = securityRules;