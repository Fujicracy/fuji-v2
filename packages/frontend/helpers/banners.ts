export function dismissBanner(key: string): void {
  localStorage.setItem(`${key}BannerDismissed`, 'true');
}

export function getBannerVisibility(key: string): boolean {
  const statusJson = localStorage.getItem(`${key}BannerDismissed`);
  return !statusJson || statusJson !== 'true';
}
