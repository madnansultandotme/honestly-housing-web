import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // CSV template with headers and example rows
    const csvContent = `Category,Name,RoomName,Quantity,Brand,Price,Description,DueDate,SubType
Electrical,Ceiling Fan,Living Room,1,Hunter,299.99,52-inch brushed nickel ceiling fan,2024-12-31,
Electrical,Vanity Light,Primary Bathroom,2,Kichler,149.99,3-light vanity fixture,2024-12-31,
Flooring,Hardwood Planks,Living Room,500,Shaw,4.99,Oak hardwood flooring per sq ft,2025-01-15,
Paint,Benjamin Moore White Dove,Living Room,1,Benjamin Moore,65.99,Premium interior paint,2025-01-10,trim
Paint,Sherwin Williams Agreeable Gray,Living Room,1,Sherwin Williams,68.99,Premium interior paint,2025-01-10,walls
Plumbing,Kitchen Faucet,Kitchen,1,Kohler,349.99,Pull-down kitchen faucet,2024-12-20,
Lighting,Pendant Light,Kitchen,3,Progress Lighting,189.99,Modern pendant light,2025-01-05,
Tile,Subway Tile,Primary Bathroom,100,Daltile,8.99,White subway tile per sq ft,2025-01-20,
Countertops,Quartz Countertop,Kitchen,50,Cambria,89.99,Quartz countertop per sq ft,2025-02-01,
Hardware,Cabinet Pulls,Kitchen,20,Amerock,12.99,Brushed nickel cabinet hardware,2025-01-25,`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="selections-template-${projectId || 'sample'}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}
