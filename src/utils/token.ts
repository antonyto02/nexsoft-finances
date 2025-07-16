export function extractCompanyId(token?: string): string {
  if (!token) {
    throw new Error('Authorization header missing');
  }
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = raw.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid token');
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.company_id || payload.companyId;
  } catch {
    throw new Error('Invalid token');
  }
}
