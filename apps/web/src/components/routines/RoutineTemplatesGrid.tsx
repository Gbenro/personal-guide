import { RoutineTemplate } from '../../types/routines'

interface RoutineTemplatesGridProps {
  templates: RoutineTemplate[]
  onUseTemplate: (templateId: string) => void
  loading?: boolean
}

export function RoutineTemplatesGrid({ templates, onUseTemplate, loading }: RoutineTemplatesGridProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      Morning: 'bg-orange-100 text-orange-800',
      Evening: 'bg-purple-100 text-purple-800',
      Workout: 'bg-red-100 text-red-800',
      Meditation: 'bg-blue-100 text-blue-800',
      Work: 'bg-gray-100 text-gray-800',
      Study: 'bg-green-100 text-green-800',
      Wellness: 'bg-pink-100 text-pink-800',
      Midday: 'bg-yellow-100 text-yellow-800',
      General: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.General
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Morning: '🌅',
      Evening: '🌙',
      Workout: '💪',
      Meditation: '🧘',
      Work: '💼',
      Study: '📚',
      Wellness: '🌸',
      Midday: '☀️',
      General: '⭐'
    }
    return icons[category as keyof typeof icons] || icons.General
  }

  const getDifficultyStars = (level: number) => {
    return '⭐'.repeat(level) + '☆'.repeat(5 - level)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div key={template.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCategoryIcon(template.category)}</span>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
              </div>
              {template.is_featured && (
                <span className="text-yellow-500 text-sm">⭐ Featured</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
              <span className="text-xs text-gray-500">
                {getDifficultyStars(template.difficulty_level)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {template.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{template.estimated_duration}m</div>
                <div className="text-xs text-gray-600">Duration</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{template.steps?.length || 0}</div>
                <div className="text-xs text-gray-600">Steps</div>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-900">{template.times_used}</div>
                <div className="text-xs text-gray-600">Used</div>
              </div>
            </div>

            {/* Steps Preview */}
            {template.steps && template.steps.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Sample steps:</div>
                <div className="space-y-1">
                  {template.steps.slice(0, 3).map((step: any, index: number) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      <span className="truncate">{step.name}</span>
                    </div>
                  ))}
                  {template.steps.length > 3 && (
                    <div className="text-xs text-gray-500 ml-6">
                      +{template.steps.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rating */}
            {template.average_rating > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                <span>Rating: {template.average_rating.toFixed(1)}/5</span>
                <span>{'⭐'.repeat(Math.round(template.average_rating))}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => onUseTemplate(template.id)}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Use This Template'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}