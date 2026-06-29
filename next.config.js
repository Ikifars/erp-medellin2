/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  
  // Resolve o aviso de dependência crítica do Supabase
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
  
  experimental: {
    // Mantém o turbo ativado de forma limpa para o build
    turbo: {},
  },
};

module.exports = nextConfig;
