/**
 * 应用程序常量定义
 */

// 年龄范围常量
export const AGE_RANGES = {
  UNDER_18: '18岁以下',
  AGE_18_25: '18-25岁',
  AGE_26_35: '26-35岁',
  AGE_36_PLUS: '36岁以上',
  PREFER_NOT_TO_SAY: '不愿透露',
} as const;

export type AgeRange = typeof AGE_RANGES[keyof typeof AGE_RANGES];

// 球龄范围常量
export const PLAYING_YEARS_RANGES = {
  ZERO_TO_ONE: '0-1年',
  ONE_TO_THREE: '1-3年',
  THREE_TO_FIVE: '3-5年',
  FIVE_PLUS: '5年以上',
  PREFER_NOT_TO_SAY: '不愿透露',
} as const;

export type PlayingYearsRange = typeof PLAYING_YEARS_RANGES[keyof typeof PLAYING_YEARS_RANGES];

// 用户偏好常量
export const USER_PREFERENCES = {
  REMIND_PRACTICE: '提醒练球',
  ANALYZE_VIDEO: '分析动作视频',
  FIND_PARTNERS: '约球友',
  ANSWER_QUESTIONS: '解答疑惑',
  ENCOURAGEMENT: '在我受挫时给我打气',
  OTHER: '其他',
} as const;

export type UserPreference = typeof USER_PREFERENCES[keyof typeof USER_PREFERENCES];

// 邮件类型常量
export const EMAIL_TYPES = {
  DAILY_REMINDER: 'daily-reminder',
  WELCOME: 'welcome',
  PRACTICE_REMINDER: 'practice-reminder',
  FEEDBACK: 'feedback',
} as const;

export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];

// 邮件服务常量
export const EMAIL_SERVICES = {
  RESEND: 'resend',
  SENDGRID: 'sendgrid',
} as const;

export type EmailService = typeof EMAIL_SERVICES[keyof typeof EMAIL_SERVICES];

// 数据库表名常量
export const DB_TABLES = {
  PROFILES: 'profiles',
  PRACTICE_LOGS: 'practice_logs',
  FEEDBACK: 'feedback',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

// 环境变量键名常量
export const ENV_KEYS = {
  NEXT_PUBLIC_SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_KEY',
  DEEPSEEK_API_KEY: 'DEEPSEEK_API_KEY',
  RESEND_API_KEY: 'RESEND_API_KEY',
  SENDGRID_API_KEY: 'SENDGRID_API_KEY',
  EMAIL_SERVICE: 'EMAIL_SERVICE',
  CRON_SECRET: 'CRON_SECRET',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  RESEND_FROM_EMAIL: 'RESEND_FROM_EMAIL',
} as const;

// API端点常量
export const API_ENDPOINTS = {
  SEND_EMAIL: '/api/send-email',
  GENERATE_GOAL: '/api/generate-goal',
  GENERATE_EMOTION_SUPPORT: '/api/generate-emotion-support',
  GENERATE_PRACTICE_LOG: '/api/generate-practice-log',
  DAILY_EMAIL_REMINDER: '/api/cron/daily-email-reminder',
  FEEDBACK: '/api/feedback',
  REGISTER: '/api/register',
} as const;

// 默认值常量
export const DEFAULTS = {
  UNKNOWN: '未知',
  USER_NICKNAME: '球友',
  FALLBACK_EMAIL: 'onboarding@resend.dev',
  EMAIL_FROM: 'Homie AI <onboarding@resend.dev>',
  MAX_USERS_PER_BATCH: 100,
  EMAIL_RETRY_ATTEMPTS: 3,
  EMAIL_RETRY_DELAY_MS: 1000,
} as const;

// 年龄范围选项（用于UI组件）
export const AGE_OPTIONS = [
  { value: AGE_RANGES.UNDER_18, label: AGE_RANGES.UNDER_18, emoji: '👶' },
  { value: AGE_RANGES.AGE_18_25, label: AGE_RANGES.AGE_18_25, emoji: '🎓' },
  { value: AGE_RANGES.AGE_26_35, label: AGE_RANGES.AGE_26_35, emoji: '💼' },
  { value: AGE_RANGES.AGE_36_PLUS, label: AGE_RANGES.AGE_36_PLUS, emoji: '👨‍💼' },
  { value: AGE_RANGES.PREFER_NOT_TO_SAY, label: AGE_RANGES.PREFER_NOT_TO_SAY, emoji: '🤐' },
] as const;

// 球龄范围选项（用于UI组件）
export const PLAYING_YEARS_OPTIONS = [
  { value: PLAYING_YEARS_RANGES.ZERO_TO_ONE, label: PLAYING_YEARS_RANGES.ZERO_TO_ONE, emoji: '🎾' },
  { value: PLAYING_YEARS_RANGES.ONE_TO_THREE, label: PLAYING_YEARS_RANGES.ONE_TO_THREE, emoji: '🏆' },
  { value: PLAYING_YEARS_RANGES.THREE_TO_FIVE, label: PLAYING_YEARS_RANGES.THREE_TO_FIVE, emoji: '🌟' },
  { value: PLAYING_YEARS_RANGES.FIVE_PLUS, label: PLAYING_YEARS_RANGES.FIVE_PLUS, emoji: '👑' },
  { value: PLAYING_YEARS_RANGES.PREFER_NOT_TO_SAY, label: PLAYING_YEARS_RANGES.PREFER_NOT_TO_SAY, emoji: '🤐' },
] as const;

// 用户偏好选项（用于UI组件）
export const USER_PREFERENCES_OPTIONS = [
  { value: USER_PREFERENCES.REMIND_PRACTICE, label: USER_PREFERENCES.REMIND_PRACTICE, emoji: '⏰' },
  { value: USER_PREFERENCES.ANALYZE_VIDEO, label: USER_PREFERENCES.ANALYZE_VIDEO, emoji: '📹' },
  { value: USER_PREFERENCES.FIND_PARTNERS, label: USER_PREFERENCES.FIND_PARTNERS, emoji: '🤝' },
  { value: USER_PREFERENCES.ANSWER_QUESTIONS, label: USER_PREFERENCES.ANSWER_QUESTIONS, emoji: '❓' },
  { value: USER_PREFERENCES.ENCOURAGEMENT, label: USER_PREFERENCES.ENCOURAGEMENT, emoji: '💪' },
  { value: USER_PREFERENCES.OTHER, label: USER_PREFERENCES.OTHER, emoji: '📝' },
] as const;

// 常用默认值的便捷导出
export const DEFAULT_NICKNAME = DEFAULTS.USER_NICKNAME;
export const DEFAULT_UNKNOWN = DEFAULTS.UNKNOWN;
export const DEFAULT_EMAIL_FROM = DEFAULTS.EMAIL_FROM;