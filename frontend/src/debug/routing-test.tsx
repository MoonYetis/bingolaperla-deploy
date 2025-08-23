// Quick routing test component to verify navigation works
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

export const RoutingTestComponent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [navigationLog, setNavigationLog] = useState<string[]>([])
  
  const testNavigation = (path: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setNavigationLog(prev => [...prev, `${timestamp}: Attempting navigation to ${path}`])
    
    try {
      navigate(path)
      setNavigationLog(prev => [...prev, `${timestamp}: navigate() called successfully`])
    } catch (error) {
      setNavigationLog(prev => [...prev, `${timestamp}: ERROR: ${error}`])
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-0 right-0 bg-black bg-opacity-90 text-white p-4 max-w-sm z-50">
      <h3 className="text-sm font-bold mb-2">🔍 Routing Debug</h3>
      <p className="text-xs mb-2">Current: {location.pathname}</p>
      
      <div className="space-y-1 mb-3">
        <button 
          onClick={() => testNavigation('/dashboard')}
          className="w-full text-xs bg-blue-600 px-2 py-1 rounded"
        >
          Test /dashboard
        </button>
        <button 
          onClick={() => testNavigation('/menu')}
          className="w-full text-xs bg-green-600 px-2 py-1 rounded"
        >
          Test /menu
        </button>
      </div>
      
      <div className="max-h-32 overflow-y-auto text-xs">
        {navigationLog.slice(-5).map((log, i) => (
          <div key={i} className="mb-1 break-words">{log}</div>
        ))}
      </div>
    </div>
  )
}

export default RoutingTestComponent