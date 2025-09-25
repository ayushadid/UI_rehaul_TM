// public/service-worker.js

console.log('Service Worker: Loaded');

// Listen for incoming push events
self.addEventListener('push', e => {
    const data = e.data.json();
    console.log('Service Worker: Push Received.', data);

    const title = data.title;
    const options = {
        body: data.body,
        icon: '/icon-192x192.png', // Make sure you have an icon in your /public folder
        data: {
            link: data.link
        }
    };

    e.waitUntil(self.registration.showNotification(title, options));
});

// Listen for clicks on the notification
self.addEventListener('notificationclick', event => {
    // Close the notification pop-up
    event.notification.close();
    
    // Open the page specified in the notification's link
    event.waitUntil(clients.openWindow(event.notification.data.link));
});