import { siteConfig } from "@/lib/site";

export async function GET() {
    const body = `# ${siteConfig.name}

> ${siteConfig.description}

## Site
- URL: ${siteConfig.url}
- Owner: ${siteConfig.creator}

## Key pages
- Home: ${siteConfig.url}/
- Work: ${siteConfig.url}/#work (portfolio work pages under /work/*)
- Resume: ${siteConfig.url}/resume
- Contact: ${siteConfig.url}/contact

## Notes
- This site is a portfolio. For collaboration inquiries, use the Contact page.
`;
    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
        },
    });
}
