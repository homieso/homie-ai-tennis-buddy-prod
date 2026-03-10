'use client'

import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'
import TennisCharacter from './TennisCharacter'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  nickname: string
  ageRange?: string
  playingYears?: string
  preferences?: string[]
}

const getAgeLabel = (value: string): string => {
  switch (value) {
    case 'under-18': return '18岁以下'
    case '18-25': return '18-25岁'
    case '26-35': return '26-35岁'
    case '36-plus': return '36岁以上'
    case 'prefer-not-to-say': return '不愿透露'
    default: return ''
  }
}

const getPlayingYearsLabel = (value: string): string => {
  switch (value) {
    case 'beginner': return '刚开始'
    case '1-3-months': return '1-3个月'
    case '3-6-months': return '3-6个月'
    case '6-12-months': return '6个月-1年'
    case '1-plus-years': return '1年以上'
    case 'prefer-not-to-say': return '不愿透露'
    default: return ''
  }
}

const getPreferenceLabels = (values: string[]): string[] => {
  const labels: string[] = []
  values.forEach(value => {
    switch (value) {
      case 'record-practice':
        labels.push('记录练习跟踪进步')
        break
      case 'remind-practice':
        labels.push('提醒按时练球')
        break
      case 'encourage':
        labels.push('受挫时打气')
        break
      case 'answer-questions':
        labels.push('解答技术疑惑')
        break
      case 'other':
        labels.push('其他需求')
        break
    }
  })
  return labels
}

export default function WelcomeModal({
  isOpen,
  onClose,
  nickname,
  ageRange,
  playingYears,
  preferences = []
}: WelcomeModalProps) {
  if (!isOpen) return null

  const ageLabel = ageRange ? getAgeLabel(ageRange) : ''
  const playingYearsLabel = playingYears ? getPlayingYearsLabel(playingYears) : ''
  const preferenceLabels = getPreferenceLabels(preferences)

  const getPersonalizedMessage = () => {
    let message = `${nickname}，很高兴认识你！我会一直陪着你练球。\n\n`

    // 根据年龄调整语气
    if (ageRange === 'under-18') {
      message += '作为年轻球员，保持热情最重要！'
    } else if (ageRange === '18-25') {
      message += '大学时期是提升技术的黄金时间！'
    } else if (ageRange === '26-35') {
      message += '工作之余打网球是最好的放松！'
    } else if (ageRange === '36-plus') {
      message += '网球是终身运动，我们一起享受这个过程！'
    } else {
      message += '网球之旅，我们一起出发！'
    }

    // 根据球龄添加建议
    if (playingYears === 'beginner' || playingYears === '1-3-months') {
      message += '\n刚开始学网球可能会有些挑战，但别担心，每个人都是从这里开始的！'
    } else if (playingYears === '3-6-months' || playingYears === '6-12-months') {
      message += '\n你已经有了不错的基础，接下来就是巩固和提升的时候了！'
    } else if (playingYears === '1-plus-years') {
      message += '\n经验丰富的球员！我们可以一起探索更高级的技术。'
    }

    // 根据偏好承诺
    if (preferences.includes('remind-practice')) {
      message += '\n\n我会记得提醒你练球，帮你养成好习惯～'
    }
    if (preferences.includes('encourage')) {
      message += '\n当你遇到挫折时，我会第一时间给你鼓励！'
    }
    if (preferences.includes('answer-questions')) {
      message += '\n有任何网球问题，随时问我，我会尽力解答。'
    }

    message += '\n\n如果你偷懒超过一周，我会提醒你哦～现在，让我们开始吧！'

    return message
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* 模态框内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* 装饰元素 */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400" />

              <div className="flex flex-col lg:flex-row">
                {/* 左侧：Homie角色 */}
                <div className="lg:w-2/5 bg-gradient-to-b from-blue-100 to-purple-100 p-6 lg:p-10">
                  <div className="h-full flex flex-col items-center justify-center">
                    <TennisCharacter
                      status="celebrate"
                      displayText=""
                      flipHorizontal={false}
                      dialogPosition="bottom"
                    />
                    <div className="mt-6 text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <h3 className="text-xl font-bold text-gray-800">欢迎加入！</h3>
                      <p className="text-gray-600 mt-1">你的网球之旅现在开始</p>
                    </div>
                  </div>
                </div>

                {/* 右侧：欢迎消息和信息摘要 */}
                <div className="lg:w-3/5 p-6 lg:p-10">
                  <div className="h-full flex flex-col">
                    {/* 标题 */}
                    <div className="mb-6">
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        欢迎，{nickname}！
                      </h2>
                      <p className="text-gray-600 mt-2">
                        我是你的网球学长 Homie，很高兴成为你的专属搭子
                      </p>
                    </div>

                    {/* 个性化欢迎消息 */}
                    <div className="flex-1 mb-8">
                      <div className="bg-white/80 rounded-2xl p-6 border border-blue-100">
                        <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                          {getPersonalizedMessage()}
                        </div>
                      </div>
                    </div>

                    {/* 信息摘要（可选显示） */}
                    {(ageLabel || playingYearsLabel || preferenceLabels.length > 0) && (
                      <div className="mb-8">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          已保存的信息
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {ageLabel && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              年龄：{ageLabel}
                            </span>
                          )}
                          {playingYearsLabel && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              球龄：{playingYearsLabel}
                            </span>
                          )}
                          {preferenceLabels.map((label, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          这些信息仅用于个性化你的体验，可在设置中随时更新
                        </p>
                      </div>
                    )}

                    {/* 开始按钮 */}
                    <div className="flex justify-end">
                      <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
                      >
                        开始我的网球之旅
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}