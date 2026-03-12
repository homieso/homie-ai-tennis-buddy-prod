'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface PreferencesStepProps {
  values: string[]  // 多选值
  otherValue: string  // "其他"文本输入
  onChange: (values: string[]) => void
  onOtherChange: (value: string) => void
  nickname?: string
  onSkip: () => void
  onContinue?: () => void  // 继续按钮回调
}

const preferenceOptions = [
  {
    value: 'record-practice',
    label: '记录每次练习，跟踪进步',
    emoji: '📝',
    description: '帮你记录每次练习的细节和进步'
  },
  {
    value: 'remind-practice',
    label: '提醒我按时练球',
    emoji: '⏰',
    description: '设置练习提醒，养成好习惯'
  },
  {
    value: 'encourage',
    label: '在我受挫时给我打气',
    emoji: '🤗',
    description: '当你遇到困难时，给你鼓励和支持'
  },
  {
    value: 'answer-questions',
    label: '解答网球技术疑惑',
    emoji: '🤔',
    description: '回答网球技术和练习方法的问题'
  },
  {
    value: 'other',
    label: '其他',
    emoji: '💭',
    description: '其他你想要的功能'
  }
]

export default function PreferencesStep({
  values,
  otherValue,
  onChange,
  onOtherChange,
  nickname,
  onSkip,
  onContinue
}: PreferencesStepProps) {
  const displayText = nickname
    ? `${nickname}，你希望我主要帮你做什么？我可以同时做多件事！`
    : '你希望我主要帮你做什么？我可以同时做多件事！'

  const handleToggle = (value: string) => {
    if (value === 'other') {
      // 如果选择"其他"，需要特殊处理
      if (values.includes('other')) {
        onChange(values.filter(v => v !== 'other'))
      } else {
        onChange([...values, 'other'])
      }
    } else {
      if (values.includes(value)) {
        onChange(values.filter(v => v !== value))
      } else {
        onChange([...values, value])
      }
    }
  }

  const isOtherSelected = values.includes('other')

  return (
    <div className="w-full">
      {/* 步骤说明 */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
          步骤 4/6
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          我的角色
        </h3>
        <p className="text-gray-600">
          {displayText}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          可以多选，不选也可以直接跳过
        </p>
      </div>

      {/* 选项网格 */}
      <div className="space-y-3">
        {preferenceOptions.map((option, index) => (
          <motion.div
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => handleToggle(option.value)}
              className={`
                w-full p-4 rounded-2xl text-left transition-all duration-200
                ${values.includes(option.value)
                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 shadow-md'
                  : 'bg-white/90 border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                }
              `}
            >
              <div className="flex items-start">
                <div className={`
                  w-10 h-10 flex items-center justify-center rounded-xl mr-3 text-lg flex-shrink-0
                  ${values.includes(option.value) ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                `}>
                  {option.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {option.description}
                  </div>
                  {values.includes(option.value) && (
                    <div className="text-xs text-purple-600 font-medium mt-1">
                      ✓ 已选择
                    </div>
                  )}
                </div>
                <div className={`
                  w-6 h-6 flex items-center justify-center rounded-full border-2 flex-shrink-0 ml-2
                  ${values.includes(option.value)
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-white border-gray-300'
                  }
                `}>
                  {values.includes(option.value) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {/* "其他"选项的文本输入框 */}
            {option.value === 'other' && isOtherSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 ml-13"
              >
                <textarea
                  value={otherValue}
                  onChange={(e) => onOtherChange(e.target.value)}
                  placeholder="请告诉我们你的其他需求..."
                  className="w-full px-4 py-3 bg-white/90 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                  rows={3}
                />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 跳过和继续按钮 */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200"
        >
          暂不选择，直接跳过
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md"
        >
          继续 {values.length > 0 ? `(${values.length}项已选)` : ''}
        </button>
      </div>

      {/* 帮助文本 */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>你的选择会帮助我更好地为你服务，之后也可以随时调整</p>
      </div>
    </div>
  )
}