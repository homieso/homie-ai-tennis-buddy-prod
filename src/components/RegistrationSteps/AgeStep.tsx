'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface AgeStepProps {
  value: string
  onChange: (value: string) => void
  nickname?: string
}

const ageOptions = [
  { value: 'under-18', label: '18岁以下', emoji: '👶' },
  { value: '18-25', label: '18-25岁', emoji: '🎓' },
  { value: '26-35', label: '26-35岁', emoji: '💼' },
  { value: '36-plus', label: '36岁以上', emoji: '👨‍💼' },
  { value: 'prefer-not-to-say', label: '不愿透露', emoji: '🤐' }
]

export default function AgeStep({ value, onChange, nickname }: AgeStepProps) {
  const displayText = nickname
    ? `${nickname}，方便告诉我你的年龄段吗？这能帮助我用更合适的方式和你交流～`
    : '方便告诉我你的年龄段吗？这能帮助我用更合适的方式和你交流～'

  return (
    <div className="w-full">
      {/* 步骤说明 */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
          步骤 2/6
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          认识一下
        </h3>
        <p className="text-gray-600">
          {displayText}
        </p>
      </div>

      {/* 选项网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ageOptions.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onChange(option.value)}
            className={`
              relative p-4 rounded-2xl text-left transition-all duration-200
              ${value === option.value
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 shadow-md'
                : 'bg-white/90 border-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
              }
            `}
          >
            <div className="flex items-center">
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-xl mr-3 text-lg
                ${value === option.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}
              `}>
                {option.emoji}
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {option.label}
                </div>
                {value === option.value && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    ✓ 已选择
                  </div>
                )}
              </div>
            </div>

            {/* 选中状态指示器 */}
            {value === option.value && (
              <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* 帮助文本 */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>你的信息仅用于个性化你的网球搭子体验，我们会严格保密</p>
      </div>
    </div>
  )
}