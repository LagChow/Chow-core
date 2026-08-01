import { useState, useEffect } from 'react';

// URL safe base64 to Uint8Array converter
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Register service worker if not already registered
      navigator.serviceWorker.register('/sw.js').then(
        function (registration) {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          // Check for existing subscription
          registration.pushManager.getSubscription().then(sub => {
            if (sub) setSubscription(sub);
          });
        },
        function (err) {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) return false;
    setIsSubscribing(true);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsSubscribing(false);
        return false;
      }

      // 2. Subscribe to push manager
      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error('VAPID public key not found');

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(pushSubscription);

      // 3. Send subscription to our backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushSubscription),
      });

      setIsSubscribing(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      setIsSubscribing(false);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    isSubscribing,
    subscribeToPush
  };
}
