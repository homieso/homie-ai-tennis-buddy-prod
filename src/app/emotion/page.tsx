'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, withAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import TennisCharacter from '@/components/TennisCharacter'

type EmotionSupportData = {
  acknowledge: string
  reframe: string
  lowerBar: string
}

function EmotionPage() {
  const { user } = useAuth()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [supportData, setSupportData] = useState<EmotionSupportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [checkingMembership, setCheckingMembership] = useState(false)

  const difficulties = [
    '反手总是下网',
    '发球不进区',
    '正手打不远',
    '脚步跟不上',
    '网前球处理不好',
    '比赛时紧张',
    '击球时机抓不准',
    '体力不够用'
  ]

  const handleDifficultyClick = async (difficulty: string) => {
    setSelectedDifficulty(difficulty)
    setLoading(true)
    setError(null)
    setSupportData(null)

    try {
      const response = await fetch('/api/generate-emotion-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '请求失败')
      }

      if (data.success && data.data) {
        setSupportData(data.data)
      } else {
        throw new Error('响应格式错误')
      }
    } catch (err) {
      console.error('获取情绪支持失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  // 检查会员状态
  const checkMembership = async (): Promise<boolean> => {
    if (!user) return false
    setCheckingMembership(true)
    try {
      const supabase = createClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('membership_valid_until')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('获取会员状态失败:', error)
        return false
      }

      if (!profile?.membership_valid_until) {
        return false
      }

      const validUntil = new Date(profile.membership_valid_until)
      const now = new Date()
      return validUntil > now
    } catch (err) {
      console.error('检查会员状态异常:', err)
      return false
    } finally {
      setCheckingMembership(false)
    }
  }

  // 处理自定义输入提交
  const handleCustomSubmit = async () => {
    if (!customInput.trim()) {
      alert('请输入你的困难')
      return
    }

    // 检查会员状态
    const memberStatus = await checkMembership()
    if (!memberStatus) {
      if (confirm('请升级会员以使用此功能。是否前往订阅页面？')) {
        window.location.href = '/subscribe'
      }
      return
    }

    // 会员，调用 API
    setSelectedDifficulty('custom')
    setLoading(true)
    setError(null)
    setSupportData(null)

    try {
      const response = await fetch('/api/generate-emotion-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty: customInput.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '请求失败')
      }

      if (data.success && data.data) {
        setSupportData(data.data)
        setCustomInput('') // 清空输入框
      } else {
        throw new Error('响应格式错误')
      }
    } catch (err) {
      console.error('获取情绪支持失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <TennisCharacter status="cheer" displayText="遇到困难了？别担心，Homie在这里陪你！" dialogPosition="right" flipHorizontal={true} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">三步支持法</h2>
              <p className="text-gray-600">网球学长 Homie 在这里倾听你的困难，用三步法帮你找回信心。</p>
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

        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-6">选择你遇到的困难：</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => handleDifficultyClick(difficulty)}
                disabled={loading}
                className={`
                  px-5 py-4 rounded-2xl border text-left transition-all duration-300
                  ${selectedDifficulty === difficulty
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center">
                  {selectedDifficulty === difficulty ? (
                    <span className="mr-3">✨</span>
                  ) : (
                    <span className="mr-3">🎾</span>
                  )}
                  <span className="font-medium">{difficulty}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 自定义困难输入区域 */}
        <div className="mb-12 mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">或者，告诉我你遇到的困难（会员专属）</h2>
          <div className="max-w-2xl mx-auto">
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="描述你遇到的困难..."
              className="w-full p-4 bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[120px] text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 max-w-md">
                会员可解锁此功能
              </div>
              <button
                onClick={handleCustomSubmit}
                disabled={loading || checkingMembership}
                className={`
                  px-8 py-3 rounded-xl font-medium transition-all shadow-md
                  ${loading || checkingMembership
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-lg'
                  }
                `}
              >
                {checkingMembership ? '检查会员状态...' : '获取支持'}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div>
                <p className="text-blue-700 font-medium">Homie 正在思考...</p>
                <p className="text-blue-600 text-sm">正在生成个性化支持建议</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-start space-x-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <div>
                <p className="text-red-800 font-bold text-lg mb-2">获取支持失败</p>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {supportData && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center mr-4">
                  🤗
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Homie 的三步支持法</h2>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-md p-8 border border-blue-100">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">承认困难</h3>
                      <p className="text-gray-700 text-lg leading-relaxed">{supportData.acknowledge}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 border border-purple-100">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">重构认知</h3>
                      <p className="text-gray-700 text-lg leading-relaxed">{supportData.reframe}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 border border-green-100">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">降低门槛</h3>
                      <p className="text-gray-700 text-lg leading-relaxed">{supportData.lowerBar}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-blue-200">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-xl p-6">
                  <div className="flex items-start">
                    <span className="text-yellow-600 text-2xl mr-4">💡</span>
                    <div>
                      <p className="text-yellow-800 text-lg font-medium mb-2">温馨提示</p>
                      <p className="text-yellow-700">
                        网球学习是一场马拉松，不是短跑。每一个困难都是进步的机会，每一次挫折都是成长的垫脚石。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSupportData(null)
                  setSelectedDifficulty('')
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                🔄 选择其他困难
              </button>
              <Link
                href="/practice/new"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                🎾 立即练习
              </Link>
            </div>
          </div>
        )}

        {!supportData && !loading && !error && (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-blue-100">
            <div className="text-8xl mb-8">🤗</div>
            <p className="text-2xl font-bold text-gray-800 mb-4">选择你遇到的困难</p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              网球学长 Homie 会为你提供个性化支持，帮你找回信心和动力
            </p>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              每个球员都会遇到瓶颈，这正是成长的契机。你不是一个人在战斗，Homie 会一直陪着你！
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(EmotionPage)