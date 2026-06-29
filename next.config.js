const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  
  // 1. Resolve o aviso de dependência crítica do Supabase
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
  
  // 2. Move o turbopack para o lugar correto exigido pelo Next.js
  experimental: {
    turbopack: {
      root: path.resolve(__dirname),
    },
  },
};

module.exports = nextConfig;
