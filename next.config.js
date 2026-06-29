const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
  
  experimental: {
    // No Next 13.5 a propriedade correta dentro de experimental é 'turbo'
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

module.exports = nextConfig;
