import { NextResponse } from 'next/server';
import { db, admins, eq } from '@lagchow/database';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__admin_session')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!payload?.email) {
      return NextResponse.json({ user: null });
    }

    const user = await db.query.admins.findFirst({
      where: eq(admins.email, payload.email as string)
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}
