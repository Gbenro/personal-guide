interface TodaysBeliefWorkProps {
  pendingWork: any[]
  completedWork: any[]
  completionRate: number
}

export function TodaysBeliefWork({ pendingWork, completedWork, completionRate }: TodaysBeliefWorkProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today's Belief Work</h3>
        <span className="text-sm text-gray-600">{Math.round(completionRate)}% complete</span>
      </div>

      <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Work */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Pending ({pendingWork.length})</h4>
          {pendingWork.length > 0 ? (
            <div className="space-y-2">
              {pendingWork.slice(0, 3).map((work, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="font-medium text-sm text-gray-900">{work.cycle.title}</div>
                  <div className="text-xs text-gray-600">Day {work.cycle.current_day} • {work.activity?.completion_percentage || 0}% complete</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">All caught up! 🎉</div>
          )}
        </div>

        {/* Completed Work */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Completed ({completedWork.length})</h4>
          {completedWork.length > 0 ? (
            <div className="space-y-2">
              {completedWork.slice(0, 3).map((work, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-medium text-sm text-green-900">{work.cycle.title}</div>
                  <div className="text-xs text-green-600">Day {work.cycle.current_day} • Complete ✅</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No work completed today yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}