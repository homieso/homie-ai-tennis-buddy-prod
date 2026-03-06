'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { withAuth } from '@/lib/auth/auth'
import HomieAvatar from '@/components/HomieAvatar'
import LoadingScreen from '@/components/LoadingScreen'
import { format, differenceInDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type PracticeLog = Database['public']['Tables']['practice_logs']['Row']

function PracticePage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<PracticeLog[]>([])
  const [loading, setLoading] = useState(true)

  // 格式化日志日期，添加相对时间（如"昨天"）
  const formatLogDate = (dateString: string) => {
    const logDate = new Date(dateString)
    const today = new Date()
    const diffDays = differenceInDays(today, logDate)

    let prefix = ''
    if (diffDays === 0) {
      prefix = '今天'
    } else if (diffDays === 1) {
      prefix = '昨天'
    } else if (diffDays === 2) {
      prefix = '前天'
    }

    const formattedDate = format(logDate, 'yyyy年M月d日EEEE', { locale: zhCN })
    return prefix ? `${prefix} ${formattedDate}` : formattedDate
  }

  // 格式化创建时间（显示具体填写时间）
  const formatCreatedTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'HH:mm', { locale: zhCN })
  }

  useEffect(() => {
    let isMounted = true
    if (!user) return

    const fetchLogs = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('practice_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (!isMounted) return

      if (error) {
        console.error('获取日志失败:', error)
      } else {
        setLogs(data || [])
      }
      setLoading(false)
    }

    fetchLogs()

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
          <HomieAvatar variant="writing" size="md" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">练习日志 - {format(new Date(), 'yyyy年M月d日EEEE', { locale: zhCN })}</h1>
            <p className="text-gray-600 mt-1">今天有哪些进步？写下来吧！</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">我的练习记录 - {format(new Date(), 'yyyy年M月d日EEEE', { locale: zhCN })}</h2>
            <p className="text-gray-600">回顾过去，才能更好前进</p>
          </div>
          <Link
            href="/practice/new"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
          >
            ✏️ 记录新练习
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-blue-100">
            <div className="text-6xl mb-6">📝</div>
            <p className="text-2xl font-bold text-gray-800 mb-4">还没有练习记录</p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              开始记录你的第一次练习，让 Homie 帮你追踪进步吧！
            </p>
            <Link
              href="/practice/new"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              🎾 去记录第一次练习
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-lg font-bold text-gray-800">
                    {formatLogDate(log.log_date)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCreatedTime(log.created_at)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="font-medium text-gray-700 mb-1">教练内容</div>
                    <div className="text-gray-800">{log.coach_content}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="font-medium text-gray-700 mb-1 flex items-center">
                        <span className="mr-2">✅</span> 最好一球
                      </div>
                      <div className="text-gray-800">{log.best_shot}</div>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="font-medium text-gray-700 mb-1 flex items-center">
                        <span className="mr-2">💡</span> 最差一球
                      </div>
                      <div className="text-gray-800">{log.worst_shot}</div>
                    </div>
                  </div>

                  {log.ai_companion_log && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mr-3">
                          🤗
                        </div>
                        <div className="font-bold text-gray-800">Homie 的笔记</div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{log.ai_companion_log}</p>
                      {log.next_reminder && (
                        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-purple-100">
                          <p className="text-gray-600 italic">✨ {log.next_reminder}</p>
                        </div>
                      )}
                    </div>
                  )}
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

export default withAuth(PracticePage)