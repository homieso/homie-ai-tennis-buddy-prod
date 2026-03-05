import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const { nextLessonTime, confusion } = body

    // 2. 验证必需字段
    if (!nextLessonTime || !confusion) {
      return NextResponse.json(
        { error: '缺少必需字段：nextLessonTime 或 confusion' },
        { status: 400 }
      )
    }

    // 3. 获取 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY 环境变量未设置')
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 4. 构建提示词
    const prompt = `你是一位网球学长 Homie，帮助初学者制定每周目标。用户的下次课程时间是 ${nextLessonTime}，本周困惑是 ${confusion}。请生成：
- 一个核心目标（具体、可执行）
- 两个微练习（简单易行，可以在家或球场练习）
- 一个情绪提醒（温柔鼓励的话）

请以 JSON 格式输出：{ "coreGoal": "...", "microExercises": ["...", "..."], "emotionReminder": "..." }`

    // 5. 调用 DeepSeek API
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
            content: '你是一位经验丰富的网球学长，擅长为初学者制定个性化的学习目标和练习计划。请始终以 JSON 格式回复。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
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

    // 6. 解析 AI 响应
    const aiResponse = data.choices?.[0]?.message?.content
    if (!aiResponse) {
      throw new Error('AI 响应格式无效')
    }

    let goalData
    try {
      goalData = JSON.parse(aiResponse)
    } catch {
      console.error('解析 AI 响应 JSON 失败:', aiResponse)
      // 尝试从文本中提取 JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          goalData = JSON.parse(jsonMatch[0])
        } catch {
          throw new Error('无法解析 AI 响应为 JSON')
        }
      } else {
        throw new Error('AI 响应不包含有效的 JSON')
      }
    }

    // 7. 验证响应结构
    if (!goalData.coreGoal || !Array.isArray(goalData.microExercises) || !goalData.emotionReminder) {
      console.warn('AI 响应结构不完整:', goalData)
      // 提供默认值或返回错误
      return NextResponse.json(
        {
          error: 'AI 响应结构不完整',
          received: goalData,
          fallback: {
            coreGoal: '专注于改善击球动作的连贯性',
            microExercises: ['每天对墙练习正手击球10分钟', '练习脚步移动，保持身体平衡'],
            emotionReminder: '进步是一步一步来的，今天比昨天好一点就是成功！'
          }
        },
        { status: 200 }
      )
    }

    // 8. 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        coreGoal: goalData.coreGoal,
        microExercises: goalData.microExercises.slice(0, 2), // 确保只有两个
        emotionReminder: goalData.emotionReminder
      }
    })

  } catch (error) {
    console.error('生成目标时出错:', error)

    // 返回友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        error: '生成目标失败',
        message: errorMessage,
        fallback: {
          coreGoal: '专注于改善击球动作的连贯性',
          microExercises: ['每天对墙练习正手击球10分钟', '练习脚步移动，保持身体平衡'],
          emotionReminder: '进步是一步一步来的，今天比昨天好一点就是成功！'
        }
      },
      { status: 500 }
    )
  }
}

// 可选：添加 GET 方法用于测试或健康检查
export async function GET() {
  return NextResponse.json({
    message: '网球目标生成 API 正常运行',
    endpoint: 'POST /api/generate-goal',
    requiredFields: ['nextLessonTime', 'confusion'],
    example: {
      nextLessonTime: '2024-03-10T14:00:00Z',
      confusion: '反手击球时总是打不准球'
    }
  })
}