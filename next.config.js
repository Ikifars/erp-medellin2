// const path = require("path");

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: { unoptimized: true },
//   turbopack: {
//     root: path.resolve(__dirname),
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { 
    unoptimized: true 
  },
  experimental: {
    turbopack: {}
  }
};

module.exports = nextConfig;

