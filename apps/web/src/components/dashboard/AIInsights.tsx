'use client'

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import type { AIInsight } from '@/lib/dashboardService'

interface AIInsightsProps {
  insights: AIInsight[]
  onAction?: (insight: AIInsight) => void
}

export default function AIInsights({ insights, onAction }: AIInsightsProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'tip':
        return <LightBulbIcon className="h-5 w-5 text-purple-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getInsightBgColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'tip':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getActionButtonColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-700 hover:bg-green-200'
      case 'warning':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      case 'info':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'tip':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <LightBulbIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">
            Complete more habits to unlock personalized insights and recommendations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <LightBulbIcon className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="ml-auto">
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
            Smart Analysis
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border ${getInsightBgColor(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getInsightIcon(insight.type)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insight.message}
                </p>

                {insight.actionable && insight.action && (
                  <button
                    onClick={() => onAction?.(insight)}
                    className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${getActionButtonColor(insight.type)}`}
                  >
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {insights.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Insights update based on your habit patterns and progress
            </p>
          </div>
        )}
      </div>
    </div>
  )
}