// Google rewrites result links to a redirect address when they are right-clicked.
export function resolveLink(url) {
  try {
    const { hostname, pathname, searchParams } = new URL(url);
    if (/^(www\.)?google\.(com?\.)?[a-z]{2,3}$/.test(hostname) && pathname === '/url') {
      const target = searchParams.get('url') ?? searchParams.get('q');
      if (target && /^https?:\/\//i.test(target)) return target;
    }
  } catch {
    // An unparsable address is sent as it is.
  }
  return url;
}
