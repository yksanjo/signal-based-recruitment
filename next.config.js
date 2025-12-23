/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    APOLLO_API_KEY: process.env.APOLLO_API_KEY,
    CLAY_API_KEY: process.env.CLAY_API_KEY,
  },
}

module.exports = nextConfig




