/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rencanangoding/shared", "@rencanangoding/db", "@rencanangoding/ai"],
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.serveousercontent.com",
    "localhost:7518",
    "127.0.0.1:7518"
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.trycloudflare.com",
        "*.loca.lt",
        "*.serveousercontent.com",
        "localhost:7518",
        "127.0.0.1:7518"
      ],
      bodySizeLimit: "2mb"
    }
  }
};

module.exports = nextConfig;
