import { MetadataRoute } from 'next'
import { getAllCasesFromAllSources } from '@/lib/parsers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const cases = await getAllCasesFromAllSources()

    const baseUrl = 'https://banana.aigc.green'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ]

    // Dynamic case pages
    const casePages: MetadataRoute.Sitemap = cases.map((caseItem) => ({
        url: `${baseUrl}/case/${caseItem.id}`,
        lastModified: caseItem.scraped_at ? new Date(caseItem.scraped_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    return [...staticPages, ...casePages]
}
