# Amazon Price Lookup Setup Guide

## Overview

The "Pull price from Amazon" feature allows builders to automatically fetch current prices from Amazon product links when adding options to their library. This feature uses the **Rainforest API** to retrieve product data.

## Current Status

⚠️ **Not Configured** - The feature requires a Rainforest API key to function.

## How It Works

1. Builder enters an Amazon product link in the "Product Link" field
2. Clicks "Pull price from Amazon" button
3. System calls Rainforest API with the product URL
4. API returns current price, product title, and image
5. Price field auto-populates with the retrieved value

## Setup Instructions

### Option 1: Enable Rainforest API (Paid Service)

**Cost**: Rainforest API is a paid service. Pricing varies based on usage.
- **Website**: https://www.rainforestapi.com/
- **Pricing**: Check current pricing on their website (typically pay-per-request)

**Steps:**

1. **Sign up for Rainforest API**
   - Go to https://www.rainforestapi.com/
   - Create an account
   - Subscribe to a plan (they offer free trials)
   - Copy your API key from the dashboard

2. **Add API Key to Environment Variables**
   
   For local development (`.env.local`):
   ```env
   RAINFOREST_API_KEY=your_api_key_here
   ```

   For production (Firebase):
   ```bash
   firebase functions:config:set rainforest.api_key="your_api_key_here"
   ```

   Or add to your hosting environment variables if using App Hosting.

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

4. **Test the Feature**
   - Go to Options page
   - Click "Add New Option"
   - Enter an Amazon product link
   - Click "Pull price from Amazon"
   - Price should populate automatically

### Option 2: Manual Price Entry (Free - Current Default)

If you don't want to pay for Rainforest API, users can simply:

1. Open the Amazon product page in a browser
2. Copy the price manually
3. Paste it into the Price field

The "Pull price from Amazon" button will show:
> ⚠️ Price lookup feature not available. Please enter price manually.

## API Endpoint Details

### Request Format

```http
POST /api/options/price-lookup
Content-Type: application/json

{
  "linkUrl": "https://www.amazon.com/dp/B08X4V2YGV"
}
```

### Success Response

```json
{
  "success": true,
  "price": 149.99,
  "currency": "USD",
  "title": "Product Name",
  "imageUrl": "https://...",
  "source": "rainforest"
}
```

### Error Responses

**Not Configured (503)**
```json
{
  "error": "Amazon price lookup is not configured...",
  "notConfigured": true
}
```

**Invalid Link (400)**
```json
{
  "error": "Please enter a valid Amazon product link"
}
```

**Price Not Found (422)**
```json
{
  "error": "Price not found for this product. Please enter the price manually."
}
```

## Alternative Solutions

If Rainforest API is too expensive, consider these alternatives:

### 1. Manual Entry with Browser Extension
- Users install a browser extension to auto-copy prices
- Paste directly into the form
- Free, but requires extra step

### 2. CSV Import
- Bulk upload options via CSV
- Include prices in the CSV file
- Good for adding many products at once

### 3. Use Amazon Product Advertising API (Free with Associates Account)
- Requires Amazon Associates account (free)
- More complex to implement
- Limited to 8,640 requests per day (free tier)
- Would require custom implementation

### 4. Scraping (Not Recommended)
- Direct scraping of Amazon pages violates their ToS
- Not reliable (they actively block scrapers)
- Could result in IP bans

## Implementation Files

- **API Endpoint**: `src/app/api/options/price-lookup/route.ts`
- **Frontend Form**: `src/components/builder/OptionUploadForm.tsx`
- **Environment Config**: `.env.local` / `.env.production`

## Testing

### Test with Rainforest API Key

1. Add valid API key to `.env.local`
2. Restart server
3. Try with this Amazon link:
   ```
   https://www.amazon.com/dp/B08X4V2YGV
   ```
4. Should return price around $149.99 (varies)

### Test without API Key (Current State)

1. Don't add API key (or remove it)
2. Restart server
3. Click "Pull price from Amazon"
4. Should show: "⚠️ Price lookup feature not available. Please enter price manually."

## Troubleshooting

### Button Does Nothing
**Cause**: No product link entered
**Solution**: Enter an Amazon link first

### "Price lookup feature not available"
**Cause**: `RAINFOREST_API_KEY` not configured
**Solution**: Follow Option 1 setup instructions

### "Please enter a valid Amazon product link"
**Cause**: Link is not an Amazon URL
**Solution**: Make sure link contains "amazon.com" or other Amazon domain

### "Failed to retrieve price from Amazon"
**Cause**: API request failed (rate limit, network error, etc.)
**Solution**: 
- Check API key is valid
- Check Rainforest API dashboard for rate limits
- Try again in a few moments

### Price Incorrect or Outdated
**Cause**: Amazon prices change frequently
**Solution**: This is normal - always verify prices before finalizing

## Cost Estimation

**Rainforest API** (as of last update):
- Free Trial: 100 requests
- Starter: $50/month for 1,000 requests
- Pro: $200/month for 5,000 requests
- Enterprise: Custom pricing

**Usage Estimation**:
- Small builder (10 products/day): ~300 requests/month → Starter plan
- Medium builder (30 products/day): ~900 requests/month → Starter plan
- Large builder (100 products/day): ~3,000 requests/month → Pro plan

**Recommendation**: Start with free trial to evaluate usefulness before subscribing.

## Security Notes

1. **Never commit API keys to git**
   - Use `.env.local` (already in `.gitignore`)
   - Use environment variables in production

2. **API Key Permissions**
   - Rainforest API keys should be server-side only
   - Never expose in client-side code
   - Current implementation is server-side only ✓

3. **Rate Limiting**
   - Consider implementing rate limiting
   - Cache results temporarily (e.g., 1 hour)
   - Prevents excessive API costs

## Future Enhancements

Possible improvements to this feature:

1. **Auto-fill product title and image** - Already supported in API response
2. **Price history tracking** - Store historical prices
3. **Price alerts** - Notify when prices drop
4. **Bulk price updates** - Update all options at once
5. **Alternative retailers** - Support Lowe's, Home Depot, etc.
6. **Price comparison** - Show prices from multiple retailers

---

**Status**: ⚠️ Requires Configuration
**Cost**: Paid service (Rainforest API subscription required)
**Alternative**: Manual price entry (free, current default)
**Last Updated**: June 23, 2026
