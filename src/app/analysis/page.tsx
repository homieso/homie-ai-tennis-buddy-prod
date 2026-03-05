'use client'

import Link from 'next/link'
import { withAuth } from '@/lib/auth/auth'
import TennisCharacter from '@/components/TennisCharacter'

function AnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Homie 头部 */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <TennisCharacter status="thinking" displayText="基于你的练习数据，提供个性化建议" dialogPosition="right" flipHorizontal={true} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border border-blue-100 p-16 text-center">
          <div className="text-8xl mb-8">🤖</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">智能分析功能开发中</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            我们正在努力开发 AI 分析功能，将基于你的练习数据提供个性化建议和改进方案。
          </p>
          <div className="bg-white/70 rounded-xl p-8 mb-8 max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">即将推出的功能：</h3>
            <ul className="space-y-3 text-left">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">练习数据趋势分析</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">个性化技术改进建议</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">每周进步可视化报告</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-700">与 Homie 的智能对话分析</span>
              </li>
            </ul>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium text-lg"
          >
            <span className="mr-2">←</span>
            回到 Homie 身边
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            想要提前体验？<Link href="/subscribe" className="text-blue-500 hover:underline font-medium">升级会员</Link> 可优先体验新功能
          </p>
        </div>
      </div>
    </div>
  )
}

export default withAuth(AnalysisPage)