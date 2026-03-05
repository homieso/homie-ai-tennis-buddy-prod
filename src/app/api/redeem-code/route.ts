import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const { activationCode } = body

    // 2. 验证必需字段
    if (!activationCode) {
      return NextResponse.json(
        { error: '缺少必需字段：activationCode' },
        { status: 400 }
      )
    }

    // 3. 获取当前用户
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('用户认证失败:', authError)
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 4. 查询激活码
    const { data: codeData, error: codeError } = await supabase
      .from('activation_codes')
      .select('id, code, used_at, used_by')
      .eq('code', activationCode.trim())
      .single()

    if (codeError || !codeData) {
      return NextResponse.json(
        {
          success: false,
          error: '激活码无效',
          message: '激活码不存在'
        },
        { status: 404 }
      )
    }

    // 5. 检查激活码是否已使用
    if (codeData.used_at) {
      return NextResponse.json(
        {
          success: false,
          error: '激活码已使用',
          message: `此激活码已于 ${new Date(codeData.used_at).toLocaleDateString('zh-CN')} 被使用`
        },
        { status: 400 }
      )
    }

    // 6. 获取当前会员有效期
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('membership_valid_until')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('获取用户档案失败:', profileError)
      // 如果记录不存在，可能还未创建profile，这里可以创建或报错
      // 假设profile存在，如果不存在则返回错误
      return NextResponse.json(
        {
          success: false,
          error: '用户档案不存在',
          message: '请先完善个人信息'
        },
        { status: 400 }
      )
    }

    // 7. 计算新的有效期
    const currentValidUntil = profileData.membership_valid_until
    const now = new Date()
    const baseDate = currentValidUntil ? new Date(currentValidUntil) : now
    const newValidUntil = new Date(baseDate)
    newValidUntil.setMonth(newValidUntil.getMonth() + 1)

    // 8. 开始事务（通过顺序操作模拟事务）
    // 首先标记激活码为已使用
    const { error: updateCodeError } = await supabase
      .from('activation_codes')
      .update({
        used_at: now.toISOString(),
        used_by: user.id
      })
      .eq('id', codeData.id)

    if (updateCodeError) {
      console.error('更新激活码失败:', updateCodeError)
      return NextResponse.json(
        {
          success: false,
          error: '更新激活码失败',
          message: '请稍后重试'
        },
        { status: 500 }
      )
    }

    // 然后更新会员有效期
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        membership_valid_until: newValidUntil.toISOString()
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('更新会员有效期失败:', updateProfileError)
      // 尝试回滚激活码状态（可选）
      try {
        await supabase
          .from('activation_codes')
          .update({
            used_at: null,
            used_by: null
          })
          .eq('id', codeData.id)
      } catch (rollbackError) {
        console.error('回滚激活码状态失败:', rollbackError)
      }

      return NextResponse.json(
        {
          success: false,
          error: '更新会员信息失败',
          message: '请稍后重试'
        },
        { status: 500 }
      )
    }

    // 9. 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        message: '激活码兑换成功',
        membership_valid_until: newValidUntil.toISOString(),
        expires_in_days: Math.ceil((newValidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
    })

  } catch (error) {
    console.error('兑换激活码时出错:', error)

    // 返回友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        error: '兑换激活码失败',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// 可选：GET 方法用于健康检查
export async function GET() {
  return NextResponse.json({
    message: '激活码兑换 API 正常运行',
    endpoint: 'POST /api/redeem-code',
    requiredFields: ['activationCode'],
    note: '此端点用于兑换激活码以延长会员有效期'
  })
}