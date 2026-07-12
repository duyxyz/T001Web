import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    // Fetch target HTML with user-agent
    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      // Return fallback array if page fetch fails
      return NextResponse.json({ icons: [] });
    }

    const html = await response.text();
    const baseUrl = parsedUrl;

    // Search link tags using lightweight regex
    const linkRegex = /<link\s+[^>]*rel=["']?(?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed)["']?[^>]*>/gi;
    const hrefRegex = /href=["']?([^"' >]+)["']?/i;
    const sizesRegex = /sizes=["']?([^"' >]+)["']?/i;
    const relRegex = /rel=["']?([^"' >]+)["']?/i;

    const discoveredIcons: Array<{ url: string; label: string }> = [];
    const matches = html.match(linkRegex) || [];

    for (const match of matches) {
      const hrefMatch = match.match(hrefRegex);
      if (hrefMatch) {
        let href = hrefMatch[1].trim();

        // Resolve absolute URL
        if (href.startsWith('//')) {
          href = baseUrl.protocol + href;
        } else if (href.startsWith('/')) {
          href = baseUrl.origin + href;
        } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
          const path = baseUrl.pathname.endsWith('/') ? baseUrl.pathname : baseUrl.pathname + '/';
          href = baseUrl.origin + path + href;
        }

        const sizeMatch = match.match(sizesRegex);
        const relMatch = match.match(relRegex);

        const rel = relMatch ? relMatch[1].toLowerCase() : '';
        const size = sizeMatch ? sizeMatch[1] : '';

        let label = 'icon';
        if (rel.includes('apple-touch-icon')) {
          label = size ? `apple (${size})` : 'apple';
        } else {
          label = size ? `icon (${size})` : 'icon';
        }

        discoveredIcons.push({
          url: href,
          label,
        });
      }
    }

    // Add root favicon.ico as a fallback option
    const fallbackIco = baseUrl.origin + '/favicon.ico';
    if (!discoveredIcons.some(i => i.url === fallbackIco)) {
      discoveredIcons.push({ url: fallbackIco, label: 'ico (Gốc)' });
    }

    return NextResponse.json({ icons: discoveredIcons });
  } catch (error) {
    return NextResponse.json({ icons: [] });
  }
}
