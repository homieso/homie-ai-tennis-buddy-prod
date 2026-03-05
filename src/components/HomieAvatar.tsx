import React from 'react';
import Image from 'next/image';

interface HomieAvatarProps {
  variant?: 'wave' | 'run' | 'celebrate' | 'relax' | 'writing' | 'cheer' | 'thinking';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const HomieAvatar: React.FC<HomieAvatarProps> = ({
  variant = 'wave',
  size = 'md',
  className = ''
}) => {
  // 尺寸映射：Tailwind 类名
  const sizeClassMap = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  // 尺寸映射：像素值（用于 Next.js Image 组件）
  const pixelSizeMap = {
    sm: 48,
    md: 96,
    lg: 128,
    xl: 192
  };

  // 姿态映射：文件名
  const variantToFilename = {
    wave: 'homie-wave.png',
    run: 'homie-run.png',
    celebrate: 'homie-celebrate.png',
    relax: 'homie-relax.png',
    writing: 'homie-writing.png',
    cheer: 'homie-cheer.png',
    thinking: 'homie-thinking.png'
  };

  const sizeClass = sizeClassMap[size];
  const pixelSize = pixelSizeMap[size];
  const filename = variantToFilename[variant];
  const src = `/images/homie/${filename}`;

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <Image
        src={src}
        alt={`Homie ${variant}姿态`}
        width={pixelSize}
        height={pixelSize}
        className="w-full h-full drop-shadow-lg object-contain"
        priority={variant === 'wave'} // 首页的挥手姿态预加载
      />
    </div>
  );
};

export default HomieAvatar;