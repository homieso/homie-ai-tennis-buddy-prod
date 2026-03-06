'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { withAuth } from '@/lib/auth/auth'
import HomieAvatar from '@/components/HomieAvatar'
import LoadingScreen from '@/components/LoadingScreen'

type WeeklyGoal = Database['public']['Tables']['weekly_goals']['Row']

function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    if (!user) return

    const fetchGoals = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })

      if (!isMounted) return

      if (error) {
        console.error('获取目标失败:', error)
      } else {
        setGoals(data || [])
      }
      setLoading(false)
    }

    fetchGoals()

    return () => {
      isMounted = false
    }
  }, [user])

  if (loading) {
    return <LoadingScreen message="加载中..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-4 mb-8">
          <HomieAvatar variant="thinking" size="md" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">周目标</h1>
            <p className="text-gray-600 mt-1">这周的目标是什么？我帮你一起制定。</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">我的目标记录</h2>
            <p className="text-gray-600">明确目标，才能更有方向</p>
          </div>
          <Link
            href="/goals/new"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg"
          >
            🎯 设定新目标
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl border border-green-100">
            <div className="text-6xl mb-6">🎯</div>
            <p className="text-2xl font-bold text-gray-800 mb-4">还没有设定目标</p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              开始制定你的第一个周目标，让 Homie 陪你一起实现它！
            </p>
            <Link
              href="/goals/new"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              📅 去设定第一个周目标
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="text-lg font-bold text-gray-800">
                    第 {new Date(goal.week_start_date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} 周
                  </div>
                  <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                    {new Date(goal.week_start_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                    <div className="font-bold text-gray-800 mb-2 flex items-center">
                      <span className="mr-2">⭐</span> 核心目标
                    </div>
                    <div className="text-gray-800 text-lg">{goal.core_goal}</div>
                  </div>

                  {goal.micro_exercises && goal.micro_exercises.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                      <div className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">💪</span> 微练习清单
                      </div>
                      <ul className="space-y-2">
                        {goal.micro_exercises?.map((ex, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2 mt-1">✓</span>
                            <span className="text-gray-800">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {goal.emotion_reminder && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                      <div className="font-bold text-gray-800 mb-2 flex items-center">
                        <span className="mr-2">🤗</span> Homie 的提醒
                      </div>
                      <p className="text-gray-800 italic">{goal.emotion_reminder}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goal.next_lesson_time && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="font-medium text-gray-700 mb-1">下次课程时间</div>
                        <div className="text-gray-800">
                          {new Date(goal.next_lesson_time).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}

                    {goal.confusion && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="font-medium text-gray-700 mb-1">你在网球学习中遇到了什么困惑？</div>
                        <div className="text-gray-800">{goal.confusion}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 返回仪表盘链接 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full transition-colors"
          >
            <span className="mr-2">←</span>
            回到 Homie 身边
          </Link>
        </div>
      </div>
    </div>
  )
}

export default withAuth(GoalsPage)