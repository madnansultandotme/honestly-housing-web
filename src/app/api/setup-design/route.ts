import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { DEFAULT_SETUP_DESIGN, SetupDesignConfig } from '@/lib/setupDesign/defaults';

const SETTINGS_COLLECTION = 'systemSettings';
const SETUP_DESIGN_DOC = 'setupDesign';

function sanitizeConfig(config: SetupDesignConfig): SetupDesignConfig {
  return Object.entries(config).reduce<SetupDesignConfig>((acc, [groupKey, group]) => {
    if (!groupKey || !group?.title) {
      return acc;
    }

    acc[groupKey] = {
      title: String(group.title).trim(),
      appliesTo: String(group.appliesTo || '').trim(),
      options: (group.options || [])
        .map((option) => ({
          category: String(option.category || '').trim(),
          name: String(option.name || '').trim(),
          measureLabel: String(option.measureLabel || 'Quantity').trim(),
        }))
        .filter((option) => option.category && option.name),
    };

    return acc;
  }, {});
}

export async function GET() {
  try {
    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(SETUP_DESIGN_DOC).get();
    const config = doc.exists ? doc.data()?.config : DEFAULT_SETUP_DESIGN;

    return NextResponse.json({
      success: true,
      config: config || DEFAULT_SETUP_DESIGN,
    });
  } catch (error) {
    console.error('Failed to load setup design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load setup design', config: DEFAULT_SETUP_DESIGN },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const config = sanitizeConfig(body.config || DEFAULT_SETUP_DESIGN);

    await adminDb.collection(SETTINGS_COLLECTION).doc(SETUP_DESIGN_DOC).set(
      {
        config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Failed to save setup design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save setup design' },
      { status: 500 }
    );
  }
}
