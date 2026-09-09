export function isMonitorPath(url: string): boolean {
  const path = (url || '').split('?')[0];
  return (
    path === '/' ||
    path === '/ping' ||
    path === '/favicon.ico' ||
    path.startsWith('/health') ||
    path.startsWith('/public')
  );
}
