export function getImageProxyUrl(imageUrl) {
  if (!imageUrl) return "";

  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1000&h=1000&fit=contain`;
}
