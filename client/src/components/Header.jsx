import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Header() {
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
      <div className="px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">
          Task Manager
        </h1>
        {user && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-slate-700 rounded hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
