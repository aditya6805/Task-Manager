// Dashboard page
import { useState, useEffect } from 'react'
import apiClient from '../services/api'
import DashboardStatCard from '../components/DashboardStatCard'
import { useAuthContext } from '../context/AuthContext'

export default function Dashboard() {
  const { role } = useAuthContext()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/dashboard')
      setDashboard(response.data.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-500">Loading dashboard...</p></div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded">{error}</div>
  }

  if (!dashboard) {
    return <div className="text-center py-12"><p className="text-gray-500">No data available</p></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <span className="text-sm text-gray-600 capitalize">Role: {role}</span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatCard title="Total Tasks" value={dashboard.stats?.totalTasks || 0} icon="📋" color="blue" />
        <DashboardStatCard title="Completed" value={dashboard.stats?.completedTasks || 0} icon="✓" color="green" />
        <DashboardStatCard title="Pending" value={dashboard.stats?.pendingTasks || 0} icon="⏳" color="amber" />
        <DashboardStatCard title="Overdue" value={dashboard.stats?.overdueTasks || 0} icon="!" color="red" />
      </div>

      {/* Tasks by Status and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            {Object.entries(dashboard.tasksByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-gray-600">{status}</span>
                <span className="text-2xl font-bold text-gray-800">{count}</span>
              </div>
            ))}
            {Object.keys(dashboard.tasksByStatus || {}).length === 0 && (
              <p className="text-sm text-gray-500">No task status data yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects Overview</h2>
          {(dashboard.projects || []).length > 0 ? (
            <div className="space-y-3">
              {(dashboard.projects || []).slice(0, 5).map((project) => (
                <div key={project._id} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                  <div><p className="font-medium text-gray-800">{project.title}</p><p className="text-xs text-gray-500">{project.taskCount} tasks</p></div>
                  <span className="text-sm text-gray-600">{project.members?.length || 0} members</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No projects yet</p>
          )}
        </div>
      </div>

      {/* Overdue Tasks */}
      {dashboard.overdueTasks && dashboard.overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">⚠️ Overdue Tasks ({dashboard.overdueTasks.length})</h2>
          <div className="space-y-2">
            {dashboard.overdueTasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between p-2 bg-white rounded border border-red-100">
                <div><p className="font-medium text-gray-800">{task.title}</p><p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p></div>
                <span className="text-xs font-medium text-red-600">Overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
