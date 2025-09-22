'use client'

import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from './action'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub)
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message)
      setMessage('')
    }
  }

  if (!isSupported) {
    return (
      <p className="text-red-600 font-semibold">
        Push notifications are not supported in this browser.
      </p>
    )
  }

  return (
    <div className="p-4 border rounded-lg shadow mb-6">
      <h3 className="text-lg font-bold mb-2">🔔 Push Notifications</h3>
      {subscription ? (
        <div className="space-y-3">
          <p className="text-green-700 font-medium">
            ✅ You are subscribed to push notifications.
          </p>
          <button
            onClick={unsubscribeFromPush}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Unsubscribe
          </button>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={sendTestNotification}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Send Test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-700">
            ❌ You are not subscribed to push notifications.
          </p>
          <button
            onClick={subscribeToPush}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Subscribe
          </button>
        </div>
      )}
    </div>
  )
}

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  if (isStandalone) {
    return null
  }

  return (
    <div className="p-4 border rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">📲 Install App</h3>
      <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
        Add to Home Screen
      </button>
      {isIOS && (
        <p className="text-sm text-gray-600 mt-2">
          To install this app on your iOS device, tap the share button ⎋ and
          then <strong>Add to Home Screen ➕</strong>.
        </p>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <div className="max-w-md mx-auto mt-10 space-y-6 font-sans">
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  )
}
