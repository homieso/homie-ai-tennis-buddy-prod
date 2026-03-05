'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import { withAuth } from '@/lib/auth/auth'
import { startOfWeek, format } from 'date-fns'
import TennisCharacter from '@/components/TennisCharacter'

function NewGoalPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [nextLessonTime, setNextLessonTime] = useState('')
  const [confusion, setConfusion] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    coreGoal: string
    microExercises: string[]
    emotionReminder: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAiSuggestion(null)

    try {
      const res = await fetch('/api/generate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextLessonTime, confusion })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '生成失败')
      }

      if (data.success) {
        setAiSuggestion(data.data)
      } else {
        throw new Error(data.error || '未知错误')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '请求失败，请重试'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !aiSuggestion) return

    setLoading(true)
    setError('')

    // 计算本周周一的日期
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 }) // 周一作为一周开始
    const weekStartDate = format(monday, 'yyyy-MM-dd')

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('weekly_goals')
      .insert({
        user_id: user.id,
        week_start_date: weekStartDate,
        next_lesson_time: nextLessonTime,
        confusion,
        core_goal: aiSuggestion.coreGoal,
        micro_exercises: aiSuggestion.microExercises,
        emotion_reminder: aiSuggestion.emotionReminder
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/goals')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <TennisCharacter status="thinking" displayText="这周有什么计划？我们一起制定！" dialogPosition="right" flipHorizontal={true} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!aiSuggestion ? (
          <form onSubmit={handleGenerate} className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">填写本周信息</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">⏰</span>
                    下次课程时间
                  </label>
                  <input
                    type="datetime-local"
                    value={nextLessonTime}
                    onChange={(e) => setNextLessonTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">🤔</span>
                    本周困惑
                  </label>
                  <textarea
                    value={confusion}
                    onChange={(e) => setConfusion(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all"
                    placeholder="例如：反手总是打不准，发球不稳定..."
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    <div className="font-medium">❌ {error}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      生成中...
                    </span>
                  ) : (
                    '让 Homie 制定本周目标'
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center mr-4">
                  🎯
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Homie 的目标建议</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">⭐</span> 核心目标
                  </h3>
                  <p className="text-gray-800 text-lg">{aiSuggestion.coreGoal}</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">💪</span> 微练习清单
                  </h3>
                  <ul className="space-y-2">
                    {aiSuggestion.microExercises.map((ex, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-yellow-600 mr-2 mt-1">✓</span>
                        <span className="text-gray-800">{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-100">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🤗</span> 情绪提醒
                  </h3>
                  <p className="text-gray-800 italic text-lg">{aiSuggestion.emotionReminder}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                <div className="font-medium">❌ {error}</div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    保存中...
                  </span>
                ) : (
                  '保存目标'
                )}
              </button>
              <button
                onClick={() => setAiSuggestion(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                重新填写
              </button>
            </div>

            {/* 返回仪表盘链接 */}
            <div className="pt-8 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
              >
                <span className="mr-2">←</span>
                回到 Homie 身边
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(NewGoalPage)