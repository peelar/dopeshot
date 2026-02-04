export function buildMemoryPath(itemId: string) {
  return `/m/${itemId}`;
}

export function buildSharePath(shareHash: string) {
  return `/share/${shareHash}`;
}

export function setMemoryUrl(itemId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.pathname = buildMemoryPath(itemId);
  url.searchParams.delete("memory");
  window.history.pushState({}, "", url.toString());
}

export function clearMemoryUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.pathname = "/";
  url.searchParams.delete("memory");
  window.history.pushState({}, "", url.toString());
}
