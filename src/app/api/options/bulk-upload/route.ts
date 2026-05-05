import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// POST - Bulk upload options from CSV
export async function POST(request: NextRequest) {
  try {
    const { csvData, builderOrgId } = await request.json();

    if (!csvData || !builderOrgId) {
      return NextResponse.json(
        { error: 'csvData and builderOrgId are required' },
        { status: 400 }
      );
    }

    const parseCsvLine = (line: string) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }

        if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
          continue;
        }

        current += char;
      }

      values.push(current.trim());
      return values;
    };

    // Parse CSV data
    const lines = csvData.trim().split(/\r?\n/);
    const headers = parseCsvLine(lines[0]).map((h: string) => h.toLowerCase());
    
    // Expected headers: title, category, price, tier, linkUrl, imageUrl
    const requiredHeaders = ['title', 'category', 'price'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    const options = [];
    const errors = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '').trim();
      if (!line) continue;

      const values = parseCsvLine(line);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.title || !row.category || !row.price) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      // Parse price
      const price = parseFloat(row.price.replace(/[^0-9.]/g, ''));
      if (isNaN(price)) {
        errors.push(`Row ${i + 1}: Invalid price format`);
        continue;
      }

      // Create option object
      const option = {
        title: row.title,
        categoryId: row.category.toLowerCase().replace(/\s+/g, '-'),
        categoryName: row.category,
        price,
        tier: row.tier || 'good',
        linkUrl: row.linkurl || row.link || '',
        imageUrl: row.imageurl || row.image || '',
        builderOrgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const docRef = await adminDb.collection('options').add(option);
        options.push({ id: docRef.id, ...option });
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: options.length,
      errors: errors.length > 0 ? errors : null,
      options,
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk upload options' },
      { status: 500 }
    );
  }
}
