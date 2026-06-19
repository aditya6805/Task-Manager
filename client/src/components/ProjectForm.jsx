import { useState, useEffect } from 'react'

export default function ProjectForm({
  project,
  allUsers = [],
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
    members: [],
  })

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        projectId: project.projectId || '',
        members: Array.isArray(project.members) ? project.members.filter(Boolean) : [],
      })
    } else {
      setFormData({
        title: '',
        description: '',
        projectId: '',
        members: [],
      })
    }
  }, [project])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleMember = (memberId) => {
    if (memberId === currentUserUid) {
      return
    }

    setFormData((prev) => {
      const exists = prev.members.includes(memberId)
      return {
        ...prev,
        members: exists
          ? prev.members.filter((id) => id !== memberId)
          : [...prev.members, memberId],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const title = formData.title.trim()
    const projectId = formData.projectId.trim()

    if (!title || !projectId) {
      return
    }
    onSubmit({
      title,
      description: formData.description.trim(),
      projectId,
      members: formData.members.filter((memberId) => memberId !== currentUserUid),
    })
  }

  const selectableUsers = allUsers

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
          placeholder="Enter project title"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
          placeholder="Enter project description"
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project ID *
        </label>
        <input
          type="text"
          name="projectId"
          value={formData.projectId}
          onChange={handleChange}
          disabled={loading}
          placeholder="Example: ANIM-001"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Members
        </label>
        <div className="border border-gray-300 rounded px-4 py-3 max-h-48 overflow-y-auto space-y-2">
          {selectableUsers.length > 0 ? (
            selectableUsers.map((user) => {
              const checked = user.firebaseUID === currentUserUid || formData.members.includes(user.firebaseUID)
              return (
                <label key={user.firebaseUID} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(user.firebaseUID)}
                    disabled={loading || user.firebaseUID === currentUserUid}
                    className="mt-1"
                  />
                  <span>
                    {user.name} ({user.email})
                    {user.firebaseUID === currentUserUid && ' (creator, auto included)'}
                  </span>
                </label>
              )
            })
          ) : (
            <p className="text-sm text-gray-500">No users available.</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">Creator is automatically included. Select only the members you want on the project.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
