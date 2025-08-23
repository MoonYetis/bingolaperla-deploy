// Complete user flow test for PLAY button functionality
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGetGamesQuery } from '@/services/gameApi'

export const UserFlowTest = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const { data: gamesData, isLoading, error } = useGetGamesQuery(undefined)
  const [testLog, setTestLog] = useState<string[]>([])

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestLog(prev => [...prev.slice(-10), `${timestamp}: ${message}`])
    console.log(`[USER-FLOW-TEST] ${message}`)
  }

  useEffect(() => {
    log(`🔍 Current route: ${location.pathname}`)
    log(`🔐 Authenticated: ${isAuthenticated}`)
    log(`👤 User: ${user?.username || 'none'}`)
    log(`💎 Balance: ${user?.pearlsBalance || 0} Perlas`)
  }, [location.pathname, isAuthenticated, user])

  useEffect(() => {
    if (gamesData) {
      log(`🎮 Games loaded: ${gamesData.games?.length || 0} games available`)
      const openGames = gamesData.games?.filter(g => g.status === 'OPEN') || []
      log(`🎯 Open games: ${openGames.length}`)
    }
    if (error) {
      log(`❌ Games API error: ${JSON.stringify(error)}`)
    }
  }, [gamesData, error])

  const testPlayFlow = () => {
    log(`🎮 Testing PLAY button flow...`)
    log(`📍 Starting from: ${location.pathname}`)
    
    try {
      navigate('/dashboard')
      log(`✅ navigate('/dashboard') executed`)
    } catch (err) {
      log(`❌ Navigation error: ${err}`)
    }
  }

  const testManualNavigation = (path: string) => {
    log(`🔧 Manual navigation to ${path}`)
    navigate(path)
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-0 left-0 bg-blue-900 text-white p-4 max-w-lg z-50 max-h-screen overflow-y-auto">
      <div className="text-xs">
        <h3 className="font-bold mb-2">🧪 USER FLOW TEST</h3>
        
        <div className="mb-3 space-y-1">
          <div>Route: <span className="text-yellow-300">{location.pathname}</span></div>
          <div>Auth: <span className={isAuthenticated ? "text-green-300" : "text-red-300"}>
            {isAuthenticated ? '✅' : '❌'}
          </span></div>
          <div>User: <span className="text-blue-300">{user?.username || 'none'}</span></div>
          <div>Balance: <span className="text-green-300">{user?.pearlsBalance || 0} Perlas</span></div>
        </div>

        <div className="mb-3 space-y-1">
          <div>Games Loading: {isLoading ? '⏳' : '✅'}</div>
          <div>Games Count: {gamesData?.games?.length || 0}</div>
          <div>Open Games: {gamesData?.games?.filter(g => g.status === 'OPEN')?.length || 0}</div>
        </div>

        <div className="space-y-1 mb-3">
          <button 
            onClick={testPlayFlow}
            className="w-full text-xs bg-green-600 px-2 py-1 rounded"
          >
            🎯 Test PLAY Flow
          </button>
          <button 
            onClick={() => testManualNavigation('/menu')}
            className="w-full text-xs bg-blue-600 px-2 py-1 rounded"
          >
            🏠 Go to Menu
          </button>
          <button 
            onClick={() => testManualNavigation('/dashboard')}
            className="w-full text-xs bg-purple-600 px-2 py-1 rounded"
          >
            🎮 Go to Dashboard
          </button>
        </div>

        <div className="text-xs max-h-32 overflow-y-auto bg-black bg-opacity-50 p-2 rounded">
          {testLog.map((log, i) => (
            <div key={i} className="mb-1 break-words">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserFlowTest