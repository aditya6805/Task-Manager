import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Hamburger button - visible on mobile/tablet */}
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded text-gray-600 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Task Manager
          </h1>
        </div>
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[150px] md:max-w-none">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
