'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { withAuth } from '@/lib/auth/auth'
import TennisCharacter from '@/components/TennisCharacter'
import LoadingScreen from '@/components/LoadingScreen'

type MembershipStatus = {
  is_member: boolean
  membership_valid_until: string | null
}

function SubscribePage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<MembershipStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activationCode, setActivationCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  // 获取会员状态
  useEffect(() => {
    let isMounted = true
    if (!user) return

    const fetchMembershipStatus = async () => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('membership_valid_until')
          .eq('id', user.id)
          .single()

        if (!isMounted) return

        if (error) {
          console.error('获取会员状态失败:', error)
          // 如果字段不存在，默认为非会员
          setStatus({ is_member: false, membership_valid_until: null })
        } else {
          const isValid = data.membership_valid_until &&
            new Date(data.membership_valid_until) > new Date()
          setStatus({
            is_member: isValid,
            membership_valid_until: data.membership_valid_until
          })
        }
      } catch (err) {
        console.error('获取会员状态异常:', err)
        if (isMounted) {
          setStatus({ is_member: false, membership_valid_until: null })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMembershipStatus()

    return () => {
      isMounted = false
    }
  }, [user])

  // 使用 Stripe 订阅
  const handleStripeSubscribe = async () => {
    if (!user) return

    setStripeLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('创建支付会话失败')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('未收到支付链接')
      }
    } catch (error) {
      console.error('订阅失败:', error)
      alert('订阅失败，请稍后重试')
    } finally {
      setStripeLoading(false)
    }
  }

  // 兑换激活码
  const handleRedeemCode = async () => {
    if (!activationCode.trim()) {
      setRedeemError('请输入激活码')
      return
    }

    setRedeemLoading(true)
    setRedeemError(null)
    setRedeemSuccess(false)

    try {
      const response = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activationCode: activationCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '兑换失败')
      }

      if (data.success) {
        setRedeemSuccess(true)
        setActivationCode('')
        // 刷新会员状态
        window.location.reload()
      } else {
        throw new Error(data.message || '兑换失败')
      }
    } catch (error) {
      setRedeemError(error instanceof Error ? error.message : '兑换失败')
    } finally {
      setRedeemLoading(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="加载中..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <TennisCharacter status="celebrate" displayText="解锁更多Homie的陪伴，让网球学习更高效！" dialogPosition="right" flipHorizontal={true} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">升级你的网球体验</h2>
              <p className="text-gray-600">解锁完整功能，获得更好的网球学习陪伴</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
            >
              <span className="mr-2">←</span>
              回到 Homie 身边
            </Link>
          </div>
        </div>

        {/* 当前会员状态 */}
        {status && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🎯</span> 当前状态
            </h2>
            {status.is_member ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">⭐</div>
                  <div>
                    <p className="font-bold text-xl mb-1">您已是尊贵会员</p>
                    <p className="opacity-90">
                      会员有效期至：{status.membership_valid_until ?
                        new Date(status.membership_valid_until).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) :
                        '永久'}
                    </p>
                    <p className="text-sm opacity-80 mt-2">感谢您的支持，Homie 会一直陪伴您！</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-white">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">🔓</div>
                  <div>
                    <p className="font-bold text-xl mb-1">解锁更多陪伴</p>
                    <p className="opacity-90">订阅后可以享受 Homie 的完整功能，让网球学习更高效！</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 非会员才显示订阅选项 */}
        {status && !status.is_member && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* 国际版 - Stripe */}
              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                <div className="mb-8">
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-full mb-6">
                    国际版
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">Stripe 订阅</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold text-gray-800">$5</span>
                    <span className="text-gray-600 text-xl ml-2">/月</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">完整AI分析功能</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">个性化训练计划</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">无限练习记录</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">订阅会员解锁专属功能</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleStripeSubscribe}
                  disabled={stripeLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stripeLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      处理中...
                    </span>
                  ) : (
                    '💳 使用 Stripe 订阅'
                  )}
                </button>
                <p className="text-gray-500 text-sm mt-4 text-center">
                  支持 Visa, Mastercard, American Express
                </p>
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm">
                    测试版提示：Stripe 支付为沙盒模式，支付无效。但你的反馈对我们至关重要！
                    每月5美元即可解锁更多Homie陪伴，你是否愿意支持？
                    如有任何想法，欢迎通过首页的&quot;意见反馈&quot;按钮告诉我们。
                  </p>
                </div>
              </div>

              {/* 国内版 - 激活码 */}
              <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                <div className="mb-8">
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-bold rounded-full mb-6">
                    国内版
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">激活码兑换</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-5xl font-bold text-gray-800">¥35</span>
                    <span className="text-gray-600 text-xl ml-2">/月</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">完整AI分析功能</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">个性化训练计划</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">无限练习记录</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">微信/支付宝支持</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full flex items-center justify-center mr-3">✓</div>
                      <span className="text-gray-700 font-medium">激活码兑换会员特权</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">🔑</span> 激活码
                    </label>
                    <input
                      type="text"
                      id="activationCode"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value)}
                      placeholder="请输入激活码"
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-lg text-gray-900"
                    />
                  </div>

                  {redeemError && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-medium">❌ {redeemError}</p>
                    </div>
                  )}

                  {redeemSuccess && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-green-700 font-medium">✅ 兑换成功！会员状态已更新。</p>
                    </div>
                  )}

                  <button
                    onClick={handleRedeemCode}
                    disabled={redeemLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-4 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeemLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        兑换中...
                      </span>
                    ) : (
                      '🎁 兑换激活码'
                    )}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-600">
                    <span className="font-medium">如何获取激活码？</span> 请联系客服或通过官方渠道购买。
                  </p>
                </div>
              </div>
            </div>

            {/* 功能对比 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
                <span className="mr-3">📊</span> 会员功能对比
              </h3>
              <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-lg">
                <div className="grid grid-cols-3 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="p-6 font-bold text-gray-800 text-lg">功能</div>
                  <div className="p-6 text-center font-bold text-gray-800 text-lg">免费版</div>
                  <div className="p-6 text-center font-bold text-gray-800 text-lg">会员版</div>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="grid grid-cols-3 p-6 hover:bg-gray-50 transition-colors">
                    <div className="text-gray-700 font-medium">练习日志记录</div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">✓</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-6 hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <div className="text-gray-700 font-medium">AI分析建议</div>
                    <div className="text-center">
                      <span className="text-gray-500 font-medium">有限</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">完整</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-6 hover:bg-gray-50 transition-colors">
                    <div className="text-gray-700 font-medium">个性化训练计划</div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full">×</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-6 hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <div className="text-gray-700 font-medium">情绪支持功能</div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">✓</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-6 hover:bg-gray-50 transition-colors">
                    <div className="text-gray-700 font-medium">数据导出</div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full">×</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 召唤行动 */}
            <div className="text-center py-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl text-white">
              <h3 className="text-3xl font-bold mb-6">立即解锁完整 Homie 体验</h3>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                加入上千名网球爱好者的选择，让 Homie 成为你真正的网球学长
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStripeSubscribe}
                  disabled={stripeLoading}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  💳 国际版订阅
                </button>
                <Link
                  href="#activation"
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('activation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  🔑 国内版激活
                </Link>
              </div>
            </div>
          </>
        )}

        {/* 已会员显示感谢信息 */}
        {status && status.is_member && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white">
            <div className="text-8xl mb-8">🎉</div>
            <h3 className="text-4xl font-bold mb-6">感谢您的支持！</h3>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              您已经是 Homie 的尊贵会员，我将持续为您提供最优质的网球学习陪伴体验。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                🏠 返回仪表盘
              </Link>
              <Link
                href="/practice"
                className="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl font-bold hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                🎾 开始练习
              </Link>
              <Link
                href="/analysis"
                className="px-8 py-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-bold hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                🤖 AI分析
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(SubscribePage)