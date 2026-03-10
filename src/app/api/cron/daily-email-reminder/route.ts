import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 验证Cron Job请求（Vercel Cron Jobs会添加Authorization头）
function verifyCronRequest(request: NextRequest): boolean {
  // 从环境变量获取Cron Secret
  const expectedSecret = process.env.CRON_SECRET
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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
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

    // 获取用户的邮箱地址
    const users = []
    for (const profile of profiles) {
      try {
        // 通过admin API获取用户邮箱
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

        if (authError) {
          console.error(`获取用户 ${profile.id} 的邮箱失败:`, authError)
          continue // 跳过这个用户
        }

        if (authData && authData.user && authData.user.email) {
          users.push({
            id: profile.id,
            email: authData.user.email,
            nickname: profile.nickname,
            age_range: profile.age_range,
            playing_years_range: profile.playing_years_range,
            user_preferences: profile.user_preferences,
            last_email_sent: profile.last_email_sent
          })
        }
      } catch (error) {
        console.error(`处理用户 ${profile.id} 时出错:`, error)
      }
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

    // 2. 为每个用户生成个性化鼓励语并发送邮件
    const results = []
    let successCount = 0
    let failCount = 0

    for (const user of users) {
      try {
        console.log(`处理用户: ${user.email} (${user.nickname})`)

        // 生成个性化鼓励语
        const encouragementMessage = await generatePersonalizedEncouragement(user)

        // 发送邮件
        const emailResult = await sendDailyEmail({
          to: user.email,
          nickname: user.nickname,
          message: encouragementMessage,
          userId: user.id
        })

        // 更新last_email_sent字段
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ last_email_sent: new Date().toISOString() })
          .eq('id', user.id)

        if (updateError) {
          console.error(`更新用户 ${user.id} 的last_email_sent失败:`, updateError)
          // 继续处理，不视为失败
        }

        results.push({
          userId: user.id,
          email: user.email,
          status: 'success',
          emailResult
        })
        successCount++

      } catch (error) {
        console.error(`处理用户 ${user.email} 失败:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
        failCount++
      }
    }

    // 3. 返回执行结果
    return NextResponse.json({
      success: true,
      message: `每日邮件提醒任务执行完成。成功: ${successCount}, 失败: ${failCount}`,
      total_users: users.length,
      success_count: successCount,
      fail_count: failCount,
      results,
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

async function generatePersonalizedEncouragement(user: UserInfo): Promise<string> {
  try {
    // 这里可以调用DeepSeek API生成个性化鼓励语
    // 为了简化，我们先使用模板

    const nickname = typeof user.nickname === 'string' ? user.nickname : '球友'
    const age_range = typeof user.age_range === 'string' ? user.age_range : undefined
    const playing_years_range = typeof user.playing_years_range === 'string' ? user.playing_years_range : undefined
    const user_preferences = Array.isArray(user.user_preferences) ? user.user_preferences as string[] : []

    // 基础鼓励语
    let baseMessage = `嘿${nickname}！今天也是努力练球的一天！💪`

    // 根据年龄段个性化
    if (age_range === '18岁以下') {
      baseMessage += ' 年轻就是资本，多练习会有很大进步！'
    } else if (age_range === '18-25岁') {
      baseMessage += ' 大学时期是提升球技的黄金时间，好好把握！'
    } else if (age_range === '25-35岁') {
      baseMessage += ' 工作之余打打球，既能锻炼身体又能放松心情！'
    } else if (age_range === '35岁以上') {
      baseMessage += ' 年龄不是问题，享受网球带来的乐趣最重要！'
    }

    // 根据球龄段个性化
    if (playing_years_range === '0-1年') {
      baseMessage += ' 刚开始打网球？坚持就是胜利，每天进步一点点！'
    } else if (playing_years_range === '1-3年') {
      baseMessage += ' 已经有些基础了，继续巩固技术，你会越来越强！'
    } else if (playing_years_range === '3-5年') {
      baseMessage += ' 三年以上的球龄，已经是资深球友了，保持热情！'
    } else if (playing_years_range === '5年以上') {
      baseMessage += ' 五年以上的老手了，网球已经成为生活的一部分了吧！'
    }

    // 根据用户偏好
    if (user_preferences && user_preferences.length > 0) {
      if (user_preferences.includes('在我受挫时给我打气')) {
        baseMessage += ' 记得，每次挫折都是进步的机会，加油！'
      }
      if (user_preferences.includes('提醒我坚持练球')) {
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
    const fallbackNickname = typeof user.nickname === 'string' ? user.nickname : '球友'
    return `嘿${fallbackNickname}！今天是打网球的好天气，别忘了去球场挥洒汗水！🎾\n\n—— 你的AI网球搭子`
  }
}

// 发送每日邮件
async function sendDailyEmail({
  to,
  nickname,
  message,
  userId
}: {
  to: string
  nickname: string
  message: string
  userId: string
}) {
  // 构建邮件内容
  const subject = `🎾 你的每日网球鼓励：${nickname}，今天也要加油！`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>每日网球鼓励</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
      border: 1px solid #eee;
      border-top: none;
    }
    .message {
      font-size: 18px;
      white-space: pre-line;
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .tennis-icon {
      font-size: 24px;
      margin: 0 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎾 你的AI网球搭子</h1>
    <p>每日鼓励 · 陪伴成长</p>
  </div>

  <div class="content">
    <h2>亲爱的 ${nickname}，</h2>

    <div class="message">
      ${message.replace(/\n/g, '<br>')}
    </div>

    <p>今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！</p>

    <div class="footer">
      <p>💡 提示：你可以在设置中调整邮件通知频率</p>
      <p>🎾 坚持练球，享受网球带来的快乐！</p>
      <p>— 你的AI网球搭子团队</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `${nickname}，你好！\n\n${message}\n\n今天是打网球的好天气，别忘了去球场挥洒汗水！\n\n—— 你的AI网球搭子 🎾`

  // 调用邮件发送API
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      text,
      userId,
      emailType: 'daily-reminder'
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`发送邮件失败: ${response.status} ${JSON.stringify(errorData)}`)
  }

  return await response.json()
}