import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Diet',
    short_name: 'Diet',
    description: 'Monitoramento de dieta pessoal',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F7F5',
    theme_color: '#1A3A2A',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
