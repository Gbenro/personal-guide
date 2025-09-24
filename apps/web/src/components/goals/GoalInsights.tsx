'use client'

import type { GoalInsight } from '@/types/goals'

interface GoalInsightsProps {
  insights: GoalInsight[]
}

export function GoalInsights({ insights }: GoalInsightsProps) {
  const getPriorityIcon = (priority: GoalInsight['priority']) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '💡'
    }
  }

  const getTypeIcon = (type: GoalInsight['type']) => {
    switch (type) {
      case 'achievement': return '🏆'
      case 'warning': return '⚠️'
      case 'suggestion': return '💡'
      case 'milestone': return '🎯'
      default: return '📋'
    }
  }

  const getBackgroundColor = (type: GoalInsight['type'], priority: GoalInsight['priority']) => {
    if (type === 'warning' || priority === 'high') return 'bg-red-50 border-red-200'
    if (type === 'achievement') return 'bg-green-50 border-green-200'
    if (type === 'milestone') return 'bg-blue-50 border-blue-200'
    return 'bg-yellow-50 border-yellow-200'
  }

  const getTextColor = (type: GoalInsight['type'], priority: GoalInsight['priority']) => {
    if (type === 'warning' || priority === 'high') return 'text-red-800'
    if (type === 'achievement') return 'text-green-800'
    if (type === 'milestone') return 'text-blue-800'
    return 'text-yellow-800'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Insights & Recommendations</h3>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getBackgroundColor(insight.type, insight.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-lg">
                {getTypeIcon(insight.type)} {getPriorityIcon(insight.priority)}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium mb-1 ${getTextColor(insight.type, insight.priority)}`}>
                  {insight.title}
                </h4>
                <p className={`text-sm ${getTextColor(insight.type, insight.priority)}`}>
                  {insight.description}
                </p>
                {insight.action_required && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Action Required
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-xs text-gray-500">
                {insight.created_at.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🤖</div>
          <p>No insights available yet. Complete some goals to get AI recommendations!</p>
        </div>
      )}
    </div>
  )
}