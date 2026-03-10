'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface PlayingYearsStepProps {
  value: string
  onChange: (value: string) => void
  nickname?: string
}

const playingYearsOptions = [
  { value: 'beginner', label: '刚开始', emoji: '🌱', description: '刚接触网球' },
  { value: '1-3-months', label: '1-3个月', emoji: '🍃', description: '刚开始学习' },
  { value: '3-6-months', label: '3-6个月', emoji: '🌿', description: '有些基础了' },
  { value: '6-12-months', label: '6个月-1年', emoji: '🌳', description: '持续进步中' },
  { value: '1-plus-years', label: '1年以上', emoji: '🎾', description: '有一定经验' },
  { value: 'prefer-not-to-say', label: '不愿透露', emoji: '🤐', description: '跳过这个问题' }
]

export default function PlayingYearsStep({ value, onChange, nickname }: PlayingYearsStepProps) {
  const displayText = nickname
    ? `${nickname}，你学网球多久了？这样我可以给你更适合的建议～`
    : '你学网球多久了？这样我可以给你更适合的建议～'

  return (
    <div className="w-full">
      {/* 步骤说明 */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
          步骤 3/6
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          网球经验
        </h3>
        <p className="text-gray-600">
          {displayText}
        </p>
      </div>

      {/* 选项网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {playingYearsOptions.map((option, index) => (
          <motion.button
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onChange(option.value)}
            className={`
              relative p-4 rounded-2xl text-left transition-all duration-200
              ${value === option.value
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 shadow-md'
                : 'bg-white/90 border-2 border-gray-200 hover:border-green-200 hover:bg-green-50/50'
              }
            `}
          >
            <div className="flex items-start">
              <div className={`
                w-10 h-10 flex items-center justify-center rounded-xl mr-3 text-lg flex-shrink-0
                ${value === option.value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
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
                {value === option.value && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    ✓ 已选择
                  </div>
                )}
              </div>
            </div>

            {/* 选中状态指示器 */}
            {value === option.value && (
              <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-full">
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
        <p>无论你是新手还是老手，Homie都会陪你一起进步！</p>
      </div>
    </div>
  )
}