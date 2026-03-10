import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { difficulty } = body

    // 4. 验证必需字段
    if (!difficulty) {
      return NextResponse.json(
        { error: '缺少必需字段：difficulty' },
        { status: 400 }
      )
    }

    // 5. 获取 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY 环境变量未设置')
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 6. 构建个性化提示词
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

    const prompt = `你是一位网球学长 Homie。${nickname}遇到网球困难：${difficulty}。${personalization}请用三步法给予支持：
      1. 承认困难（共情，承认这是正常的，考虑用户的年龄和球龄阶段）
      2. 重构认知（换个角度看问题，适应用户的偏好）
      3. 降低门槛（提供一个简单的替代练习，适应用户的水平和偏好）

      以 JSON 格式返回：{ "acknowledge": "...", "reframe": "...", "lowerBar": "..." }`

    // 7. 调用 DeepSeek API
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
            content: `你是一位温暖、阳光的网球学长 Homie。用户遇到了网球学习中的困难，请用朋友般的语气，根据用户的个性化信息（年龄、球龄、偏好）提供支持：
1. 承认困难（共情，认可这是正常的，并分享一点自己的经验或感受，考虑用户的年龄和球龄）
2. 重构认知（用积极的角度看待问题，鼓励用户，适应用户的偏好）
3. 降低门槛（提供一个非常简单、可立即尝试的练习或建议，适应用户的水平和偏好）
请用自然的对话语言，避免生硬的列表。输出 JSON 格式：{ "acknowledge": "...", "reframe": "...", "lowerBar": "..." }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('DeepSeek API 错误:', response.status, errorData)
      return NextResponse.json(
        { error: 'AI 服务暂时不可用', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()

    // 8. 解析 AI 响应
    const aiResponse = data.choices?.[0]?.message?.content
    if (!aiResponse) {
      throw new Error('AI 响应格式无效')
    }

    let supportData
    try {
      supportData = JSON.parse(aiResponse)
    } catch {
      console.error('解析 AI 响应 JSON 失败:', aiResponse)
      // 尝试从文本中提取 JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          supportData = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error('无法解析 AI 响应为 JSON')
        }
      } else {
        throw new Error('AI 响应不包含有效的 JSON')
      }
    }

    // 9. 验证响应结构
    if (!supportData.acknowledge || !supportData.reframe || !supportData.lowerBar) {
      console.warn('AI 响应结构不完整:', supportData)
      // 提供默认值
      return NextResponse.json(
        {
          success: true,
          data: {
            acknowledge: '网球学习过程中遇到困难是非常正常的，每个球员都会经历这个阶段。',
            reframe: '这其实是你技术提升的一个信号，说明你的身体正在学习新的动作模式。',
            lowerBar: '试试简化练习：今天只练习原地击球，不用移动脚步，专注于击球的基本动作。'
          }
        },
        { status: 200 }
      )
    }

    // 10. 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        acknowledge: supportData.acknowledge,
        reframe: supportData.reframe,
        lowerBar: supportData.lowerBar
      }
    })

  } catch (error) {
    console.error('生成情绪支持时出错:', error)

    // 返回友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        error: '生成情绪支持失败',
        message: errorMessage,
        fallback: {
          acknowledge: '网球学习过程中遇到困难是非常正常的，每个球员都会经历这个阶段。',
          reframe: '这其实是你技术提升的一个信号，说明你的身体正在学习新的动作模式。',
          lowerBar: '试试简化练习：今天只练习原地击球，不用移动脚步，专注于击球的基本动作。'
        }
      },
      { status: 500 }
    )
  }
}

// 可选：添加 GET 方法用于测试或健康检查
export async function GET() {
  return NextResponse.json({
    message: '情绪支持生成 API 正常运行',
    endpoint: 'POST /api/generate-emotion-support',
    requiredFields: ['difficulty'],
    example: {
      difficulty: '反手总是下网',
      expectedResponse: {
        success: true,
        data: {
          acknowledge: '...',
          reframe: '...',
          lowerBar: '...'
        }
      }
    }
  })
}