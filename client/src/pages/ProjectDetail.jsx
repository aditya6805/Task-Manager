import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../services/api'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/projects/${projectId}`)
      setProject(response.data.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded">
        {error}
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Project ID: {project.projectId || project._id}</p>
            <h1 className="text-3xl font-bold text-gray-800">{project.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{project.description || 'No description provided.'}</p>
          </div>
          <Link to="/projects" className="text-sm text-slate-700 hover:underline">
            Back to Projects
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Created By</p>
            <p className="font-medium text-gray-800">{project.createdByUser?.name || project.createdByUser?.email || project.createdBy}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Created On</p>
            <p className="font-medium text-gray-800">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Members</p>
            <p className="font-medium text-gray-800">{project.members?.length || 0}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Tasks</p>
            <p className="font-medium text-gray-800">{project.tasks?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Members</h2>
          <div className="space-y-2">
            {(project.memberDetails || []).map((member) => (
              <div key={member.firebaseUID} className="flex items-center justify-between border border-gray-200 rounded px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                {member.firebaseUID === project.createdBy && (
                  <span className="text-xs text-slate-600">Creator</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Progress</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Total Tasks</span>
              <span className="font-semibold">{project.projectStats?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending</span>
              <span className="font-semibold">{project.projectStats?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>In Progress</span>
              <span className="font-semibold">{project.projectStats?.inProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Completed</span>
              <span className="font-semibold">{project.projectStats?.completed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks</h2>
        {project.tasks?.length > 0 ? (
          <div className="space-y-3">
            {project.tasks.map((task) => (
              <Link
                key={task._id}
                to={`/tasks/${task._id}`}
                className="block border border-gray-200 rounded p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.description || 'No description'}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Assigned to: {(task.assignedToUsers || []).length > 0
                        ? task.assignedToUsers
                            .map((member) => member.name || member.email || member.firebaseUID)
                            .join(', ')
                        : '-'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{task.status}</p>
                    <p>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tasks in this project yet.</p>
        )}
      </div>
    </div>
  )
}
