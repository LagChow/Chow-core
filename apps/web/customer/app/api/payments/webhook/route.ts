import { NextResponse } from 'next/server';
import { db, orders, webhookEvents, pushSubscriptions, eq } from '@lagchow/database';
import {
  verifyMonnifyWebhookSignature,
  computeMonnifyTransactionHash,
  sendPushNotification,
} from '@lagchow/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const monnifySignature = req.headers.get('monnify-signature');

    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    const monnifySecret = (process.env.MONNIFY_SECRET_KEY || '').trim();
    if (!monnifySecret) {
      console.error('[Monnify Webhook] Missing MONNIFY_SECRET_KEY in environment');
      return new Response('Webhook secret misconfigured', { status: 500 });
    }

    const eventType = parsedPayload.eventType;
    const eventData = parsedPayload.eventData || {};
    const {
      paymentReference,
      transactionReference,
      amountPaid,
      paidOn,
      paymentStatus,
      transactionHash,
    } = eventData;

    // Verify signature or transaction hash
    let isValid = false;
    if (monnifySignature) {
      isValid = verifyMonnifyWebhookSignature({
        rawBody,
        signatureHeader: monnifySignature,
        secretKey: monnifySecret,
      });
    }

    if (!isValid && transactionHash && paymentReference && amountPaid && paidOn && transactionReference) {
      const computed = computeMonnifyTransactionHash({
        clientSecret: monnifySecret,
        paymentReference,
        amountPaid,
        paidOn,
        transactionReference,
      });
      isValid = verifyMonnifyWebhookSignature({
        transactionHash,
        computedHash: computed,
        secretKey: monnifySecret,
      });
    }

    if (!isValid) {
      console.warn('[Monnify Webhook] Invalid signature verification failed');
      return new Response('Invalid signature', { status: 400 });
    }

    // Idempotency check via webhookEvents
    const eventId = `monnify_${eventType}_${transactionReference || paymentReference || Date.now()}`;
    const [existingEvent] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId))
      .limit(1);

    if (existingEvent && existingEvent.status === 'processed') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    if (!existingEvent) {
      await db.insert(webhookEvents).values({
        eventId,
        eventType: eventType || 'SUCCESSFUL_TRANSACTION',
        provider: 'monnify',
        payload: parsedPayload,
        status: 'pending',
      });
    }

    // Process successful transaction
    if ((eventType === 'SUCCESSFUL_TRANSACTION' || paymentStatus === 'PAID') && paymentReference) {
      const matchingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.paymentReference, paymentReference));

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
              transactionReference: transactionReference || null,
              statusTimestamps: updatedTimestamps,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, ord.id));

          // Notify vendor via push notification
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
                      title: 'Order Funded! 💰',
                      body: `Order #${ord.id.slice(0, 5).toUpperCase()} has been confirmed paid via Monnify.`,
                      url: '/',
                    }
                  ).catch((e) => console.error('Push notification failed:', e))
                )
              );
            }
          } catch (pushErr) {
            console.error('Failed to notify vendor:', pushErr);
          }

          // Emit realtime WebSocket event
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
                    paymentReference,
                    transactionReference,
                    amountPaid,
                  },
                },
              }),
            });
          } catch (wsErr) {
            console.error('Realtime emit failed:', wsErr);
          }
        }
      }

      await db
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(webhookEvents.eventId, eventId));

      return NextResponse.json({ received: true, verified: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Monnify Webhook Error]:', error);
    return new Response(`Webhook handler error: ${error?.message || 'Internal error'}`, {
      status: 500,
    });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'LagChow Monnify Webhook Listener',
    timestamp: new Date().toISOString(),
  });
}

