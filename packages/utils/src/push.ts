import webPush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  try {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@lagchow.com',
      publicKey,
      privateKey
    );
  } catch (error) {
    console.warn('Failed to configure web-push VAPID details:', error);
  }
} else {
  console.warn('VAPID keys not found. Push notifications will be disabled during this run/build.');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload
) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification', error);
    if (error.statusCode === 404 || error.statusCode === 410) {
      // The subscription has expired or is no longer valid
      return { success: false, error: 'SubscriptionExpired' };
    }
    return { success: false, error: error.message };
  }
}
