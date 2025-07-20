# Admin Notifications Screen Documentation

## Overview

The `admin_notifications.tsx` screen provides a comprehensive interface for administrators to compose, send, and manage notifications within an academic system. It follows the design patterns established in the `exams.tsx` screen for consistency.

## Features

### 1. Notification Composer

- **Title**: Optional field for notification title
- **Message**: Required field for the notification body
- **Type Selection**: Choose from info, warning, success, or error types
- **Target Recipients**: Select who receives the notification
- **Link**: Optional deep link or internal screen path
- **Expiry Date**: Optional expiration date for the notification

### 2. Target Recipient Options

- **All Students**: Send to every student in the system
- **Specific Student**: Target a single student by selection
- **Course Students**: Send to all students enrolled in a specific course
- **Lecture Absentees**: Target students who were absent from a specific lecture
- **Exam Absentees**: Target students who were absent from a specific exam

### 3. Preview Functionality

- Real-time preview of how the notification will appear
- Toggle preview on/off using the eye icon in the header
- Shows the notification using the same `NotificationItem` component used in the student interface

### 4. Notification History

- View previously sent notifications
- Search through sent notifications
- See recipient counts for each notification
- Organized by date and type

## Usage

### Sending a Basic Notification

1. Navigate to the "Compose" tab
2. Enter a message (required)
3. Optionally add a title
4. Select notification type (info, warning, success, error)
5. Choose target recipients
6. Tap "Send Notification"

### Targeting Specific Groups

1. Tap the "Target Recipients" selector
2. Choose from the available options:
   - **All Students**: Immediate selection
   - **Specific Student**: Choose from student list
   - **Course Students**: Select a course
   - **Lecture/Exam Absentees**: Choose from recent batches
3. Confirm selection

### Using Preview

1. Toggle the preview button (eye icon) in the header
2. The preview will show below the form as you type
3. Preview updates in real-time

### Viewing History

1. Switch to the "History" tab
2. Use the search bar to find specific notifications
3. View recipient counts and dates

## Technical Implementation

### Database Integration

- Uses Supabase client for all database operations
- Inserts notifications into the `notifications` table
- Queries related tables for recipient targeting:
  - `profiles` for student information
  - `course_enrollments` for course-based targeting
  - `attendance` for lecture absentee targeting
  - `exam_attendances` for exam absentee targeting

### Styling Consistency

- Follows the same design patterns as `exams.tsx`
- Uses consistent color schemes and typography
- Maintains the same spacing and layout patterns
- Responsive design for different screen sizes

### Components

The screen is modularized with reusable components:

- `NotificationForm`: Form inputs and selectors
- `RecipientSelector`: Target selection modal
- `PreviewCard`: Notification preview functionality

### Error Handling

- Validates required fields before sending
- Shows appropriate error messages
- Handles network errors gracefully
- Provides user feedback on success/failure

## Future Enhancements

### Push Notifications

The system is designed to support push notifications through:

- Integration with `push_tokens` table
- Edge Function for sending push notifications
- Batch processing for large recipient lists

### Advanced Targeting

Potential future features:

- Filter by student year/semester
- Target by attendance patterns
- Schedule notifications for future delivery
- Template system for common notifications

### Analytics

Future analytics features could include:

- Notification open rates
- Click-through rates for links
- Delivery status tracking
- User engagement metrics

## Dependencies

- React Native with Expo
- Supabase for backend services
- Lucide React Native for icons
- React Native DateTimePicker for date selection
- Custom authentication context

## File Structure

```
app/(admin-tabs)/admin_notifications.tsx    # Main screen component
components/NotificationForm.tsx             # Form component
components/RecipientSelector.tsx            # Target selection component
components/PreviewCard.tsx                  # Preview component
components/NotificationItem.tsx             # Shared notification display
```

## Security Considerations

- Admin role verification required
- All database queries use row-level security
- Input validation and sanitization
- Proper error handling to prevent data exposure
