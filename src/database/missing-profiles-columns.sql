-- Add missing columns to profiles table for email reminders and user preferences
-- This migration should be executed via Supabase SQL Editor or using the service role key

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range text;
COMMENT ON COLUMN public.profiles.age_range IS '用户年龄范围（如"20-30岁"）';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS playing_years_range text;
COMMENT ON COLUMN public.profiles.playing_years_range IS '用户球龄范围（如"1-3年"）';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_preferences text[] DEFAULT '{}';
COMMENT ON COLUMN public.profiles.user_preferences IS '用户偏好标签数组（如["底线型","喜欢单打"]）';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;
COMMENT ON COLUMN public.profiles.email_notifications IS '是否启用邮件提醒';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_email_sent timestamptz;
COMMENT ON COLUMN public.profiles.last_email_sent IS '最后发送邮件的时间';