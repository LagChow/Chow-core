import { NextResponse } from 'next/server';
import { db, users, eq } from '@lagchow/database';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { name, isStudent, location } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updateData: any = {
      name,
      isStudent,
    };

    if (isStudent) {
      updateData.hallOfResidence = location;
      updateData.landmark = null;
    } else {
      updateData.landmark = location;
      updateData.hallOfResidence = null;
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.email, payload.email as string));

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Complete Profile Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
