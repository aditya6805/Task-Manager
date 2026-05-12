// Tasks page
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../services/api'
import TaskForm from '../components/TaskForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuthContext } from '../context/AuthContext'

export default function Tasks() {
  const { role, user } = useAuthContext()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    if (role === 'admin') {
      fetchProjects()
    }
  }, [statusFilter, role])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      let url = '/tasks'
      if (statusFilter) {
        url += `?status=${statusFilter}`
      }
      const response = await apiClient.get(url)
      setTasks(response.data.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks')
      console.error('Tasks fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects')
      setProjects(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const handleCreateClick = () => {
    setEditingTask(null)
    setShowForm(true)
    setFormError('')
  }

  const handleEditClick = (task) => {
    setEditingTask(task)
    setShowForm(true)
    setFormError('')
  }

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true)
      setFormError('')

      if (editingTask) {
        await apiClient.put(`/tasks/${editingTask._id}`, formData)
      } else {
        await apiClient.post('/tasks', formData)
      }

      setShowForm(false)
      setEditingTask(null)
      await fetchTasks()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save task')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTask(null)
    setFormError('')
  }

  const handleDeleteClick = (task) => {
    setDeleteConfirm(task)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setDeleteLoading(true)
      await apiClient.delete(`/tasks/${deleteConfirm._id}`)
      setDeleteConfirm(null)
      await fetchTasks()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, { status: newStatus })
      const updatedTask = response.data?.data

      if (updatedTask?._id) {
        setTasks((prev) => prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)))
      } else {
        await fetchTasks()
      }

      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>
        {role === 'admin' && (
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition text-sm font-medium"
          >
            Create Task
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create/Edit Task Form */}
      {role === 'admin' && showForm && (
        <div className="bg-white border border-gray-200 rounded p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <TaskForm
            task={editingTask}
            projects={projects}
            currentUserUid={user?.uid || ''}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={formLoading}
            error={formError}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
        >
          <option value="">All Tasks</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-12 text-center">
          <p className="text-gray-500">
            {statusFilter ? 'No tasks found with this status.' : 'No tasks assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Project
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Creator
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned To
                </th>
                {role === 'admin' && (
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={task._id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <Link to={`/tasks/${task._id}`} className="font-medium text-slate-700 hover:underline">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="mt-1 text-xs text-gray-500">{task.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${getStatusColor(
                        task.status
                      )}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.dueDate ? (
                      <span
                        className={
                          isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''
                        }
                      >
                        {new Date(task.dueDate).toLocaleDateString()}
                        {isOverdue(task.dueDate) && ' (Overdue)'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <Link to={`/projects/${task.projectId?._id || task.projectId}`} className="hover:underline text-slate-700">
                      {task.projectId?.title || 'Unknown'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.createdByUser?.name || task.createdByUser?.email || task.createdBy || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(task.assignedToUsers || []).length > 0
                      ? task.assignedToUsers
                          .map((member) => member.name || member.email || member.firebaseUID)
                          .join(', ')
                      : '-'}
                  </td>
                  {role === 'admin' && (
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="px-2 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        isLoading={deleteLoading}
        isDangerous
      />
    </div>
  )
}
