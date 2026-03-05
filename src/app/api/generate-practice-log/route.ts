import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { coachContent, bestShot, worstShot } = await request.json()

    if (!coachContent || !bestShot || !worstShot) {
      return NextResponse.json(
        { error: '缺少必需字段' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    const prompt = `你是一位网球学长 Homie。用户刚刚完成一次练习，教练教的内容是：${coachContent}，今天打得最好的一球是：${bestShot}，最差的一球是：${worstShot}。请生成：
- 一段陪练日志（总结练习，给予鼓励，语气像朋友，不超过100字）
- 一句下次练习提醒（温柔提醒，不超过50字）

请以 JSON 格式输出：{ "aiCompanionLog": "...", "nextReminder": "..." }`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个贴心的网球学长，回复简洁温暖。' },
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
    const content = data.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'AI 返回内容为空' },
        { status: 502 }
      )
    }

    let result
    try {
      result = JSON.parse(content)
    } catch {
      console.error('JSON 解析失败:', content)
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