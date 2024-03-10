export async function loader() {
    const robotText = `User-agent: *
Allow: /

Sitemap https://www.akarinext.org/sitemaps.xml
    `

    return new Response(robotText, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
        }
    })
}
