'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import TennisCharacter from '@/components/TennisCharacter'
import ParticleBackground from '@/components/ParticleBackground'

type Step = 1 | 2 | 3 | 4 | 5

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    age: '',
    playing_years: '',
    message_to_homie: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 用于自动聚焦输入框
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // 根据步骤自动聚焦输入框
  useEffect(() => {
    if (currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [currentStep])

  // 步骤配置
  const stepConfig = {
    1: {
      status: 'writing' as const,
      text: '告诉我你的昵称，方便我称呼你',
      inputType: 'text' as const,
      placeholder: '输入你的昵称',
    },
    2: {
      status: 'writing' as const,
      text: '年龄帮助我更好地了解你的学习阶段',
      inputType: 'number' as const,
      placeholder: '输入你的年龄',
    },
    3: {
      status: 'writing' as const,
      text: '你学网球多久了？',
      inputType: 'text' as const,
      placeholder: '例如：3个月、一年、2年',
    },
    4: {
      status: 'writing' as const,
      text: '还有什么想对我说的吗？',
      inputType: 'textarea' as const,
      placeholder: '写下你想对 Homie 说的话...',
    },
    5: {
      status: 'writing' as const,
      text: '最后，设置你的账号密码',
      inputType: null,
      placeholder: '',
    },
  }

  const currentConfig = stepConfig[currentStep]

  const handleNextStep = () => {
    // 验证当前步骤的输入
    if (currentStep === 1 && !formData.nickname.trim()) {
      setError('请输入昵称')
      return
    }

    if (currentStep === 2 && !formData.age.trim()) {
      setError('请输入年龄')
      return
    }

    if (currentStep === 3 && !formData.playing_years.trim()) {
      setError('请输入球龄')
      return
    }

    // 清除错误
    setError(null)

    // 进入下一步
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
      setError(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async () => {
    // 验证邮箱和密码
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('请输入邮箱和密码')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码至少需要6位字符')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          age: formData.age,
          playing_years: formData.playing_years,
          message_to_homie: formData.message_to_homie,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '注册失败')
      }

      setSuccess(true)

      // 注册成功，显示成功状态
      setTimeout(() => {
        // 如果有session则自动登录，跳转到仪表盘
        if (data.data.session) {
          router.push('/dashboard')
          router.refresh()
        } else {
          // 需要邮箱确认，跳转到登录页或显示提示
          router.push('/login?message=请检查邮箱确认账号')
        }
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
      console.error('注册错误:', err)
    } finally {
      setLoading(false)
    }
  }


  // 渲染输入框
  const renderInput = () => {
    if (!currentConfig.inputType) return null

    if (currentConfig.inputType === 'textarea') {
      return (
        <motion.textarea
          key="textarea"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          name="message_to_homie"
          value={formData.message_to_homie}
          onChange={handleInputChange}
          placeholder={currentConfig.placeholder}
          className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none min-h-[120px] clay-input"
          rows={4}
        />
      )
    }

    return (
      <motion.input
        key="input"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={currentConfig.inputType}
        name={
          currentStep === 1 ? 'nickname' :
          currentStep === 2 ? 'age' :
          currentStep === 3 ? 'playing_years' :
          'message_to_homie'
        }
        value={
          currentStep === 1 ? formData.nickname :
          currentStep === 2 ? formData.age :
          currentStep === 3 ? formData.playing_years :
          formData.message_to_homie
        }
        onChange={handleInputChange}
        placeholder={currentConfig.placeholder}
        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-center text-lg clay-input"
        autoComplete="off"
      />
    )
  }

  // 步骤5：显示邮箱密码输入和提交
  const renderEmailPasswordStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md space-y-4"
    >
      <motion.input
        key="email"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="邮箱地址"
        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent clay-input"
        autoComplete="email"
      />
      <motion.input
        key="password"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        placeholder="密码（至少6位）"
        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent clay-input"
        autoComplete="new-password"
      />
      <motion.input
        key="confirmPassword"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        placeholder="确认密码"
        className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-[#1E293B] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent clay-input"
        autoComplete="new-password"
      />
    </motion.div>
  )

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
        className="absolute top-32 left-4 z-20 p-2 bg-white/30 backdrop-blur-sm rounded-full hover:bg-white/50 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>


      {/* 左右分栏布局 */}
      <div className="relative z-10 flex flex-row h-full">
        {/* 左侧角色区域 */}
        <div className="w-1/2 flex items-center justify-center">
          <TennisCharacter
            status="writing"
            displayText={currentConfig.text}
            flipHorizontal={true}
          />
        </div>

        {/* 右侧表单区域 */}
        <div className="w-1/2 flex flex-col items-center justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            {currentStep === 5 ? (
              renderEmailPasswordStep()
            ) : (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="w-full max-w-md"
              >
                {renderInput()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 错误信息 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* 成功信息 */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm text-center"
            >
              注册成功！正在跳转...
            </motion.div>
          )}

          {/* 按钮区域 */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            {/* 上一步按钮（仅步骤2-5显示） */}
            {currentStep > 1 && currentStep <= 5 && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 bg-white/90 text-[#1E293B] rounded-2xl font-medium hover:bg-white transition-all duration-200 clay-button"
              >
                上一步
              </button>
            )}

            {/* 下一步/提交按钮 */}
            <button
              onClick={currentStep === 5 ? handleSubmit : handleNextStep}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-2xl font-medium hover:from-[#1D4ED8] hover:to-[#2563EB] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center clay-button-cta"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  处理中...
                </>
              ) : currentStep === 5 ? (
                '完成注册'
              ) : (
                <>
                  下一步
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          </div>


          {/* 已有账号链接（仅在步骤5显示） */}
          {currentStep === 5 && (
            <p className="mt-4 text-gray-500 text-sm text-center">
              已有账号？{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-500 hover:text-blue-600 underline"
              >
                直接登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}