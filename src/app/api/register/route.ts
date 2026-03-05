import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const {
      email,
      password,
      nickname,
      age,
      playing_years,
      message_to_homie
    } = body

    // 2. 验证必需字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '缺少必需字段：email 或 password' },
        { status: 400 }
      )
    }

    // 密码强度验证（至少6位）
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码至少需要6位字符' },
        { status: 400 }
      )
    }

    // 3. 创建 Supabase 客户端
    const supabase = createClient()

    // 4. 注册新用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 可以根据需要添加邮箱重定向
        // emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    })

    if (authError) {
      console.error('用户注册失败:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const user = authData.user
    if (!user) {
      return NextResponse.json(
        { error: '用户创建失败' },
        { status: 500 }
      )
    }

    // 5. 创建用户档案 (profile)
    const profileData: Database['public']['Tables']['profiles']['Insert'] & {
      nickname?: string | null
      age?: number | null
      message_to_homie?: string | null
      created_at: string
      updated_at: string
    } = {
      id: user.id,
      username: nickname || null, // 使用 username 字段存储昵称
      nickname: nickname || null,
      age: age ? parseInt(age, 10) : null,
      playing_years: playing_years || null,
      message_to_homie: message_to_homie || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)

    if (profileError) {
      console.error('创建用户档案失败:', profileError)
      // 如果档案创建失败，尝试使用最小化数据（仅必需字段）
      // 适应可能缺少某些列的旧表结构
      const fallbackProfileData: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        username: nickname || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 尝试添加可能存在的其他字段
      try {
        // 尝试插入简化数据
        const { error: fallbackError } = await supabase
          .from('profiles')
          .insert(fallbackProfileData)

        if (fallbackError) {
          console.error('回退档案创建也失败:', fallbackError)
          // 即使回退也失败，我们仍然允许注册，但记录错误
          // 用户可以在以后完善档案
        } else {
          console.log('回退档案创建成功')
        }
      } catch (fallbackErr) {
        console.error('回退档案创建异常:', fallbackErr)
      }

      // 注意：我们继续执行，不返回错误，因为用户已创建
      // 档案可以在以后修复
    }

    // 6. 返回成功响应
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profileData,
        session: authData.session,
        requiresEmailConfirmation: !authData.session,
        message: authData.session
          ? '注册成功，已自动登录'
          : '注册成功，请检查邮箱确认账号',
      }
    }, { status: 201 })

  } catch (error) {
    console.error('注册过程中出错:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        error: '注册失败',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// 可选：GET 方法用于健康检查
export async function GET() {
  return NextResponse.json({
    message: '用户注册 API 正常运行',
    endpoint: 'POST /api/register',
    requiredFields: ['email', 'password'],
    optionalFields: ['nickname', 'age', 'playing_years', 'message_to_homie'],
    note: '此端点用于创建新用户并保存个人资料'
  })
}