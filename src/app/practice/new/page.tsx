'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import { withAuth } from '@/lib/auth/auth'
import TennisCharacter from '@/components/TennisCharacter'

function NewPracticePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [coachContent, setCoachContent] = useState('')
  const [bestShot, setBestShot] = useState('')
  const [worstShot, setWorstShot] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    aiCompanionLog: string
    nextReminder: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAiSuggestion(null)

    try {
      const res = await fetch('/api/generate-practice-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachContent, bestShot, worstShot })
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

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('practice_logs')
      .insert({
        user_id: user.id,
        log_date: today,
        coach_content: coachContent,
        best_shot: bestShot,
        worst_shot: worstShot,
        ai_companion_log: aiSuggestion.aiCompanionLog,
        next_reminder: aiSuggestion.nextReminder
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/practice')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <TennisCharacter status="writing" displayText="今天练得怎么样？跟我分享一下吧！" dialogPosition="left" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!aiSuggestion ? (
          <form onSubmit={handleGenerate} className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">填写练习详情</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">🎓</span>
                    教练教了什么？
                  </label>
                  <textarea
                    value={coachContent}
                    onChange={(e) => setCoachContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                    placeholder="例如：今天教练教了正手挥拍动作..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">✅</span>
                    今天打得最好的一球
                  </label>
                  <textarea
                    value={bestShot}
                    onChange={(e) => setBestShot(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all text-gray-900"
                    placeholder="例如：有一次正手直线穿越，感觉特别流畅"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    今天打得最差的一球
                  </label>
                  <textarea
                    value={worstShot}
                    onChange={(e) => setWorstShot(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all text-gray-900"
                    placeholder="例如：反手总是下网，找不到感觉"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      生成中...
                    </span>
                  ) : (
                    '让 Homie 分析你的练习'
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center mr-4">
                  🤗
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Homie 的陪练笔记</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-white/70 rounded-xl p-6">
                  <p className="text-gray-800 whitespace-pre-line text-lg leading-relaxed">{aiSuggestion.aiCompanionLog}</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-xl p-6">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">✨</span>
                    <h3 className="font-bold text-gray-800">温馨提醒</h3>
                  </div>
                  <p className="text-gray-700 italic text-lg">{aiSuggestion.nextReminder}</p>
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
                  '保存日志'
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

export default withAuth(NewPracticePage)