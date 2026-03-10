'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface EmailConsentStepProps {
  value: boolean
  onChange: (value: boolean) => void
  nickname?: string
}

export default function EmailConsentStep({ value, onChange, nickname }: EmailConsentStepProps) {
  const displayText = nickname
    ? `${nickname}，希望每天都能给你一些网球小鼓励吗？`
    : '希望每天都能给你一些网球小鼓励吗？'

  return (
    <div className="w-full">
      {/* 步骤说明 */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
          步骤 5/6
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          每日鼓励
        </h3>
        <p className="text-gray-600">
          {displayText}
        </p>
      </div>

      {/* 同意卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onChange(!value)}
        className={`
          cursor-pointer p-6 rounded-2xl transition-all duration-200
          ${value
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-md'
            : 'bg-white/90 border-2 border-gray-200 hover:border-amber-200'
          }
        `}
      >
        <div className="flex items-start">
          <div className={`
            w-12 h-12 flex items-center justify-center rounded-xl mr-4 text-xl flex-shrink-0
            ${value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}
          `}>
            📧
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800 text-lg">
                接收 Homie 的每日鼓励邮件
              </div>
              <div className={`
                relative w-12 h-6 rounded-full transition-all duration-300
                ${value ? 'bg-amber-500' : 'bg-gray-300'}
              `}>
                <div className={`
                  absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300
                  ${value ? 'left-7' : 'left-1'}
                `} />
              </div>
            </div>

            <div className="text-gray-600 space-y-3">
              <p className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>每天一句网球小鼓励，保持动力</span>
              </p>
              <p className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>个性化练习建议，基于你的进步</span>
              </p>
              <p className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>一周小结，回顾你的网球成长</span>
              </p>
              <p className="flex items-start">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <span className="text-sm">可随时在设置中取消，我们不会发送垃圾邮件</span>
              </p>
            </div>

            {value && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="text-amber-800 text-sm font-medium">
                  ✓ 已同意接收每日鼓励邮件
                </div>
                <div className="text-amber-700 text-xs mt-1">
                  你会收到温暖又有用的网球建议，帮助保持练习热情
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 隐私声明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-2">隐私承诺：</p>
          <ul className="space-y-1">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>你的邮箱仅用于发送 Homie 的鼓励邮件</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>我们不会分享你的邮箱给任何第三方</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>每封邮件都包含取消订阅链接，可随时停止</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>邮件频率：每天最多1封，绝不会轰炸你的收件箱</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 默认选中说明 */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <svg className="w-4 h-4 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          默认已勾选，因为我们真心想每天给你打气！
        </div>
      </div>
    </div>
  )
}