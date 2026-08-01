import { NextResponse } from 'next/server';
import { db } from '@lagchow/database';
import { admins } from '@lagchow/database/src/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

export async function GET() {
  try {
    const allAdmins = await db.query.admins.findMany({
      orderBy: [desc(admins.createdAt)]
    });
    return NextResponse.json({ admins: allAdmins });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__admin_session')?.value;
    
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can invite' }, { status: 403 });
    }

    const { email, name, role } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Check if exists
    const existing = await db.query.admins.findFirst({
      where: eq(admins.email, emailLower)
    });

    if (existing) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
    }

    const [newAdmin] = await db.insert(admins).values({
      email: emailLower,
      name,
      role: role || 'admin'
    }).returning();

    // Send invite email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'LagChow Admin <noreply@verify.chowvest.com>',
        to: emailLower,
        subject: 'You have been invited to LagChow Admin',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, ${name}!</h2>
            <p>You have been invited to join the LagChow Admin team as a <strong>${role || 'admin'}</strong>.</p>
            <p>Click the link below to login. You will use your email to receive a one-time passcode.</p>
            <a href="http://localhost:3003/login" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:5px;">Login to Admin Panel</a>
          </div>
        `,
      });
    }

    return NextResponse.json({ admin: newAdmin });
  } catch (error: any) {
    console.error('Create Admin Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
