import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuthContext()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Team Task Manager</h1>
          {!isAuthenticated && (
            <div className="space-x-3">
              <Link
                to="/login"
                className="inline-block px-6 py-2 text-sm text-slate-700 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-block px-6 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Manage Tasks with Your Team
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            A simple, clean task manager for organizing projects and collaborating with your team members.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-block px-8 py-3 text-white bg-slate-700 rounded hover:bg-slate-800 transition font-medium"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="inline-block px-8 py-3 text-slate-700 border border-gray-300 rounded hover:bg-gray-50 transition font-medium"
            >
              Sign In
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <div className="text-3xl mb-4">✓</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Create & Organize</h3>
              <p className="text-sm text-gray-600">Create projects and tasks to organize your work</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Team Collaboration</h3>
              <p className="text-sm text-gray-600">Assign tasks and collaborate with team members</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">Monitor task status and project completion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 text-center py-6">
        <p className="text-sm text-gray-600">&copy; 2024 Team Task Manager</p>
      </footer>
    </div>
  )
}
