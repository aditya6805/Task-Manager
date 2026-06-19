import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../services/api'
import { useAuthContext } from '../context/AuthContext'

const emptyEditForm = {
  title: '',
  description: '',
  dueDate: '',
  assignedTo: [],
  status: 'Pending',
}

export default function TaskDetail() {
  const { taskId } = useParams()
  const { role, user } = useAuthContext()
  const isAdmin = role === 'admin'

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [submissionLink, setSubmissionLink] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState('Draft')
  const [submissionSaving, setSubmissionSaving] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewingIndex, setReviewingIndex] = useState(null)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetchTask()
  }, [taskId])

  useEffect(() => {
    if (!task || !user?.uid) {
      return
    }

    // Pre-fill user submission form with their latest submission
    const latestSubmission = [...(task.submissions || [])]
      .reverse()
      .find((submission) => submission.submittedBy === user.uid)

    setSubmissionText(latestSubmission?.content || '')
    setSubmissionLink(latestSubmission?.link || '')
    setSubmissionStatus(latestSubmission?.status === 'Submitted' ? 'Submitted' : 'Draft')
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
      status: task.status || 'Pending',
    })
  }, [task, user?.uid])

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/tasks/${taskId}`)
      setTask(response.data.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  const projectMembers = useMemo(() => {
    return task?.project?.memberDetails || task?.assignedToUsers || []
  }, [task])

  const assignedMembers = useMemo(() => {
    if ((task?.assignedToUsers || []).length > 0) {
      return task.assignedToUsers
    }

    return (task?.assignedTo || []).map((memberId) => ({
      firebaseUID: memberId,
      name: memberId,
      email: '',
    }))
  }, [task])

  const currentSubmission = useMemo(
    () => {
      if (!task?.submissions || !user?.uid) return null
      return [...task.submissions].reverse().find((s) => s.submittedBy === user.uid)
    },
    [task?.submissions, user?.uid],
  )

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleAssignee = (memberId) => {
    if (!isAdmin) {
      return
    }

    setEditForm((prev) => {
      const exists = prev.assignedTo.includes(memberId)
      return {
        ...prev,
        assignedTo: exists
          ? prev.assignedTo.filter((id) => id !== memberId)
          : [...prev.assignedTo, memberId],
      }
    })
  }

  const saveSubmission = async (nextStatus) => {
    try {
      setSubmissionSaving(true)
      setError('')
      const response = await apiClient.post(`/tasks/${taskId}/submissions`, {
        content: submissionText,
        link: submissionLink,
        status: nextStatus,
      })
      setTask(response.data.data)
      setSubmissionStatus(nextStatus)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save submission')
    } finally {
      setSubmissionSaving(false)
    }
  }

  const saveTaskChanges = async () => {
    try {
      setEditSaving(true)
      setError('')
      const response = await apiClient.put(`/tasks/${taskId}`, {
        title: editForm.title,
        description: editForm.description,
        dueDate: editForm.dueDate,
        assignedTo: editForm.assignedTo,
        status: editForm.status,
      })
      setTask(response.data.data)
      setIsEditingTask(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task')
    } finally {
      setEditSaving(false)
    }
  }

  const openReview = (index) => {
    setReviewingIndex(index)
    setReviewText('')
  }

  const cancelReview = () => {
    setReviewingIndex(null)
    setReviewText('')
  }

  const saveReview = async (status) => {
    if (reviewingIndex === null || reviewingIndex === undefined) return
    try {
      setReviewSaving(true)
      setError('')
      const response = await apiClient.post(`/tasks/${taskId}/feedback`, {
        comment: reviewText,
        status,
        submissionIndex: reviewingIndex,
      })
      setTask(response.data.data)
      setReviewText('')
      setReviewingIndex(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save review')
    } finally {
      setReviewSaving(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      case 'Changes Requested':
        return 'bg-amber-100 text-amber-700'
      case 'Submitted':
        return 'bg-blue-100 text-blue-700'
      case 'Draft':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading task...</p>
      </div>
    )
  }

  if (!task) {
    return null
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded">
          {error}
        </div>
      )}

      {/* Task Details */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Project:{' '}
              <Link
                to={`/projects/${task.project?._id || task.projectId?._id || task.projectId}`}
                className="text-slate-700 hover:underline"
              >
                {task.project?.title || task.projectId?.title || 'Unknown project'}
              </Link>
            </p>
            <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{task.description || 'No description provided.'}</p>
          </div>
          <Link to="/tasks" className="text-sm text-slate-700 hover:underline">
            Back to Tasks
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium text-gray-800">{task.status}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="font-medium text-gray-800">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Owner</p>
            <p className="font-medium text-gray-800">{task.createdByUser?.name || task.createdByUser?.email || task.createdBy || '-'}</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-500">Assigned Members</p>
            <div className="mt-1 space-y-1">
              {assignedMembers.length > 0 ? (
                assignedMembers.map((member) => (
                  <p key={member.firebaseUID} className="font-medium text-gray-800">
                    {member.name || member.email || member.firebaseUID}
                    {member.email ? ` (${member.email})` : ''}
                  </p>
                ))
              ) : (
                <p className="font-medium text-gray-800">-</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Controls - directly below Task Details (admin only) */}
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Controls</h2>

          {!isEditingTask ? (
            <button
              type="button"
              onClick={() => setIsEditingTask(true)}
              className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition"
            >
              Edit Task
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={editForm.dueDate}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Members</label>
                <div className="border border-gray-300 rounded px-4 py-3 max-h-48 overflow-y-auto space-y-2">
                  {projectMembers.map((member) => {
                    const checked = editForm.assignedTo.includes(member.firebaseUID)
                    return (
                      <label key={member.firebaseUID} className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAssignee(member.firebaseUID)}
                          className="mt-1"
                        />
                        <span>
                          {member.name || member.firebaseUID}
                          {member.email ? ` (${member.email})` : ''}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveTaskChanges}
                  disabled={editSaving}
                  className="px-4 py-2 text-white bg-slate-700 rounded hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Task Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTask(false)}
                  disabled={editSaving}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Submission Area */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Submission</h2>
        <textarea
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          rows="8"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
          placeholder="Write your contribution or progress here..."
        />
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachment Link (optional)</label>
          <input
            type="url"
            value={submissionLink}
            onChange={(e) => setSubmissionLink(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            placeholder="https://github.com/... or any link"
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Submission Status</label>
          <select
            value={submissionStatus}
            onChange={(e) => setSubmissionStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={() => saveSubmission(submissionStatus)}
            disabled={submissionSaving}
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {submissionSaving ? 'Saving...' : 'Save / Update'}
          </button>
          <button
            type="button"
            onClick={() => saveSubmission('Submitted')}
            disabled={submissionSaving}
            className="px-4 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-800 transition disabled:opacity-50"
          >
            Submit Work
          </button>
          <div className="text-xs text-gray-500 self-center">Current status: {submissionStatus}</div>
        </div>
        {currentSubmission && (
          <p className="mt-3 text-xs text-gray-500">
            Last saved: {new Date(currentSubmission.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Submission History */}
      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Submission History</h2>
        <div className="space-y-3">
          {(task.submissions || []).length > 0 ? (
            task.submissions.map((submission, index) => (
              <div key={`submission-${index}`} className="border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Submission #{index + 1} &mdash; {submission.submittedByUser?.name || submission.submittedByUser?.email || submission.submittedBy}
                    </p>
                    <p className="text-xs text-gray-500">
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{submission.content || 'No content.'}</p>
                {submission.link && (
                  <p className="mt-1 text-xs text-blue-600">
                    Link: <a href={submission.link} target="_blank" rel="noopener noreferrer" className="underline">{submission.link}</a>
                  </p>
                )}
                {submission.adminFeedback && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3">
                    <p className="text-xs font-medium text-gray-700">Admin Feedback:</p>
                    <p className="text-xs text-gray-600 mt-1">{submission.adminFeedback}</p>
                  </div>
                )}

                {/* Admin: Review button on each submission */}
                {isAdmin && reviewingIndex !== index && (
                  <button
                    type="button"
                    onClick={() => openReview(index)}
                    className="mt-2 text-xs text-slate-700 hover:underline"
                  >
                    Review Submission
                  </button>
                )}

                {/* Admin: Inline review panel for this specific submission */}
                {isAdmin && reviewingIndex === index && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Reviewing Submission #{index + 1}
                    </h4>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Write review feedback..."
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveReview('Accepted')}
                        disabled={reviewSaving}
                        className="px-3 py-1.5 text-white bg-green-600 rounded text-xs hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => saveReview('Rejected')}
                        disabled={reviewSaving}
                        className="px-3 py-1.5 text-white bg-red-600 rounded text-xs hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => saveReview('Changes Requested')}
                        disabled={reviewSaving}
                        className="px-3 py-1.5 text-white bg-amber-600 rounded text-xs hover:bg-amber-700 transition disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelReview}
                        disabled={reviewSaving}
                        className="px-3 py-1.5 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
