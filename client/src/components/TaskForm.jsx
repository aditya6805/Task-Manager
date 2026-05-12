import { useState, useEffect } from 'react'
import apiClient from '../services/api'

export default function TaskForm({
  task,
  projects = [],
  currentUserUid = '',
  onSubmit,
  onCancel,
  loading = false,
  error = '',
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [],
    status: 'Pending',
    dueDate: '',
  })
  const [projectMembers, setProjectMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId?._id || task.projectId || '',
        assignedTo: Array.isArray(task.assignedTo)
          ? [...new Set([currentUserUid, ...task.assignedTo].filter(Boolean))]
          : task.assignedTo
            ? [...new Set([currentUserUid, task.assignedTo].filter(Boolean))]
            : [currentUserUid].filter(Boolean),
        status: task.status || 'Pending',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      })
    } else if (currentUserUid) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: prev.assignedTo.includes(currentUserUid)
          ? prev.assignedTo
          : [...prev.assignedTo, currentUserUid],
      }))
    }
  }, [task, currentUserUid])

  // Fetch project members when project is selected
  useEffect(() => {
    if (formData.projectId) {
      fetchProjectMembers()
    } else {
      setProjectMembers([])
    }
  }, [formData.projectId])

  const fetchProjectMembers = async () => {
    try {
      setLoadingMembers(true)
      const response = await apiClient.get(`/projects/${formData.projectId}`)
      const project = response.data.data
      if (project && project.memberDetails) {
        setProjectMembers(project.memberDetails)
      } else if (project && project.members) {
        setProjectMembers(project.members.map((memberId) => ({ firebaseUID: memberId, name: memberId, email: '' })))
      }

      if (currentUserUid) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: prev.assignedTo.includes(currentUserUid)
            ? prev.assignedTo
            : [...prev.assignedTo, currentUserUid],
        }))
      }
    } catch (err) {
      console.error('Failed to fetch project members:', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'projectId' && { assignedTo: [] }),
    }))
  }

  const toggleAssignee = (memberId) => {
    if (memberId === currentUserUid) {
      return
    }

    setFormData((prev) => {
      const exists = prev.assignedTo.includes(memberId)
      return {
        ...prev,
        assignedTo: exists
          ? prev.assignedTo.filter((id) => id !== memberId)
          : [...prev.assignedTo, memberId],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      return
    }
    if (!formData.projectId) {
      return
    }
    if (!formData.assignedTo.length) {
      return
    }
    onSubmit({
      ...formData,
      assignedTo: [...new Set([currentUserUid, ...formData.assignedTo].filter(Boolean))],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          disabled={loading}
          placeholder="Enter task title"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={loading}
          placeholder="Enter task description"
          rows="2"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project *
        </label>
        <select
          name="projectId"
          value={formData.projectId}
          onChange={handleChange}
          disabled={loading || task}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
          required
        >
          <option value="">Select a project</option>
          {projects.map((proj) => (
            <option key={proj._id} value={proj._id}>
              {proj.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign To *
        </label>
        <div className="border border-gray-300 rounded px-4 py-3 max-h-48 overflow-y-auto space-y-2">
          {loadingMembers ? (
            <p className="text-sm text-gray-500">Loading members...</p>
          ) : !formData.projectId ? (
            <p className="text-sm text-gray-500">Select a project first.</p>
          ) : projectMembers.length === 0 ? (
            <p className="text-sm text-gray-500">No project members found.</p>
          ) : (
            projectMembers.map((member) => {
              const checked = member.firebaseUID === currentUserUid || formData.assignedTo.includes(member.firebaseUID)
              return (
                <label key={member.firebaseUID} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAssignee(member.firebaseUID)}
                    disabled={loading || member.firebaseUID === currentUserUid}
                    className="mt-1"
                  />
                  <span>
                    {member.name || member.firebaseUID}
                    {member.email ? ` (${member.email})` : ''}
                    {member.firebaseUID === currentUserUid && ' (creator/admin, auto included)'}
                  </span>
                </label>
              )
            })
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">Only members of the selected project are shown.</p>
      </div>

      {task && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <input
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition disabled:opacity-50 text-sm font-medium"
        >
          {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
