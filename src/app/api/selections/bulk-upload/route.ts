import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { projectId, csvData, createdBy } = await request.json();

    if (!projectId || !csvData || !createdBy) {
      return NextResponse.json(
        { error: 'projectId, csvData, and createdBy are required' },
        { status: 400 }
      );
    }

    // Parse CSV helper
    const parseCsvLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
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

    // Validate required headers
    const requiredHeaders = ['category', 'name', 'roomname'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Get column indices
    const categoryIndex = headers.indexOf('category');
    const nameIndex = headers.indexOf('name');
    const roomNameIndex = headers.indexOf('roomname');
    const quantityIndex = headers.indexOf('quantity');
    const brandIndex = headers.indexOf('brand');
    const priceIndex = headers.indexOf('price');
    const descriptionIndex = headers.indexOf('description');
    const dueDateIndex = headers.indexOf('duedate');
    const subTypeIndex = headers.indexOf('subtype');

    // Get project categories and rooms for mapping
    const categoriesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('categories')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    const roomsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('rooms')
      .get();
    
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '').trim();
      if (!line) continue;

      try {
        const values = parseCsvLine(line);

        const categoryName = values[categoryIndex]?.trim();
        const name = values[nameIndex]?.trim();
        const roomName = values[roomNameIndex]?.trim();
        const quantity = quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 1 : 1;
        const brand = brandIndex >= 0 ? values[brandIndex]?.trim() : '';
        const price = priceIndex >= 0 ? parseFloat(values[priceIndex]) || 0 : 0;
        const description = descriptionIndex >= 0 ? values[descriptionIndex]?.trim() : '';
        const dueDate = dueDateIndex >= 0 ? values[dueDateIndex]?.trim() : '';
        const subType = subTypeIndex >= 0 ? values[subTypeIndex]?.trim() : '';

        if (!categoryName || !name) {
          results.errors.push(`Row ${i + 1}: Missing category or name`);
          results.failed++;
          continue;
        }

        // Find matching category
        const category = categories.find(
          c => c.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (!category) {
          results.errors.push(`Row ${i + 1}: Category "${categoryName}" not found`);
          results.failed++;
          continue;
        }

        // Find matching room (optional)
        let roomId = null;
        if (roomName) {
          const room = rooms.find(
            r => r.name.toLowerCase() === roomName.toLowerCase()
          );
          if (room) {
            roomId = room.id;
          }
        }

        // Parse due date if provided
        let parsedDueDate = null;
        if (dueDate) {
          const date = new Date(dueDate);
          if (!isNaN(date.getTime())) {
            parsedDueDate = date.toISOString();
          }
        }

        // Create selection
        const selectionData: any = {
          projectId,
          categoryId: category.id,
          categoryName: category.name,
          name,
          quantity,
          brand: brand || null,
          description: description || null,
          actualCost: price,
          allowance: 0,
          difference: price,
          status: 'awaiting_approval',
          dueDate: parsedDueDate,
          roomId: roomId,
          roomName: roomName || null,
          subType: subType || null,
          locked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy,
        };

        await adminDb
          .collection('projects')
          .doc(projectId)
          .collection('items')
          .add(selectionData);
        results.success++;
      } catch (error: any) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${results.success} selections`,
      results,
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload selections' },
      { status: 500 }
    );
  }
}
