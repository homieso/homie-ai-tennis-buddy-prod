/**
 * 用户档案查询工具
 * 提供统一的用户数据访问接口，减少Supabase查询重复
 */

import { createClient } from '@/lib/supabase/server';
import { DB_TABLES, DEFAULT_NICKNAME, DEFAULT_UNKNOWN } from '@/lib/constants';
import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  nickname?: string | null;
  age_range?: string | null;
  playing_years_range?: string | null;
  user_preferences?: string[] | null;
  email_notifications?: boolean | null;
  last_email_sent?: string | null;
};

export type BasicProfileInfo = Pick<Profile,
  'id' | 'nickname' | 'age_range' | 'playing_years_range' | 'user_preferences'
>;

/**
 * 获取当前认证用户的基本档案信息
 * @returns 用户档案信息或null（如果未认证或查询失败）
 */
export async function getCurrentUserProfile(): Promise<BasicProfileInfo | null> {
  try {
    const supabase = createClient();

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('获取当前用户失败:', userError);
      return null;
    }

    // 查询用户档案
    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('id, nickname, age_range, playing_years_range, user_preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('查询用户档案失败:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('获取用户档案时出错:', error);
    return null;
  }
}

/**
 * 获取用户档案的完整信息
 * @param userId 用户ID（可选，默认为当前用户）
 * @returns 完整的用户档案信息或null
 */
export async function getUserProfile(userId?: string): Promise<Profile | null> {
  try {
    const supabase = createClient();

    let targetUserId = userId;

    // 如果未提供userId，获取当前用户
    if (!targetUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('获取当前用户失败:', userError);
        return null;
      }

      targetUserId = user.id;
    }

    // 查询完整用户档案
    const { data: profile, error: profileError } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileError) {
      console.error('查询用户档案失败:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('获取用户档案时出错:', error);
    return null;
  }
}

/**
 * 获取用于AI生成的用户个性化信息
 * @param userId 用户ID（可选，默认为当前用户）
 * @returns 标准化后的用户个性化信息
 */
export async function getUserPersonalizationInfo(userId?: string): Promise<{
  nickname: string;
  ageRange: string;
  playingYearsRange: string;
  userPreferences: string[];
}> {
  const profile = await getUserProfile(userId);

  return {
    nickname: profile?.nickname || DEFAULT_NICKNAME,
    ageRange: profile?.age_range || DEFAULT_UNKNOWN,
    playingYearsRange: profile?.playing_years_range || DEFAULT_UNKNOWN,
    userPreferences: Array.isArray(profile?.user_preferences) ? profile.user_preferences : [],
  };
}

/**
 * 获取同意接收邮件通知的用户列表
 * @param limit 限制返回的用户数量
 * @param adminClient 可选的Supabase管理员客户端（用于绕过RLS）
 * @returns 同意接收邮件的用户列表
 */
export async function getUsersWithEmailNotifications(
  limit: number = 100,
  adminClient?: SupabaseClient<Database>
): Promise<Profile[]> {
  try {
    const supabase = adminClient || createClient();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: profiles, error } = await supabase
      .from(DB_TABLES.PROFILES)
      .select('*')
      .eq('email_notifications', true)
      .or(`last_email_sent.is.null,last_email_sent.lt.${twentyFourHoursAgo}`)
      .limit(limit);

    if (error) {
      console.error('查询同意接收邮件的用户失败:', error);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('获取邮件通知用户时出错:', error);
    return [];
  }
}

/**
 * 更新用户最后邮件发送时间
 * @param userId 用户ID
 * @param timestamp 时间戳（可选，默认为当前时间）
 * @param adminClient 可选的Supabase管理员客户端（用于绕过RLS）
 * @returns 是否更新成功
 */
export async function updateUserLastEmailSent(
  userId: string,
  timestamp?: string,
  adminClient?: SupabaseClient<Database>
): Promise<boolean> {
  try {
    const supabase = adminClient || createClient();

    const { error } = await supabase
      .from(DB_TABLES.PROFILES)
      .update({ last_email_sent: timestamp || new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error(`更新用户 ${userId} 的最后邮件发送时间失败:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新最后邮件发送时间时出错:', error);
    return false;
  }
}

/**
 * 检查用户今天是否有练习记录
 * @param userId 用户ID
 * @returns 是否有今天的练习记录
 */
export async function hasUserPracticedToday(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from(DB_TABLES.PRACTICE_LOGS)
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .limit(1);

    return !!(logs && logs.length > 0);
  } catch (error) {
    console.error('检查用户练习记录时出错:', error);
    return false;
  }
}

/**
 * 更新用户档案
 * @param userId 用户ID
 * @param updates 要更新的字段
 * @returns 是否更新成功
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from(DB_TABLES.PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error(`更新用户 ${userId} 档案失败:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新用户档案时出错:', error);
    return false;
  }
}