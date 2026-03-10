import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. 用户认证
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('用户未认证:', userError)
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 2. 获取用户个性化信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nickname, age_range, playing_years_range, user_preferences')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('获取用户资料失败:', profileError)
      // 继续执行，使用默认值
    }

    // 3. 解析请求体
    const { coachContent, bestShot, worstShot } = await request.json()

    if (!coachContent || !bestShot || !worstShot) {
      return NextResponse.json(
        { error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 4. 获取 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 5. 构建个性化提示词
    const nickname = profile?.nickname || '球友'
    const ageRange = profile?.age_range || '未知'
    const playingYearsRange = profile?.playing_years_range || '未知'
    const userPreferences = profile?.user_preferences || []

    // 构建个性化描述
    let personalization = ''
    if (ageRange !== '未知') {
      personalization += `用户年龄阶段：${ageRange}。`
    }
    if (playingYearsRange !== '未知') {
      personalization += `球龄阶段：${playingYearsRange}。`
    }
    if (userPreferences && userPreferences.length > 0) {
      personalization += `用户偏好：${userPreferences.join('、')}。`
    }

    const prompt = `你是一位网球学长 Homie。${nickname}刚刚完成一次练习，${personalization}教练教的内容是：${coachContent}，今天打得最好的一球是：${bestShot}，最差的一球是：${worstShot}。请生成：
- 一段陪练日志（总结练习，给予鼓励，语气像朋友，不超过100字，考虑用户的年龄、球龄和偏好）
- 一句下次练习提醒（温柔提醒，不超过50字，适应用户的偏好）

请以 JSON 格式输出：{ "aiCompanionLog": "...", "nextReminder": "..." }`

    // 6. 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个贴心的网球学长，能够根据用户的个性化信息（年龄、球龄、偏好）提供温暖、个性化的回复。回复要简洁温暖，适应用户的特点。'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('DeepSeek API 错误:', response.status, errorData)
      return NextResponse.json(
        { error: 'AI 服务暂时不可用' },
        { status: 502 }
      )
    }

    const data = await response.json()
    const contentText = data.choices[0]?.message?.content

    if (!contentText) {
      return NextResponse.json(
        { error: 'AI 返回内容为空' },
        { status: 502 }
      )
    }

    let result
    try {
      result = JSON.parse(contentText)
    } catch {
      console.error('JSON 解析失败:', contentText)
      return NextResponse.json(
        { error: 'AI 返回格式错误' },
        { status: 502 }
      )
    }

    if (!result.aiCompanionLog || !result.nextReminder) {
      return NextResponse.json(
        { error: 'AI 返回数据缺少必要字段' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        aiCompanionLog: result.aiCompanionLog,
        nextReminder: result.nextReminder
      }
    })
  } catch (error) {
    console.error('处理请求时出错:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '练习日志生成 API 正常运行',
    endpoint: 'POST /api/generate-practice-log',
    requiredFields: ['coachContent', 'bestShot', 'worstShot']
  })
}