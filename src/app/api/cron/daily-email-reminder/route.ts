import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'
import {
  AGE_RANGES,
  PLAYING_YEARS_RANGES,
  USER_PREFERENCES,
  DEFAULT_NICKNAME,
  ENV_KEYS,
  DEFAULTS
} from '@/lib/constants'
import { EmailService } from '@/lib/email'

// 验证Cron Job请求（Vercel Cron Jobs会添加Authorization头）
function verifyCronRequest(request: NextRequest): boolean {
  // 从环境变量获取Cron Secret
  const expectedSecret = process.env[ENV_KEYS.CRON_SECRET]
  if (!expectedSecret) {
    // 如果没有设置CRON_SECRET，跳过验证（仅用于开发）
    console.warn('CRON_SECRET未设置，跳过请求验证')
    return true
  }

  // 检查Authorization头
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  try {
    // 验证请求
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        { error: '未授权的Cron Job请求' },
        { status: 401 }
      )
    }

    console.log('开始执行每日邮件提醒任务...')

    // 创建Supabase管理员客户端（绕过RLS）
    const supabaseAdmin = createSupabaseClient(
      process.env[ENV_KEYS.NEXT_PUBLIC_SUPABASE_URL]!,
      process.env[ENV_KEYS.SUPABASE_SERVICE_KEY]!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. 查询需要发送邮件的用户
    // 条件：email_notifications = true，且last_email_sent为null或超过24小时
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 首先查询需要发送邮件的用户profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        nickname,
        age_range,
        playing_years_range,
        user_preferences,
        last_email_sent
      `)
      .eq('email_notifications', true)
      .or(`last_email_sent.is.null,last_email_sent.lt.${twentyFourHoursAgo}`)
      .limit(100) // 每次最多处理100个用户，防止超时

    if (profilesError) {
      console.error('查询用户profiles失败:', profilesError)
      throw new Error(`查询用户profiles失败: ${profilesError.message}`)
    }

    console.log(`找到 ${profiles?.length || 0} 个需要发送邮件的用户档案`)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要发送邮件的用户',
        users_processed: 0,
        timestamp: new Date().toISOString()
      })
    }

    // 批量获取用户邮箱地址 - 解决N+1查询问题
    const users = []
    try {
      // 使用listUsers批量获取用户信息
      const userIds = profiles.map(p => p.id)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: userIds.length
      })

      if (authError) {
        console.error('批量获取用户邮箱失败:', authError)
        // 降级为逐个查询
        console.warn('降级为逐个查询用户邮箱...')
        for (const profile of profiles) {
          try {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
            if (!userError && userData?.user?.email) {
              users.push({
                id: profile.id,
                email: userData.user.email,
                nickname: profile.nickname,
                age_range: profile.age_range,
                playing_years_range: profile.playing_years_range,
                user_preferences: profile.user_preferences,
                last_email_sent: profile.last_email_sent
              })
            }
          } catch (error) {
            console.error(`获取用户 ${profile.id} 邮箱失败:`, error)
          }
        }
      } else {
        // 批量处理成功，创建用户ID到邮箱的映射
        const emailMap = new Map<string, string>()
        authData?.users?.forEach(user => {
          if (user.email && user.id) {
            emailMap.set(user.id, user.email)
          }
        })

        // 构建users数组
        for (const profile of profiles) {
          const email = emailMap.get(profile.id)
          if (email) {
            users.push({
              id: profile.id,
              email,
              nickname: profile.nickname,
              age_range: profile.age_range,
              playing_years_range: profile.playing_years_range,
              user_preferences: profile.user_preferences,
              last_email_sent: profile.last_email_sent
            })
          } else {
            console.warn(`用户 ${profile.id} 没有邮箱地址，跳过`)
          }
        }
      }
    } catch (error) {
      console.error('获取用户邮箱地址时出错:', error)
    }

    console.log(`成功获取 ${users.length} 个用户的邮箱地址`)

    console.log(`找到 ${users?.length || 0} 个需要发送邮件的用户`)

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要发送邮件的用户',
        users_processed: 0,
        timestamp: new Date().toISOString()
      })
    }

    // 2. 并行处理邮件发送
    console.log(`开始并行处理 ${users.length} 个用户的邮件发送...`)

    // 创建处理任务数组
    const processTasks = users.map(user => processUser(user, supabaseAdmin))

    // 并行执行所有任务
    const results = await Promise.allSettled(processTasks)

    // 处理结果
    const processedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // 理论上不会发生，因为processUser已经处理了错误
        return {
          userId: 'unknown',
          email: 'unknown',
          status: 'error' as const,
          error: result.reason?.message || '未知错误'
        }
      }
    })

    const successCount = processedResults.filter(r => r.status === 'success').length
    const failCount = processedResults.filter(r => r.status === 'error').length

    // 3. 返回执行结果
    return NextResponse.json({
      success: true,
      message: `每日邮件提醒任务执行完成。成功: ${successCount}, 失败: ${failCount}`,
      total_users: users.length,
      success_count: successCount,
      fail_count: failCount,
      results: processedResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('每日邮件提醒任务执行失败:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json({
      success: false,
      error: '任务执行失败',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 生成个性化鼓励语
interface UserInfo {
  nickname?: unknown;
  age_range?: unknown;
  playing_years_range?: unknown;
  user_preferences?: unknown;
}

// 可处理用户类型
interface ProcessableUser {
  id: string;
  email: string;
  nickname?: string | null;
  age_range?: string | null;
  playing_years_range?: string | null;
  user_preferences?: string[] | null;
  last_email_sent?: string | null;
}

async function generatePersonalizedEncouragement(user: UserInfo): Promise<string> {
  try {
    // 这里可以调用DeepSeek API生成个性化鼓励语
    // 为了简化，我们先使用模板

    const nickname = typeof user.nickname === 'string' ? user.nickname : DEFAULT_NICKNAME
    const age_range = typeof user.age_range === 'string' ? user.age_range : undefined
    const playing_years_range = typeof user.playing_years_range === 'string' ? user.playing_years_range : undefined
    const user_preferences = Array.isArray(user.user_preferences) ? user.user_preferences as string[] : []

    // 基础鼓励语
    let baseMessage = `嘿${nickname}！今天也是努力练球的一天！💪`

    // 根据年龄段个性化
    if (age_range === AGE_RANGES.UNDER_18) {
      baseMessage += ' 年轻就是资本，多练习会有很大进步！'
    } else if (age_range === AGE_RANGES.AGE_18_25) {
      baseMessage += ' 大学时期是提升球技的黄金时间，好好把握！'
    } else if (age_range === AGE_RANGES.AGE_26_35) {
      baseMessage += ' 工作之余打打球，既能锻炼身体又能放松心情！'
    } else if (age_range === AGE_RANGES.AGE_36_PLUS) {
      baseMessage += ' 年龄不是问题，享受网球带来的乐趣最重要！'
    }

    // 根据球龄段个性化
    if (playing_years_range === PLAYING_YEARS_RANGES.ZERO_TO_ONE) {
      baseMessage += ' 刚开始打网球？坚持就是胜利，每天进步一点点！'
    } else if (playing_years_range === PLAYING_YEARS_RANGES.ONE_TO_THREE) {
      baseMessage += ' 已经有些基础了，继续巩固技术，你会越来越强！'
    } else if (playing_years_range === PLAYING_YEARS_RANGES.THREE_TO_FIVE) {
      baseMessage += ' 三年以上的球龄，已经是资深球友了，保持热情！'
    } else if (playing_years_range === PLAYING_YEARS_RANGES.FIVE_PLUS) {
      baseMessage += ' 五年以上的老手了，网球已经成为生活的一部分了吧！'
    }

    // 根据用户偏好
    if (user_preferences && user_preferences.length > 0) {
      if (user_preferences.includes(USER_PREFERENCES.ENCOURAGEMENT)) {
        baseMessage += ' 记得，每次挫折都是进步的机会，加油！'
      }
      if (user_preferences.includes(USER_PREFERENCES.REMIND_PRACTICE)) {
        baseMessage += ' 今天的练习计划完成了吗？不要偷懒哦！'
      }
    }

    baseMessage += '\n\n—— 你的AI网球搭子 🎾'

    return baseMessage

    // 如果将来要使用DeepSeek API：
    // const deepseekResponse = await fetch('https://api.deepseek.com/...', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    //   body: JSON.stringify({
    //     prompt: `为网球用户${nickname}生成每日鼓励语...`,
    //     max_tokens: 150
    //   })
    // })
    // ...

  } catch (error) {
    console.error('生成鼓励语失败，使用默认消息:', error)
    const fallbackNickname = typeof user.nickname === 'string' ? user.nickname : DEFAULT_NICKNAME
    return `嘿${fallbackNickname}！今天是打网球的好天气，别忘了去球场挥洒汗水！🎾\n\n—— 你的AI网球搭子`
  }
}

// 处理单个用户邮件
async function processUser(user: ProcessableUser, supabaseAdmin: SupabaseClient<Database>) {
  try {
    console.log(`处理用户: ${user.email} (${user.nickname})`)

    // 生成个性化鼓励语
    const encouragementMessage = await generatePersonalizedEncouragement(user)

    // 发送邮件（带重试）
    const emailResult = await sendEmailWithRetry(
      user.email,
      user.nickname || DEFAULT_NICKNAME,
      encouragementMessage,
      user.id
    )

    // 更新last_email_sent字段
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ last_email_sent: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      console.error(`更新用户 ${user.id} 的last_email_sent失败:`, updateError)
      // 继续处理，不视为失败
    }

    return {
      userId: user.id,
      email: user.email,
      status: 'success' as const,
      emailResult
    }
  } catch (error) {
    console.error(`处理用户 ${user.email} 失败:`, error)
    return {
      userId: user.id,
      email: user.email,
      status: 'error' as const,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// 带重试的邮件发送
import type { EmailResult } from '@/lib/email';

async function sendEmailWithRetry(
  to: string,
  nickname: string,
  message: string,
  userId: string,
  maxRetries: number = DEFAULTS.EMAIL_RETRY_ATTEMPTS
): Promise<EmailResult> {
  const emailService = EmailService.getInstance()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 使用邮件服务发送每日提醒
      return await emailService.sendDailyReminder(to, nickname, message, userId)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`邮件发送重试 ${attempt}/${maxRetries} 失败:`, lastError.message)

      if (attempt < maxRetries) {
        // 指数退避延迟
        const delay = Math.min(
          DEFAULTS.EMAIL_RETRY_DELAY_MS * Math.pow(2, attempt - 1),
          10000 // 最大10秒
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 如果重试都失败，返回错误结果
  return {
    success: false,
    error: `邮件发送失败，重试 ${maxRetries} 次后仍然失败: ${lastError?.message}`
  }
}

