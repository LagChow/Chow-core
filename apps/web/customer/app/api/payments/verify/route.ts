import { NextResponse } from 'next/server';
import { db, orders, pushSubscriptions, eq } from '@lagchow/database';
import { verifyMonnifyTransaction, sendPushNotification } from '@lagchow/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const verification = await verifyMonnifyTransaction(reference);

    if (verification.paid) {
      const matchingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.paymentReference, reference));

      for (const ord of matchingOrders) {
        if (ord.paymentStatus !== 'paid') {
          const currentTimestamps = (ord.statusTimestamps && typeof ord.statusTimestamps === 'object')
            ? (ord.statusTimestamps as Record<string, any>)
            : {};
          const updatedTimestamps = { ...currentTimestamps, paid: new Date().toISOString() };

          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              transactionReference: verification.transactionReference || null,
              statusTimestamps: updatedTimestamps,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, ord.id));

          // Send Push Notification to Vendor that order is funded
          try {
            const subs = await db
              .select()
              .from(pushSubscriptions)
              .where(eq(pushSubscriptions.vendorId, ord.vendorId));
            if (subs.length > 0) {
              await Promise.all(
                subs.map((sub: any) =>
                  sendPushNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    {
                      title: 'Payment Received! 💰',
                      body: `Order #${ord.id.slice(0, 5).toUpperCase()} has been paid via Monnify. Tap to begin preparation.`,
                      url: '/',
                    }
                  ).catch((e) => console.error('Vendor push notification failed:', e))
                )
              );
            }
          } catch (pushErr) {
            console.error('Failed to send vendor push notification:', pushErr);
          }

          // Emit Realtime Event
          try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3010';
            await fetch(`${wsUrl}/emit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'ORDER_PAID',
                data: {
                  eventId: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
                  actorId: ord.userId,
                  actorType: 'customer',
                  data: {
                    orderId: ord.id,
                    vendorId: ord.vendorId,
                    paymentReference: reference,
                    transactionReference: verification.transactionReference,
                    amountPaid: verification.amountPaidNaira,
                  },
                },
              }),
            });
          } catch (wsErr) {
            console.error('Failed to emit realtime payment event:', wsErr);
          }
        }
      }

      return NextResponse.json({
        verified: true,
        paid: true,
        status: verification.status,
        amountPaid: verification.amountPaidNaira,
        transactionReference: verification.transactionReference,
        orderCount: matchingOrders.length,
      });
    }

    return NextResponse.json({
      verified: true,
      paid: false,
      status: verification.status,
      message: 'Transaction has not been completed or is pending.',
    });
  } catch (error: any) {
    console.error('Error verifying Monnify payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify payment status' },
      { status: 500 }
    );
  }
}

