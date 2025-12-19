const productionHostnames = ["app.dopeshot.io", "dopeshot.io", "www.dopeshot.io"];

const normalizeHostname = (hostname?: string) => {
  if (!hostname) return undefined;
  return hostname
    .split(":")[0]
    .trim()
    .toLowerCase();
};

const hostnameFromUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
};

const isProductionHostname = (hostname?: string) => {
  const normalized = normalizeHostname(hostname);
  return normalized !== undefined && productionHostnames.includes(normalized);
};

export const shouldInitializeSentryInBrowser = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return isProductionHostname(window.location.hostname);
};

export const shouldInitializeSentryOnServer = () => {
  if (process.env.VERCEL_ENV === "production") {
    return true;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return isProductionHostname(hostnameFromUrl(siteUrl));
};
