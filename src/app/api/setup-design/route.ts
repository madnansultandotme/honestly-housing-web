import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  DEFAULT_SETUP_DESIGN,
  DEFAULT_STANDARD_ROOMS,
  SetupDesignConfig,
  StandardRoomDefault,
} from '@/lib/setupDesign/defaults';

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

function sanitizeStandardRooms(rooms: StandardRoomDefault[]): StandardRoomDefault[] {
  const seen = new Set<string>();

  return (rooms || [])
    .map((room) => ({
      type: String(room.type || '').trim().toLowerCase().replace(/\s+/g, '-'),
      displayName: String(room.displayName || '').trim(),
    }))
    .filter((room) => {
      if (!room.type || !room.displayName || seen.has(room.type)) {
        return false;
      }

      seen.add(room.type);
      return true;
    });
}

export async function GET() {
  try {
    const doc = await adminDb.collection(SETTINGS_COLLECTION).doc(SETUP_DESIGN_DOC).get();
    const data = doc.exists ? doc.data() : null;

    return NextResponse.json({
      success: true,
      config: data?.config || DEFAULT_SETUP_DESIGN,
      standardRooms: data?.standardRooms || DEFAULT_STANDARD_ROOMS,
    });
  } catch (error) {
    console.error('Failed to load setup design:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load setup design',
        config: DEFAULT_SETUP_DESIGN,
        standardRooms: DEFAULT_STANDARD_ROOMS,
      },
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
    const standardRooms = sanitizeStandardRooms(body.standardRooms || DEFAULT_STANDARD_ROOMS);

    await adminDb.collection(SETTINGS_COLLECTION).doc(SETUP_DESIGN_DOC).set(
      {
        config,
        standardRooms,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      config,
      standardRooms,
    });
  } catch (error) {
    console.error('Failed to save setup design:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save setup design' },
      { status: 500 }
    );
  }
}
