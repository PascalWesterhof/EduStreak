importScripts("https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCzm_rS9786pwkuoQ4y9J2ldPeMhQM-biA",
  authDomain: "edustreak-e3e89.firebaseapp.com",
  projectId: "edustreak-e3e89",
  storageBucket: "edustreak-e3e89.firebasestorage.app",
  messagingSenderId: "580888857819",
  appId: "1:580888857819:web:2e77b92144a51442ed10fe",
  measurementId: "G-9X739T4LCH"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
