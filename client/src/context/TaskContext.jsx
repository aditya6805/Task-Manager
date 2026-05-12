// Task context for global state management
// Usage: wrap your app with TaskProvider and use useTaskContext hook

import React, { createContext, useContext, useState } from 'react'

const TaskContext = createContext()

export const useTaskContext = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider')
  }
  return context
}

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const value = {
    tasks,
    setTasks,
    loading,
    setLoading,
    error,
    setError,
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}
