/**
 * Supabase Edge Function for sending push notifications
 * This file should be placed in supabase/functions/send-push/index.ts
 *
 * To deploy this function:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: supabase functions deploy send-push
 * 3. Set the required environment variables:
 *    - EXPO_ACCESS_TOKEN (for Expo push notifications)
 *    - FCM_SERVER_KEY (for Firebase Cloud Messaging, if needed)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface PushNotificationPayload {
  tokens: string[];
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { tokens, notification }: PushNotificationPayload = await req.json();

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No tokens provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare Expo push messages
    const messages: ExpoMessage[] = tokens.map((token) => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: 'default',
      badge: 1,
    }));

    // Send to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    // Log results for debugging
    console.log('Push notification results:', result);

    // Process results and handle errors
    const results = Array.isArray(result.data) ? result.data : [result.data];
    const successCount = results.filter((r) => r.status === 'ok').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        totalSent: tokens.length,
        successCount,
        errorCount,
        results: results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/* 
Example usage from the React Native app:

const { data, error } = await supabase.functions.invoke('send-push', {
  body: {
    tokens: ['ExponentPushToken[...]', 'ExponentPushToken[...]'],
    notification: {
      title: 'New Assignment',
      body: 'You have a new assignment in Mathematics',
      data: {
        type: 'assignment',
        courseId: 'course-123',
        assignmentId: 'assignment-456'
      }
    }
  }
})
*/
