// Sidebar component for navigation
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Sidebar({ isOpen, onClose }) {
    const { logout } = useAuthContext()
    const navigate = useNavigate()

    const handleLogout = async () => {
      try {
        await logout()
        navigate('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const handleNavClick = () => {
      // Close sidebar on mobile after clicking a link
      if (window.innerWidth < 1024) {
        onClose?.()
      }
    }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Task Manager</h2>
        <p className="text-xs text-gray-500">Team Task Manager</p>
      </div>
      <nav className="px-4">
        <ul className="space-y-1">
          <li>
            <Link 
              to="/dashboard" 
              onClick={handleNavClick}
              className="block px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              onClick={handleNavClick}
              className="block px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
            >
              📁 Projects
            </Link>
          </li>
          <li>
            <Link 
              to="/tasks" 
              onClick={handleNavClick}
              className="block px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 transition"
            >
              ✓ Tasks
            </Link>
          </li>
          <li className="pt-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 rounded hover:bg-red-50 transition"
            >
              🚪 Logout
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
