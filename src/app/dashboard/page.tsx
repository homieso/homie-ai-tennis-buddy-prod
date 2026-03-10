'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { withAuth } from '@/lib/auth/auth'
import HomieDialog from '@/components/HomieDialog'
import TennisCharacter from '@/components/TennisCharacter'

function DashboardPage() {
  const { user } = useAuth()
  const [showReminder, setShowReminder] = useState(false)
  const [daysAgo, setDaysAgo] = useState(0)
  const [greeting, setGreeting] = useState('')
  const [nickname, setNickname] = useState('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackContent, setFeedbackContent] = useState('')
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  // 反馈偏好选项
  const preferenceOptions = [
    { id: 'remind-practice', label: '提醒练球' },
    { id: 'analyze-video', label: '分析动作视频' },
    { id: 'find-buddies', label: '约球友' },
    { id: 'answer-questions', label: '解答疑惑' },
    { id: 'other', label: '其他' }
  ]

  useEffect(() => {
    let isMounted = true

    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('早上好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')

    if (!user) return

    const ensureProfile = async () => {
      const supabase = createClient()
      // 检查profile是否存在
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!isMounted) return

      if (error && error.code === 'PGRST116') { // 记录不存在
        // 创建profile，设置14天免费试用
        const fourteenDaysLater = new Date()
        fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14)
        const membershipValidUntil = fourteenDaysLater.toISOString()
        const username = user.email?.split('@')[0] || '伙伴'

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username,
            membership_valid_until: membershipValidUntil,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (!isMounted) return

        if (insertError) {
          console.error('创建profile失败:', insertError)
          if (isMounted) setNickname(username)
        } else {
          console.log('profile创建成功，14天免费试用已激活')
          if (isMounted) setNickname(username)
        }
      } else if (error) {
        console.error('查询profile失败:', error)
        if (isMounted) setNickname(user.email?.split('@')[0] || '伙伴')
      } else {
        // profile已存在，获取昵称
        const nickname = data.nickname || data.username || user.email?.split('@')[0] || '伙伴'
        if (isMounted) setNickname(nickname)
      }
    }

    const checkInactivity = async () => {
      const supabase = createClient()

      // 获取用户的最新活动记录（从 practice_logs 和 weekly_goals）
      const [practiceRes, goalsRes] = await Promise.all([
        supabase
          .from('practice_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('weekly_goals')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      if (!isMounted) return

      const practiceDate = practiceRes.data?.[0]?.created_at
      const goalsDate = goalsRes.data?.[0]?.created_at

      // 取最新的日期
      let latestDateStr = null
      if (practiceDate && goalsDate) {
        latestDateStr = new Date(practiceDate) > new Date(goalsDate) ? practiceDate : goalsDate
      } else {
        latestDateStr = practiceDate || goalsDate
      }

      if (latestDateStr) {
        const latestDate = new Date(latestDateStr)
        const today = new Date()
        const diffTime = today.getTime() - latestDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (isMounted) {
          setDaysAgo(diffDays)
          if (diffDays >= 10) {
            setShowReminder(true)
          }
        }
      }
    }

    ensureProfile()
    checkInactivity()

    return () => {
      isMounted = false
    }
  }, [user])

  const handleCloseReminder = () => {
    setShowReminder(false)
  }

  const handleOpenFeedback = () => {
    setShowFeedbackModal(true)
    setFeedbackMessage(null)
  }

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false)
    setFeedbackContent('')
    setSelectedPreferences([])
    setFeedbackMessage(null)
  }

  const togglePreference = (preferenceId: string) => {
    setSelectedPreferences(prev => {
      if (prev.includes(preferenceId)) {
        return prev.filter(id => id !== preferenceId)
      } else {
        return [...prev, preferenceId]
      }
    })
  }

  const handleSubmitFeedback = async () => {
    // 如果没有选择任何偏好且反馈内容为空，则显示错误
    if (selectedPreferences.length === 0 && !feedbackContent.trim()) {
      setFeedbackMessage('请至少选择一项偏好或填写反馈内容')
      return
    }

    setSubmittingFeedback(true)
    setFeedbackMessage(null)

    try {
      // 构建请求体
      const requestBody = {
        content: feedbackContent.trim() || '用户通过选项提交反馈',
        preferences: selectedPreferences
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || data.message || `提交反馈失败 (状态码: ${response.status})`
        throw new Error(errorMsg)
      }

      setFeedbackMessage('感谢你的反馈！我们会认真考虑你的建议。')
      setFeedbackContent('')
      setSelectedPreferences([])

      // 3秒后自动关闭模态框
      setTimeout(() => {
        if (isMountedRef.current) {
          setShowFeedbackModal(false)
        }
      }, 3000)
    } catch (err) {
      console.error('提交反馈失败:', err)
      let errorMessage = '提交反馈失败，请重试'
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
          errorMessage = '网络连接失败，请检查网络后重试'
        } else {
          errorMessage = err.message
        }
      }
      setFeedbackMessage(errorMessage)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* 主对话界面 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Homie 形象区域 */}
        <div className="mb-8">
          <TennisCharacter
            status="wave"
            displayText={greeting && nickname ? `${greeting}，${nickname}！\n今天想练什么？我帮你一起计划～` : '今天想练什么？\n我帮你一起计划～'}
            dialogPosition="right"
            flipHorizontal={true}
          />
        </div>

        {/* 掉队提醒 - 改为 Homie 的关心语气 */}
        {showReminder && (
          <div className="max-w-2xl mx-auto mb-8">
            <HomieDialog
              title="嘿，最近怎么没来呀？"
              description={`你已经 ${daysAgo} 天没来练习了，我很想你～要不要一起练个简单的？每天对墙击球5分钟，找回手感！`}
              avatarPosition="left"
              avatarSize="md"
            >
              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  href="/practice/new"
                  className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-full hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                >
                  立即记录一次练习
                </Link>
                <button
                  onClick={handleCloseReminder}
                  className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-all"
                >
                  谢谢提醒，我晚点来
                </button>
              </div>
            </HomieDialog>
          </div>
        )}

        {/* 功能对话框区域 */}
        <div className="max-w-6xl mx-auto mt-16">
          {/* 左右分栏布局 */}
          <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-8 lg:gap-12 mb-8">
            {/* 左侧功能卡片 */}
            <div className="w-full lg:w-1/2 max-w-md">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-xl border border-blue-100">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">今天想做什么？</h2>
                  <p className="text-gray-600 mt-2">选一个你想开始的事情，我陪你一起～</p>
                </div>
                <div className="flex flex-col gap-4">
                  <Link
                    href="/practice/new"
                    className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      🎾
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-800">记录今天的练习</h3>
                      <p className="text-sm text-gray-600">写下你的进步和感受</p>
                    </div>
                  </Link>

                  <Link
                    href="/goals/new"
                    className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl hover:from-green-100 hover:to-green-200 transition-all group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-green-500 text-white rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      📅
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-800">看看本周目标</h3>
                      <p className="text-sm text-gray-600">制定或查看你的计划</p>
                    </div>
                  </Link>

                  <Link
                    href="/emotion"
                    className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-purple-500 text-white rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      🤗
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-800">我需要鼓励</h3>
                      <p className="text-sm text-gray-600">Homie 给你打气</p>
                    </div>
                  </Link>

                </div>
              </div>
            </div>

            {/* 右侧 relax Homie */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
              <TennisCharacter
                status="relax"
                displayText=""
                dialogPosition="right"
                flipHorizontal={false}
              />
            </div>
          </div>

          {/* 快速入口 */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">其他功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/practice"
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-3xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">练习日志</h3>
                <p className="text-gray-600">查看历史记录，追踪进步轨迹</p>
              </Link>

              <Link
                href="/goals"
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">周目标</h3>
                <p className="text-gray-600">查看你设定的每周目标和微练习</p>
              </Link>

              <Link
                href="/analysis"
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI分析</h3>
                <p className="text-gray-600">基于数据提供个性化建议</p>
              </Link>

              <Link
                href="/subscribe"
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-3xl mb-4">💎</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">解锁更多陪伴</h3>
                <p className="text-gray-600">会员专属功能与高级特性</p>
              </Link>

            </div>

            {/* 反馈按钮 */}
            <div className="mt-10 text-center">
              <button
                onClick={handleOpenFeedback}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 text-amber-800 rounded-2xl hover:from-amber-100 hover:to-yellow-100 hover:border-amber-300 hover:shadow-md transition-all font-medium"
              >
                <span className="mr-2">💬</span>
                意见反馈
              </button>
              <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto">
                告诉我们你的想法、建议或遇到的问题
              </p>
            </div>
          </div>
        </div>

        {/* 底部返回链接 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            需要帮助？<Link href="/emotion" className="text-blue-500 hover:underline">随时找 Homie 聊聊</Link>
          </p>
        </div>

        {/* 反馈模态框 */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md min-h-[500px] max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b shrink-0">
                <h3 className="text-xl font-bold text-gray-800">给 Homie 留言</h3>
                <button
                  onClick={handleCloseFeedback}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  disabled={submittingFeedback}
                >
                  ×
                </button>
              </div>

              <div className="flex flex-col h-full">
                <div className="overflow-y-auto p-6 flex-grow">
                  <div className="mb-6 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
                    <p className="font-medium text-slate-700 mb-2">这是一个测试版产品，Stripe 支付为沙盒模式，实际支付无效。</p>
                    <p>但你的反馈对我们至关重要！每月5美元即可解锁更多Homie陪伴，你是否愿意支持？</p>
                    <p className="mt-2">为了更好为你服务，请告诉我们你希望 Homie 在哪些方面帮助你：</p>
                  </div>

                  {/* 偏好选项 */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">你希望 Homie 在哪些方面帮助你？（可多选）</h4>
                    <div className="space-y-2">
                      {preferenceOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedPreferences.includes(option.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPreferences.includes(option.id)}
                            onChange={() => togglePreference(option.id)}
                            className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            disabled={submittingFeedback}
                          />
                          <span className="ml-3 text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 其他反馈 */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-800 mb-3">其他想法或建议：</h4>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="告诉我们你的想法、建议或遇到的问题..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all min-h-[120px] text-gray-900 placeholder-gray-400"
                      disabled={submittingFeedback}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedPreferences.length === 0 && !feedbackContent.trim()
                        ? '请至少选择一项偏好或填写反馈内容'
                        : selectedPreferences.length > 0
                        ? `已选择 ${selectedPreferences.length} 项偏好`
                        : '你可以在这里写下详细的反馈'}
                    </p>
                  </div>

                  {feedbackMessage && (
                    <div className={`mt-4 p-3 rounded-lg ${feedbackMessage.includes('感谢') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {feedbackMessage}
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0 border-t border-gray-100 shrink-0">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCloseFeedback}
                      className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      disabled={submittingFeedback}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback || (selectedPreferences.length === 0 && !feedbackContent.trim())}
                      className={`
                        px-6 py-2 rounded-xl font-medium transition-all
                        ${submittingFeedback || (selectedPreferences.length === 0 && !feedbackContent.trim())
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                        }
                      `}
                    >
                      {submittingFeedback ? '提交中...' : '提交反馈'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)