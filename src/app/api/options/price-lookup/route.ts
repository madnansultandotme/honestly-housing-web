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
        { error: 'RAINFOREST_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const amazonDomain = getAmazonDomain(linkUrl);
    if (!amazonDomain) {
      return NextResponse.json(
        { error: 'linkUrl must be an Amazon product link' },
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
        { error: data?.error || 'Rainforest API request failed' },
        { status: response.status }
      );
    }

    const price = extractPrice(data);
    if (price === null) {
      return NextResponse.json(
        { error: 'Unable to extract price from Rainforest response' },
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
      { error: error.message || 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
