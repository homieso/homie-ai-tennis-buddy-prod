'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import ParticleBackground from '@/components/ParticleBackground'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setError(error.message)
      } else {
        // 登录成功，重定向到首页
        router.push('/')
        router.refresh() // 刷新页面状态
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#F8FAFC]">
      {/* 动态背景光斑 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2563EB]/20 rounded-full blur-[100px] animate-float-slow animate-pulse-color" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B82F6]/15 rounded-full blur-[120px] animate-float-slower" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#F97316]/10 rounded-full blur-[90px] animate-float-medium" />
      </div>

      {/* 粒子背景 */}
      <ParticleBackground particleCount={40} />

      {/* 左上角返回/关闭按钮 */}
      <button
        onClick={() => router.back()}
        className="absolute top-24 left-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 clay-button"
      >
        <svg className="w-6 h-6 text-[#1E293B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* 角色区域 */}
      <div className="relative z-10 h-2/5 md:h-2/5 flex items-end justify-center">
        <div className="relative w-full flex flex-col items-center">
          {/* 对话框 */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-20 w-full max-w-2xl px-6 mb-4"
          >
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/70 min-h-[80px] clay-effect">
              <p className="text-[#1E293B] text-lg leading-relaxed font-medium">欢迎回来！我是 Homie，你的 AI 网球搭子。</p>
            </div>
            {/* 对话框小尾巴 */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white/90"></div>
          </motion.div>

          {/* 角色主体 */}
          <div className="relative w-full max-w-2xl h-[40vh] flex items-end justify-center">
            <motion.img
              src="/images/homie/homie-wave.png"
              alt="Homie"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  opacity: { duration: 0.5, ease: "easeOut" },
                  y: { duration: 0.6, ease: "backOut" },
                  scale: { duration: 0.5, ease: "easeOut" }
                }
              }}
              className="w-full h-full object-contain drop-shadow-2xl select-none"
              style={{ animation: 'idleBreath 4s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>

      {/* 登录表单区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8 h-3/5 md:h-3/5">
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-6"
        >
          <div className="space-y-4">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent clay-input"
              placeholder="邮箱地址"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent clay-input"
              placeholder="密码"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-2xl font-medium hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center clay-button-cta"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>

          <div className="text-center space-y-4">
            <p className="text-gray-500 text-sm">
              还没有账号？{' '}
              <Link
                href="/register"
                className="text-[#2563EB] hover:text-[#1D4ED8] font-medium underline"
              >
                立即注册
              </Link>
            </p>
            <p className="text-gray-500 text-sm">
              <Link
                href="/forgot-password"
                className="text-gray-500 hover:text-gray-700"
              >
                忘记密码？
              </Link>
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  )
}