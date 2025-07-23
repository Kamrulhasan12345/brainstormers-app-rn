# Real-time Bell Icon Unread Count Implementation

## Overview

The bell icons in both student and admin dashboards are now fully connected to real-time Supabase subscriptions, ensuring the unread count updates instantly when notifications are added, updated, or deleted.

## How It Works

### 1. Real-time Subscription Setup

- **Student Dashboard** (`app/(tabs)/index.tsx`): Uses `useNotifications()` hook
- **Admin Dashboard** (`app/(admin-tabs)/index.tsx`): Uses `NotificationButton` component with `useNotifications()` hook
- Both get live updates from the same real-time subscription

### 2. Enhanced Real-time Updates (`hooks/useNotifications.ts`)

#### INSERT Events (New Notifications)

```typescript
// When a new notification is created:
- Immediately adds to notifications list
- Increments unread count if notification is unread
- Checks expiration to avoid expired notifications
- Updates bell icon badge instantly
```

#### UPDATE Events (Marking as Read/Unread)

```typescript
// When notification status changes:
- Updates the specific notification in the list
- Adjusts unread count based on read status change
- Bell icon badge updates immediately
```

#### DELETE Events (Notification Removal)

```typescript
// When a notification is deleted:
- Removes from notifications list
- Decreases unread count if deleted notification was unread
- Bell icon badge updates immediately
```

### 3. Bell Icon Implementation

#### Student Dashboard

```tsx
<View style={styles.notificationIconContainer}>
  <Bell size={24} color="#64748B" />
  {unreadCount > 0 && (
    <View style={styles.notificationBadge}>
      <Text style={styles.notificationBadgeText}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  )}
</View>
```

#### Admin Dashboard

```tsx
function NotificationButton({ onPress }: { onPress: () => void }) {
  const { unreadCount } = useNotifications();
  // Same badge implementation as student
}
```

### 4. Fallback System

- **Periodic Refresh**: Every 30 seconds as backup for edge cases
- **Initial Load**: Fetches all notifications on component mount
- **Error Handling**: Graceful degradation if real-time fails

## Real-time Flow Example

### Scenario: Admin sends notification to student

1. **Admin creates notification** → Inserts into database
2. **Student's subscription receives INSERT event** → Instantly
3. **Student's unread count increments** → Bell badge appears/updates
4. **Student clicks notification** → Marks as read in database
5. **Student's subscription receives UPDATE event** → Instantly
6. **Student's unread count decrements** → Bell badge updates/disappears

## Debug Logging

Enhanced console logging shows:

- `🔔 useNotifications: Unread count updated to X for user Y`
- Subscription status changes
- Individual notification events (INSERT/UPDATE/DELETE)
- Connection cleanup on logout

## Performance Benefits

- **Instant Updates**: No polling or manual refresh needed
- **Efficient**: Only updates what changed, not full reload
- **Accurate**: Real-time synchronization across all devices
- **Reliable**: Fallback periodic refresh ensures consistency

## Testing the Implementation

1. **Login as student** → Check console for subscription setup
2. **Login as admin** → Send notification to the student
3. **Check student bell icon** → Should update immediately
4. **Click notification** → Bell count should decrease instantly
5. **Check admin dashboard** → Admin's own notifications work the same way

The bell icons now provide real-time, accurate notification counts without any delays or manual refresh requirements!
