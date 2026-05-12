import { useAuthContext } from '../context/AuthContext'

export default function ProjectCard({
  project,
  onEdit,
  onDelete,
  onManageMembers,
  onOpen,
}) {
  const { role } = useAuthContext()
  const isAdmin = role === 'admin'

  return (
    <div
      className="bg-white border border-gray-200 rounded p-6 hover:shadow-md transition cursor-pointer"
      onClick={() => onOpen?.(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onOpen?.(project)
        }
      }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.title}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {project.description || 'No description'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>{project.projectId || 'Project ID pending'}</p>
          <p>{project.members?.length || 0} members</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={(event) => {
                event.stopPropagation()
                onEdit(project)
              }}
              className="px-2 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition"
              title="Edit project"
              type="button"
            >
              Edit
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onManageMembers(project)
              }}
              className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition"
              title="Manage members"
              type="button"
            >
              Members
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation()
                onDelete(project)
              }}
              className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition"
              title="Delete project"
              type="button"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
