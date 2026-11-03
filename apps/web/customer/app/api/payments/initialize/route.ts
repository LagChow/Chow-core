import { NextResponse } from 'next/server';
import { db, orders, users, inArray, eq } from '@lagchow/database';
import { initializeMonnifyTransaction } from '@lagchow/utils';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('__session')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload?.email) return null;
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, payload.email as string)
    });
    return user || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array is required' }, { status: 400 });
    }

    // Fetch orders and ensure they belong to this user
    const dbOrders = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (dbOrders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    for (const ord of dbOrders) {
      if (ord.userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized order access' }, { status: 403 });
      }
      if (ord.paymentStatus === 'paid') {
        return NextResponse.json({ error: `Order #${ord.id.slice(0, 5)} is already paid` }, { status: 400 });
      }
    }

    // Total amount in Naira across all vendor orders in this checkout
    const totalAmountNaira = dbOrders.reduce((sum, ord) => {
      return sum + (ord.totalAmount + (ord.deliveryFee || 0) + (ord.convenienceFee || 0));
    }, 0);

    const paymentReference = `LC_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Link paymentReference to all relevant orders
    await db
      .update(orders)
      .set({
        paymentReference,
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const firstOrderId = dbOrders[0].id;
    const redirectUrl = `${appUrl}/checkout/success?reference=${paymentReference}&orderId=${firstOrderId}`;

    const monnifyRes = await initializeMonnifyTransaction({
      amountNaira: totalAmountNaira,
      customerName: user.name || 'LagChow Customer',
      customerEmail: user.email,
      paymentReference,
      paymentDescription: `LagChow Food Order (#${firstOrderId.slice(0, 5).toUpperCase()})`,
      redirectUrl,
      metaData: {
        orderIds,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: monnifyRes.checkoutUrl,
      paymentReference,
      transactionReference: monnifyRes.transactionReference,
      amount: totalAmountNaira,
    });
  } catch (error: any) {
    console.error('Error initializing Monnify transaction:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize payment gateway' },
      { status: 500 }
    );
  }
}

