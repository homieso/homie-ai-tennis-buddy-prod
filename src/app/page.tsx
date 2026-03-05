'use client'

import { useAuth } from '@/lib/auth/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import TennisCharacter from '@/components/TennisCharacter'
import LoadingScreen from '@/components/LoadingScreen'

export default function Home() {
  const { loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated && !loading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return <LoadingScreen message="加载中..." />
  }

  // If authenticated, show redirecting or nothing (will redirect)
  if (isAuthenticated) {
    return <LoadingScreen message="正在跳转到仪表盘..." />
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-50 to-pink-50">
      {/* 动态背景光斑 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-300 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-[120px] animate-float-slower" />
      </div>

      {/* 角色区域 */}
      <div className="relative z-10 h-3/5">
        <TennisCharacter
          status="wave"
          displayText="嘿，我是你的网球学长 Homie！一起来打球吗？"
        />
      </div>

      {/* 按钮区域 */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6">
        <Link
          href="/login"
          className="w-full max-w-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-4 rounded-2xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="w-full max-w-sm bg-white/80 backdrop-blur-sm text-slate-700 text-center py-4 rounded-2xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform border border-white"
        >
          注册
        </Link>
      </div>

      {/* 左上角产品名 */}
      <div className="absolute top-4 left-4 text-2xl font-bold text-slate-800">
        AI网球搭子
        <span className="block text-sm font-normal text-slate-500">你的专属网球学长</span>
      </div>
    </div>
  )
}