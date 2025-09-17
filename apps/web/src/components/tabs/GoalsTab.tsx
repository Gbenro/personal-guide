'use client'

export default function GoalsTab() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎯 Goals & Aspirations
          </h1>
          <p className="text-gray-600 mt-2">
            Track your progress towards meaningful objectives
          </p>
        </div>

        {/* Goals Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Goals Summary */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
            <div className="text-4xl font-bold mb-2">5/8</div>
            <div className="text-sm opacity-90">⬆️ 2 completed this month</div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <div className="text-sm opacity-80">On Track</div>
                <div className="text-xl font-semibold">4</div>
              </div>
              <div>
                <div className="text-sm opacity-80">Behind</div>
                <div className="text-xl font-semibold">1</div>
              </div>
            </div>
          </div>

          {/* Goal Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">📊 Categories</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">💼 Career</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  2 goals
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">🏃‍♀️ Health</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  3 goals
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">🎓 Learning</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  2 goals
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">👨‍👩‍👧‍👦 Personal</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  1 goal
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">📈 This Month</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Goals Started</span>
                <span className="font-bold text-green-500">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Goals Completed</span>
                <span className="font-bold text-blue-500">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Milestones Hit</span>
                <span className="font-bold text-purple-500">8</span>
              </div>
            </div>

            <div className="mt-4 p-2 bg-green-50 rounded border-l-4 border-green-400">
              <p className="text-xs text-green-800">
                🎉 You're ahead of last month's pace by 25%!
              </p>
            </div>
          </div>
        </div>

        {/* Current Goals */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🎯 Current Goals</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Add Goal
            </button>
          </div>

          <div className="space-y-4">
            {/* Goal Item 1 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-semibold text-gray-900">🏃‍♀️ Run 5K under 25 minutes</h3>
                </div>
                <span className="text-sm text-gray-500">Due: Dec 31, 2024</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current best: 26:30</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  On Track
                </span>
              </div>
            </div>

            {/* Goal Item 2 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h3 className="font-semibold text-gray-900">💼 Complete TypeScript Certification</h3>
                </div>
                <span className="text-sm text-gray-500">Due: Nov 15, 2024</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">3 of 8 modules complete</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Behind
                </span>
              </div>
            </div>

            {/* Goal Item 3 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h3 className="font-semibold text-gray-900">📚 Read 24 books this year</h3>
                </div>
                <span className="text-sm text-gray-500">Due: Dec 31, 2024</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>83%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '83%'}}></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">20 of 24 books complete</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Ahead
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Achievements */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">🏆 Recent Achievements</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-green-900">Marathon Training Goal</p>
                    <p className="text-sm text-green-700">Completed first 10K run</p>
                  </div>
                  <span className="text-xs text-green-600">2 days ago</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-blue-900">Language Learning</p>
                    <p className="text-sm text-blue-700">Reached 100-day streak</p>
                  </div>
                  <span className="text-xs text-blue-600">1 week ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 AI Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 Consider breaking your TypeScript goal into weekly milestones to get back on track.
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  📈 Your reading pace is excellent! Consider setting a stretch goal for next year.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}