import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuthContext } from '../context/AuthContext'

export default function Projects() {
  const { role, user } = useAuthContext()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [managingMembers, setManagingMembers] = useState(null)
  const [newMemberId, setNewMemberId] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    fetchProjects()
    if (role === 'admin') {
      fetchAllUsers()
    }
  }, [role])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/projects')
      setProjects(response.data.data || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects')
      console.error('Projects fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await apiClient.get('/users')
      setAllUsers(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    }
  }

  const handleCreateClick = () => {
    setEditingProject(null)
    setShowForm(true)
    setFormError('')
  }

  const handleEditClick = (project) => {
    setEditingProject(project)
    setShowForm(true)
    setFormError('')
  }

  const handleOpenProject = (project) => {
    navigate(`/projects/${project._id}`)
  }

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true)
      setFormError('')

      if (editingProject) {
        await apiClient.put(`/projects/${editingProject._id}`, formData)
      } else {
        await apiClient.post('/projects', formData)
      }

      setShowForm(false)
      setEditingProject(null)
      await fetchProjects()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save project')
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProject(null)
    setFormError('')
  }

  const handleDeleteClick = (project) => {
    setDeleteConfirm(project)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      setDeleteLoading(true)
      await apiClient.delete(`/projects/${deleteConfirm._id}`)
      setDeleteConfirm(null)
      await fetchProjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleManageMembersClick = (project) => {
    setManagingMembers(project)
    setNewMemberId('')
    setFormError('')
  }

  const handleAddMember = async () => {
    if (!newMemberId || !managingMembers) {
      setFormError('Please select a member')
      return
    }

    try {
      setMemberLoading(true)
      setFormError('')
      await apiClient.post(`/projects/${managingMembers._id}/members`, {
        memberId: newMemberId,
      })
      setNewMemberId('')
      await fetchProjects()
      // Refresh the managing members project
      const updated = projects.find((p) => p._id === managingMembers._id)
      if (updated) {
        setManagingMembers(updated)
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setMemberLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!managingMembers) return

    try {
      setMemberLoading(true)
      await apiClient.delete(
        `/projects/${managingMembers._id}/members/${memberId}`
      )
      await fetchProjects()
      // Refresh the managing members project
      const updated = projects.find((p) => p._id === managingMembers._id)
      if (updated) {
        setManagingMembers(updated)
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to remove member')
    } finally {
      setMemberLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Projects</h1>
        {role === 'admin' && (
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition text-sm font-medium"
          >
            New Project
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 sm:px-6 py-4 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Create/Edit Project Form */}
      {role === 'admin' && showForm && (
        <div className="bg-white border border-gray-200 rounded p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h2>
          <ProjectForm
            project={editingProject}
            allUsers={allUsers}
            currentUserUid={user?.uid || ''}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={formLoading}
            error={formError}
          />
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-12 text-center">
          <p className="text-gray-500">
            No projects yet. {role === 'admin' ? 'Create your first project!' : 'Wait for admin to create projects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onManageMembers={handleManageMembersClick}
              onOpen={handleOpenProject}
            />
          ))}
        </div>
      )}

      {/* Manage Members Modal */}
      {managingMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Members - {managingMembers.title}
            </h2>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            {/* Add Member */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Member
              </label>
              <div className="flex gap-2">
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  disabled={memberLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500 disabled:bg-gray-50"
                >
                  <option value="">Select user</option>
                  {allUsers.map((user) => (
                    <option key={user.firebaseUID} value={user.firebaseUID}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={memberLoading || !newMemberId}
                  className="px-3 py-2 text-white bg-slate-700 rounded text-sm hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Members */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Current Members</h3>
              <div className="space-y-2">
                {managingMembers.members.map((memberId) => {
                  const member = allUsers.find((u) => u.firebaseUID === memberId)
                  const isCreator = memberId === managingMembers.createdBy
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span className="text-sm text-gray-800">
                        {member?.name || member?.email || memberId}
                        {isCreator && (
                          <span className="ml-2 text-xs text-gray-500">(Creator)</span>
                        )}
                      </span>
                      {!isCreator && (
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          disabled={memberLoading}
                          className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setManagingMembers(null)}
              disabled={memberLoading}
              className="w-full mt-6 px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Project"
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
