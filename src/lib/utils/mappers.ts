/**
 * 值映射工具
 * 用于在UI值、API值和数据库值之间进行转换
 */

import {
  AGE_RANGES,
  PLAYING_YEARS_RANGES,
  USER_PREFERENCES
} from '@/lib/constants';

// UI值到数据库值的映射
export const UI_TO_DB_MAP = {
  // 年龄范围映射
  age: {
    'under-18': AGE_RANGES.UNDER_18,
    '18-25': AGE_RANGES.AGE_18_25,
    '26-35': AGE_RANGES.AGE_26_35,
    '36-plus': AGE_RANGES.AGE_36_PLUS,
    'prefer-not-to-say': AGE_RANGES.PREFER_NOT_TO_SAY,
  },
  // 球龄范围映射
  playingYears: {
    'beginner': '刚开始', // 临时映射，需要与现有数据保持一致
    '1-3-months': '1-3个月',
    '3-6-months': '3-6个月',
    '6-12-months': '6个月-1年',
    '1-plus-years': '1年以上',
    'prefer-not-to-say': '不愿透露',
  },
  // 球龄范围映射到标准化值（用于与AI生成逻辑保持一致）
  playingYearsToStandard: {
    '刚开始': PLAYING_YEARS_RANGES.ZERO_TO_ONE,
    '1-3个月': PLAYING_YEARS_RANGES.ONE_TO_THREE,
    '3-6个月': PLAYING_YEARS_RANGES.ONE_TO_THREE, // 近似映射
    '6个月-1年': PLAYING_YEARS_RANGES.ZERO_TO_ONE,
    '1年以上': PLAYING_YEARS_RANGES.ONE_TO_THREE, // 近似映射
    '不愿透露': '不愿透露',
  }
} as const;

// 数据库值到UI值的映射
export const DB_TO_UI_MAP = {
  // 年龄范围反向映射
  age: Object.fromEntries(
    Object.entries(UI_TO_DB_MAP.age).map(([ui, db]) => [db, ui])
  ),
  // 球龄范围反向映射
  playingYears: Object.fromEntries(
    Object.entries(UI_TO_DB_MAP.playingYears).map(([ui, db]) => [db, ui])
  ),
} as const;

// 标准化球龄范围（用于AI生成逻辑）
export const STANDARD_PLAYING_YEARS_MAP = {
  '刚开始': PLAYING_YEARS_RANGES.ZERO_TO_ONE,
  '1-3个月': PLAYING_YEARS_RANGES.ONE_TO_THREE,
  '3-6个月': PLAYING_YEARS_RANGES.ONE_TO_THREE,
  '6个月-1年': PLAYING_YEARS_RANGES.ZERO_TO_ONE,
  '1年以上': PLAYING_YEARS_RANGES.FIVE_PLUS, // 保守估计为5年以上
  '不愿透露': '不愿透露',
} as const;

/**
 * 将UI年龄值转换为数据库值
 */
export function mapAgeToDb(uiValue: string): string {
  return UI_TO_DB_MAP.age[uiValue as keyof typeof UI_TO_DB_MAP.age] || uiValue;
}

/**
 * 将数据库年龄值转换为UI值
 */
export function mapAgeToUi(dbValue: string): string {
  return DB_TO_UI_MAP.age[dbValue] || dbValue;
}

/**
 * 将UI球龄值转换为数据库值
 */
export function mapPlayingYearsToDb(uiValue: string): string {
  return UI_TO_DB_MAP.playingYears[uiValue as keyof typeof UI_TO_DB_MAP.playingYears] || uiValue;
}

/**
 * 将数据库球龄值转换为UI值
 */
export function mapPlayingYearsToUi(dbValue: string): string {
  return DB_TO_UI_MAP.playingYears[dbValue] || dbValue;
}

/**
 * 标准化球龄范围（用于AI生成逻辑）
 */
export function standardizePlayingYears(value: string): string {
  if (value in STANDARD_PLAYING_YEARS_MAP) {
    return STANDARD_PLAYING_YEARS_MAP[value as keyof typeof STANDARD_PLAYING_YEARS_MAP];
  }

  // 如果已经是标准值，直接返回
  const standardValues = Object.values(PLAYING_YEARS_RANGES);
  if (standardValues.includes(value as typeof standardValues[number])) {
    return value;
  }

  // 默认映射
  if (value.includes('0') || value.includes('刚开始') || value.includes('新手')) {
    return PLAYING_YEARS_RANGES.ZERO_TO_ONE;
  } else if (value.includes('1') || value.includes('一年') || value.includes('初级')) {
    return PLAYING_YEARS_RANGES.ONE_TO_THREE;
  } else if (value.includes('3') || value.includes('三年') || value.includes('中级')) {
    return PLAYING_YEARS_RANGES.THREE_TO_FIVE;
  } else if (value.includes('5') || value.includes('五年') || value.includes('高级')) {
    return PLAYING_YEARS_RANGES.FIVE_PLUS;
  }

  return PLAYING_YEARS_RANGES.ZERO_TO_ONE;
}

/**
 * 标准化年龄范围（用于AI生成逻辑）
 */
export function standardizeAgeRange(value: string): string {
  if (value.includes('18岁以下') || value.includes('under') || value.includes('18以下')) {
    return AGE_RANGES.UNDER_18;
  } else if (value.includes('18-25') || value.includes('18到25')) {
    return AGE_RANGES.AGE_18_25;
  } else if (value.includes('26-35') || value.includes('26到35') || value.includes('25-35')) {
    return AGE_RANGES.AGE_26_35;
  } else if (value.includes('36') || value.includes('35以上') || value.includes('36以上')) {
    return AGE_RANGES.AGE_36_PLUS;
  }

  return value;
}

/**
 * 标准化用户偏好（用于AI生成逻辑）
 */
export function standardizeUserPreferences(preferences: string[]): string[] {
  const standardized: string[] = [];

  for (const pref of preferences) {
    let matched = false;

    // 检查是否匹配已知偏好
    for (const preferenceValue of Object.values(USER_PREFERENCES)) {
      if (pref.includes(preferenceValue) || preferenceValue.includes(pref)) {
        standardized.push(preferenceValue);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // 如果是其他偏好，保留原值
      standardized.push(pref);
    }
  }

  return standardized;
}