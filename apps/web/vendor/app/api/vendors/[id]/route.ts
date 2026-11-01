import { NextResponse } from 'next/server';
import { db, vendors } from '@lagchow/database';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

async function getVendorIdFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const decoded = await verifyToken(token);
    return (decoded?.vendorId as string) || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, id),
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionVendorId = await getVendorIdFromSession();
    const { id } = await params;

    if (!sessionVendorId || sessionVendorId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      phone,
      coverImage,
      preparationTime,
      deliveryTime,
      minOrder,
      lat,
      lng,
      tags,
      bankAccount,
    } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (preparationTime !== undefined) updateData.preparationTime = Number(preparationTime);
    if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;
    if (minOrder !== undefined) updateData.minOrder = String(minOrder);
    if (lat !== undefined) updateData.lat = lat === '' || lat === null ? null : Number(lat);
    if (lng !== undefined) updateData.lng = lng === '' || lng === null ? null : Number(lng);
    if (tags !== undefined) updateData.tags = tags;
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount;

    const [updatedVendor] = await db
      .update(vendors)
      .set(updateData)
      .where(eq(vendors.id, id))
      .returning();

    if (!updatedVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Vendor profile updated successfully',
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
