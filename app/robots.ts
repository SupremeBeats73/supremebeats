import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.supremebeatsstudio.com'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/'], // Keeps private pages out of Google search
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
