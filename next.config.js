/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes para permitir dominios externos
  images: {
    domains: [
      'fighterdistrict.com',
      'www.fighterdistrict.com',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fighterdistrict.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.fighterdistrict.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      }
    ],
  },
  
  // Configuración de headers para CSP
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.onvopay.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: http:",
              "connect-src 'self' https://api.onvopay.com https://*.woocommerce.com https://fighterdistrict.com",
              "frame-src 'self' https://onvopay.com https://*.onvopay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 