import { NextResponse } from 'next/server';
import { db, admins, desc } from '@lagchow/database';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__admin_session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'super_admin')) {
    return null;
  }
  return payload;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allAdmins = await db.select().from(admins).orderBy(desc(admins.createdAt));
    return NextResponse.json({ admins: allAdmins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already exists
    const existing = await db.query.admins.findFirst({
      where: (a, { eq }) => eq(a.email, normalizedEmail),
    });

    if (existing) {
      return NextResponse.json({ error: 'Admin with this email already exists' }, { status: 409 });
    }

    const [newAdmin] = await db.insert(admins).values({
      email: normalizedEmail,
      name: name.trim(),
      role: role || 'admin',
    }).returning();

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
