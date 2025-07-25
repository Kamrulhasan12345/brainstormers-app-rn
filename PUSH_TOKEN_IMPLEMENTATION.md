# Push Token Management Implementation

This implementation adds comprehensive push notification token management to the Brainstormers LMS app for both student and admin/teacher users. **It properly supports multi-device scenarios where a single user can be logged in on multiple devices simultaneously.**

## Key Features

### Multi-Device Support

- **Per-Device Token Management**: Each device gets its own unique push token
- **Safe Logout**: Logging out only removes the current device's token, not all user tokens
- **Cross-Device Notifications**: Users receive notifications on all their active devices
- **Token Deduplication**: Prevents duplicate tokens for the same device

## Files Modified/Created

### New Files

1. **`services/push-token-management.ts`** - Core push token management service
2. **`hooks/usePushTokenActivity.ts`** - Hook for tracking token activity on app state changes
3. **`components/PushTokenDebug.tsx`** - Debug component for testing push token functionality

### Modified Files

1. **`contexts/AuthContext.tsx`** - Added push token registration/deactivation
2. **`app/_layout.tsx`** - Added push token activity tracking
3. **`app/(tabs)/index.tsx`** - Added debug component (development only)
4. **`services/push-notifications.ts`** - Updated to align with new schema

## Features Implemented

### 1. Push Token Registration

- **When**: Automatically triggered on login and app startup
- **Where**: `AuthContext.tsx` in login flow and session check
- **What**: Registers device's Expo push token with user's ID in database
- **Platform Detection**: Automatically detects iOS/Android/Web platform
- **Smart Registration**:
  - Checks if token already exists for the user before inserting
  - Updates `last_active` timestamp if token exists
  - Only creates new record if token is truly new

### 2. Push Token Deactivation

- **When**: Automatically triggered on logout
- **Where**: `AuthContext.tsx` in logout flow
- **What**: **Removes ONLY the current device's push token** (not all user tokens)
- **Multi-Device Safe**: Other devices remain logged in and continue receiving notifications
- **Method**: `deactivateCurrentDeviceToken()` - only removes current device's token

### 3. Token Activity Tracking

- **When**: App becomes active/foreground
- **Where**: `usePushTokenActivity.ts` hook used in main layout
- **What**: Updates `last_active` timestamp for current token
- **Purpose**: Helps identify active vs inactive tokens

### 4. Periodic Cleanup

- **When**: Every 24 hours after app startup
- **Where**: `push-token-management.ts` service
- **What**: Removes tokens older than 30 days
- **Purpose**: Keeps database clean and efficient

### 5. Permission Handling

- **Request**: Automatically requests push notification permissions
- **Graceful Degradation**: App continues to work without push permissions
- **Device Check**: Only works on physical devices (not simulators)

## Database Schema

The implementation uses the `push_tokens` table with this structure:

```sql
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])),
  last_active timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

## Flow Diagram

### Login Flow

1. User logs in → `AuthContext.login()`
2. Authentication successful → User profile loaded
3. `pushTokenService.registerPushToken(userId)` called
4. Device permissions checked/requested
5. Expo push token retrieved
6. Token stored in database with platform info

### App Startup Flow

1. App starts → `AuthContext.checkAuthState()`
2. Existing session found → User profile loaded
3. Push token registered for returning user
4. `usePushTokenActivity` hook starts monitoring app state
5. Token activity updated when app becomes active

### Logout Flow

1. User logs out → `AuthContext.logout()`
2. Current user ID captured before state clearing
3. `pushTokenService.deactivateUserTokens(userId)` called
4. All tokens for user deleted from database
5. Auth state cleared → User redirected to login

## Configuration

### Environment Variables

- `EXPO_PUBLIC_PROJECT_ID` - Your Expo project ID for push tokens

### Dependencies Added

- `expo-device` - For device detection
- `expo-constants` - For project configuration
- `expo-notifications` - Already present, used for push token generation

## Usage Examples

### Manual Token Registration

```typescript
import { pushTokenService } from '@/services/push-token-management';

// Register token for specific user
await pushTokenService.registerPushToken(userId);
```

### Manual Token Cleanup

```typescript
// Deactivate all tokens for user
await pushTokenService.deactivateUserTokens(userId);

// Clean up old tokens (30+ days)
await pushTokenService.cleanupOldTokens(30);
```

### Get Current Token (Debug)

```typescript
const currentToken = pushTokenService.getCurrentToken();
console.log('Current push token:', currentToken);
```

## Debug Features

The `PushTokenDebug` component (visible only in development) provides:

- Display current token info
- Test token registration
- Test token cleanup
- Real-time debugging of push token state

## Error Handling

- **Graceful Degradation**: Push token failures don't block login/logout
- **Demo Mode**: All push token operations are skipped in demo mode
- **Permission Denied**: App continues to work without push notifications
- **Network Errors**: Logged but don't crash the app

## Security Considerations

1. **Token Cleanup**: Old tokens are automatically cleaned up
2. **User Isolation**: Each user's tokens are isolated in database
3. **Logout Cleanup**: All tokens removed on logout for security
4. **No Token Exposure**: Tokens are not logged or exposed in production

## Testing

Use the debug component in development to:

1. Verify token registration on login
2. Check token cleanup on logout
3. Monitor token activity updates
4. Test periodic cleanup functionality

## Production Deployment

Before production:

1. Remove or disable `PushTokenDebug` component
2. Configure proper Expo project ID
3. Test on physical devices
4. Verify push notification permissions flow
5. Test token cleanup on actual logout scenarios

## Maintenance

- Monitor database for token accumulation
- Adjust cleanup interval if needed (currently 24 hours)
- Adjust cleanup age threshold if needed (currently 30 days)
- Monitor push notification delivery rates
