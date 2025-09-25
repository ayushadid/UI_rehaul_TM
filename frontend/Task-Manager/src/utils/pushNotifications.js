import axiosInstance from './axiosinstance';
import { API_PATHS } from './apiPaths';

const VAPID_PUBLIC_KEY = 'BNI2dKecJbMTe8i8l-F6Ftr2GT8gHEXqcd3j-pDJO6CCTUTgIM6QZ4Z9ia5V-6xla8mCBqh9zOMH6J1FnaxWjms'; // 👈 Get this from your backend .env file

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
    }

    try {
        const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
        let subscription = await swRegistration.pushManager.getSubscription();

        if (subscription === null) {
            console.log('No subscription found, creating new one...');
            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Send the new subscription to your backend
            await axiosInstance.post(API_PATHS.PUSH.SUBSCRIBE, subscription);
            console.log('User is subscribed.');
        } else {
            console.log('User is already subscribed.');
        }
    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
    }
}