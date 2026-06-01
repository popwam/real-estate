import { createHash } from 'crypto';

const BY_TOKEN_PATTERN = /^\/conversations\/by-token\/[^/?#]+(\/messages)?$/;
const ORGANIZATION_DOMAIN_PATTERN = /^\/organization-domains\/[^/?#]+(\/[^/?#]+)?$/;
const PLATFORM_DOMAIN_PATTERN = /^\/platform-admin\/domains\/[^/?#]+(\/[^/?#]+)?$/;

export function sanitizeRequestPath(path: string | undefined): string {
  if (!path) {
    return '/';
  }

  const pathname = stripQueryString(path);

  if (BY_TOKEN_PATTERN.test(pathname)) {
    return pathname.endsWith('/messages')
      ? '/conversations/by-token/:shareToken/messages'
      : '/conversations/by-token/:shareToken';
  }

  if (ORGANIZATION_DOMAIN_PATTERN.test(pathname)) {
    return pathname.replace(/^\/organization-domains\/[^/?#]+/, '/organization-domains/:id');
  }

  if (PLATFORM_DOMAIN_PATTERN.test(pathname)) {
    return pathname.replace(/^\/platform-admin\/domains\/[^/?#]+/, '/platform-admin/domains/:id');
  }

  return pathname;
}

export function hashLogValue(value: string | undefined, salt: string): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  return createHash('sha256').update(`${salt}:${normalized}`).digest('hex');
}

function stripQueryString(path: string): string {
  const queryStart = path.search(/[?#]/);

  if (queryStart === -1) {
    return path || '/';
  }

  return path.slice(0, queryStart) || '/';
}
