/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Allow loading uploaded logos from tenant-service in dev.
  images: { remotePatterns: [{ protocol: 'http', hostname: 'localhost' }, { protocol: 'https', hostname: '**' }] },
};
