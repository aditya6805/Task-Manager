export default function TaskTable({ tasks, loading, statusDrafts = {}, onStatusChange, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded p-6 sm:p-8 text-center">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded p-6 sm:p-8 text-center">
        <p className="text-gray-500">No tasks yet</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="flex items-start">
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="text-red-500 mr-2">!</span>
                      )}
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.assignedTo?.email || task.assignedToName || task.assignedTo || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <select
                        value={statusDrafts[task._id] ?? task.status}
                        onChange={(e) => onStatusChange?.(task._id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus?.(task._id)}
                        className="px-3 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 transition"
                      >
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {tasks.map((task) => (
          <div key={task._id} className="bg-white border border-gray-200 rounded p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                )}
              </div>
              <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
              <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</span>
              <span>Assigned: {task.assignedTo?.email || task.assignedToName || task.assignedTo || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusDrafts[task._id] ?? task.status}
                onChange={(e) => onStatusChange?.(task._id, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button
                type="button"
                onClick={() => onUpdateStatus?.(task._id)}
                className="px-3 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 transition"
              >
                Update
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
