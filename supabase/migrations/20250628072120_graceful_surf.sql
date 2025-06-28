/*
  # Notifications Schema

  1. New Tables
    - `notifications` - System notifications
    - `notification_recipients` - Notification delivery tracking
    
  2. Security
    - Enable RLS on all tables
    - Add policies for user access
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  priority integer DEFAULT 1,
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Notification recipients
CREATE TABLE IF NOT EXISTS notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(notification_id, recipient_id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can read notifications sent to them"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients nr
      WHERE nr.notification_id = id AND nr.recipient_id = auth.uid()
    )
  );

-- Notification recipients policies
CREATE POLICY "Users can read own notification status"
  ON notification_recipients FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notification status"
  ON notification_recipients FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage notification recipients"
  ON notification_recipients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );