import { NextRequest, NextResponse } from 'next/server';

const RAINFOREST_ENDPOINT = 'https://api.rainforestapi.com/request';

const getAmazonDomain = (linkUrl: string) => {
  try {
    const url = new URL(linkUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (!host.includes('amazon.')) return null;
    return host;
  } catch {
    return null;
  }
};

const extractPrice = (data: any) => {
  const candidates = [
    data?.product?.buybox_winner?.price?.value,
    data?.product?.price?.value,
    data?.product?.price?.raw,
    data?.product?.buybox_winner?.price?.raw,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number') return candidate;
    if (typeof candidate === 'string') {
      const parsed = parseFloat(candidate.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return null;
};

// POST - Pull latest price from Amazon via Rainforest API
export async function POST(request: NextRequest) {
  try {
    const { linkUrl } = await request.json();

    if (!linkUrl) {
      return NextResponse.json({ error: 'linkUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.RAINFOREST_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'Amazon price lookup is not configured. Please contact your administrator to enable this feature by adding a RAINFOREST_API_KEY environment variable.',
          notConfigured: true
        },
        { status: 503 } // Service Unavailable
      );
    }

    const amazonDomain = getAmazonDomain(linkUrl);
    if (!amazonDomain) {
      return NextResponse.json(
        { error: 'Please enter a valid Amazon product link' },
        { status: 400 }
      );
    }

    const requestUrl = new URL(RAINFOREST_ENDPOINT);
    requestUrl.searchParams.set('api_key', apiKey);
    requestUrl.searchParams.set('type', 'product');
    requestUrl.searchParams.set('amazon_domain', amazonDomain);
    requestUrl.searchParams.set('url', linkUrl);

    const response = await fetch(requestUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || 'Failed to retrieve price from Amazon' },
        { status: response.status }
      );
    }

    const price = extractPrice(data);
    if (price === null) {
      return NextResponse.json(
        { error: 'Price not found for this product. Please enter the price manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      price,
      currency: data?.product?.price?.currency || data?.product?.buybox_winner?.price?.currency || null,
      title: data?.product?.title || null,
      imageUrl: data?.product?.main_image?.link || null,
      source: 'rainforest',
    });
  } catch (error: any) {
    console.error('Price lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve price. Please enter the price manually.' },
      { status: 500 }
    );
  }
}
