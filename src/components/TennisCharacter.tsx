'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TennisCharacterProps {
  status?: 'wave' | 'thinking' | 'writing' | 'run' | 'relax' | 'cheer' | 'celebrate'
  displayText?: string
  onAvatarClick?: () => void
  flipHorizontal?: boolean
  dialogPosition?: 'bottom' | 'left' | 'right'
}

const TennisCharacter: React.FC<TennisCharacterProps> = ({
  status = 'wave',
  displayText = '',
  onAvatarClick,
  flipHorizontal = false,
  dialogPosition = 'bottom'
}) => {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [currentText, setCurrentText] = useState(displayText)

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  useEffect(() => {
    setCurrentText(displayText)
  }, [displayText])

  const characterAssets = {
    wave: '/images/homie/homie-wave.png',
    thinking: '/images/homie/homie-thinking.png',
    writing: '/images/homie/homie-writing.png',
    run: '/images/homie/homie-run.png',
    relax: '/images/homie/homie-relax.png',
    cheer: '/images/homie/homie-cheer.png',
    celebrate: '/images/homie/homie-celebrate.png',
  }

  return (
    <div className={`relative w-full flex ${dialogPosition === 'bottom'
      ? 'flex-col items-center'
      : dialogPosition === 'left'
        ? 'flex-col md:flex-row items-center justify-center gap-6 md:gap-10'
        : 'flex-col md:flex-row-reverse items-center justify-center gap-6 md:gap-10'}`}>
      {/* 对话框 */}
      {currentText && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              opacity: { duration: 0.3, ease: "easeOut" },
              y: {
                type: "spring",
                stiffness: 250,
                damping: 20
              },
              scale: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }
          }}
          exit={{ opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }}
          className={`relative z-20 w-fit max-w-2xl px-6 ${dialogPosition === 'bottom' ? 'mb-4 mx-auto' : 'flex-shrink-0'}`}
        >
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/70 min-h-[80px] clay-effect">
            <p className="text-[#1E293B] text-lg leading-relaxed font-medium text-center whitespace-pre-line">{currentText}</p>
          </div>
          {/* 对话框小尾巴 */}
          {dialogPosition === 'bottom' && (
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white/90"></div>
          )}
        </motion.div>
      )}

      {/* 角色主体 */}
      <div className={`relative w-full ${dialogPosition === 'bottom' ? 'max-w-2xl' : 'max-w-md flex-shrink-0'} ${dialogPosition === 'bottom' ? 'h-[60vh]' : 'h-[40vh] md:h-[50vh]'} flex items-end justify-center`}>
        <AnimatePresence mode="wait">
          <div className={`w-full h-full ${flipHorizontal ? 'scale-x-[-1]' : ''}`}>
            <motion.img
              key={currentStatus}
              src={characterAssets[currentStatus]}
              alt="Homie"
              initial={{ opacity: 0, y: 60, scale: 0.85, rotate: -2 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                transition: {
                  opacity: { duration: 0.4, ease: "easeOut" },
                  y: {
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    mass: 0.8
                  },
                  scale: {
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  },
                  rotate: { duration: 0.3 }
                }
              }}
              exit={{
                opacity: 0,
                y: -30,
                scale: 0.9,
                rotate: 2,
                transition: {
                  duration: 0.25,
                  ease: "easeIn"
                }
              }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="w-full h-full object-contain drop-shadow-2xl select-none cursor-pointer transform-gpu backface-visibility-hidden"
              onClick={onAvatarClick}
              style={{
                animation: currentStatus === 'celebrate'
                  ? 'celebrate 2s ease-in-out infinite, idleBreath 4s ease-in-out infinite'
                  : currentStatus === 'writing'
                  ? 'writingHand 0.8s ease-in-out infinite, idleBreath 4s ease-in-out infinite'
                  : 'idleBreath 4s ease-in-out infinite'
              }}
            />
          </div>
        </AnimatePresence>
        <style>{`
          @keyframes idleBreath {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          @keyframes celebrate {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(-2deg); }
            50% { transform: translateY(-30px) rotate(2deg); }
            75% { transform: translateY(-15px) rotate(-1deg); }
          }
          @keyframes writingHand {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-2px) rotate(-1deg); }
            50% { transform: translateY(-4px) rotate(1deg); }
            75% { transform: translateY(-2px) rotate(-0.5deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default TennisCharacter