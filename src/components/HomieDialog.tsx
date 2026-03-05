import React from 'react';
import HomieAvatar from './HomieAvatar';

interface HomieDialogProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl';
  avatarVariant?: 'wave' | 'run' | 'celebrate' | 'relax' | 'writing' | 'cheer' | 'thinking';
  avatarPosition?: 'left' | 'top';
  className?: string;
}

const HomieDialog: React.FC<HomieDialogProps> = ({
  title,
  description,
  children,
  avatarSize = 'md',
  avatarVariant = 'wave',
  avatarPosition = 'left',
  className = ''
}) => {
  return (
    <div className={`flex ${avatarPosition === 'left' ? 'flex-row' : 'flex-col'} items-start gap-4 ${className}`}>
      <div className={`flex-shrink-0 ${avatarPosition === 'left' ? '' : 'self-center'}`}>
        <HomieAvatar size={avatarSize} variant={avatarVariant} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-xl border border-blue-100">
          {/* Dialog bubble tail */}
          {avatarPosition === 'left' && (
            <div className="absolute -left-3 top-8 w-6 h-6 transform -rotate-45 bg-gradient-to-br from-white to-blue-50 border-l border-b border-blue-100"></div>
          )}
          {avatarPosition === 'top' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rotate-45 bg-gradient-to-br from-white to-blue-50 border-t border-l border-blue-100"></div>
          )}

          <div className="relative z-10">
            {title && (
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 mb-4">
                {description}
              </p>
            )}
            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomieDialog;