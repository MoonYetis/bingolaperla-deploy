import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseBingoSocketOptions {
  gameId?: string
  isAdmin?: boolean
}

interface BingoSocketEvents {
  'number-called': (data: { number: number; gameId: string }) => void
  'game-reset': (data: { gameId: string }) => void
  'game-status-changed': (data: { status: 'active' | 'paused'; gameId: string }) => void
  'pattern-changed': (data: { pattern: string; gameId: string }) => void
  'player-claim-bingo': (data: { pattern: string; userId: string; gameId: string }) => void
}

export const useBingoSocket = (options: UseBingoSocketOptions = {}) => {
  const { gameId = 'default-game', isAdmin = false } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Crear conexión Socket.IO
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    // Event listeners para conexión
    socket.on('connect', () => {
      console.log('🔌 Socket.IO conectado:', socket.id)
      setIsConnected(true)
      setError(null)

      // Unirse a sala del juego
      socket.emit('join-game-room', gameId)
      console.log(`🎮 Unido a sala del juego: ${gameId}`)

      // Si es admin, también unirse a sala de admin
      if (isAdmin) {
        socket.emit('join-admin-room', gameId)
        console.log(`👨‍💼 Unido a sala de admin: ${gameId}`)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO desconectado:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error)
      setError(error.message)
      setIsConnected(false)
    })

    // Cleanup al desmontar
    return () => {
      if (socket) {
        console.log('🔌 Desconectando Socket.IO...')
        socket.disconnect()
      }
    }
  }, [gameId, isAdmin])

  // Función para emitir eventos
  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
      console.log(`📤 Evento emitido: ${event}`, data)
    } else {
      console.warn('⚠️ Socket no conectado, no se puede emitir evento:', event)
    }
  }

  // Función para escuchar eventos
  const on = <K extends keyof BingoSocketEvents>(event: K, callback: BingoSocketEvents[K]) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
      console.log(`👂 Escuchando evento: ${event}`)
    }
  }

  // Función para dejar de escuchar eventos
  const off = <K extends keyof BingoSocketEvents>(event: K, callback?: BingoSocketEvents[K]) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
      console.log(`🔇 Dejando de escuchar evento: ${event}`)
    }
  }

  // Funciones específicas para admin
  const adminCallNumber = (number: number) => {
    if (!isAdmin) {
      console.warn('⚠️ Solo admins pueden cantar números')
      return
    }
    emit('admin-call-number', { number, gameId })
  }

  const adminResetGame = () => {
    if (!isAdmin) {
      console.warn('⚠️ Solo admins pueden reiniciar juegos')
      return
    }
    emit('admin-reset-game', { gameId })
  }

  const adminTogileGame = (status: 'active' | 'paused') => {
    if (!isAdmin) {
      console.warn('⚠️ Solo admins pueden pausar/reanudar juegos')
      return
    }
    emit('admin-toggle-game', { gameId, status })
  }

  const adminSetPattern = (pattern: string) => {
    if (!isAdmin) {
      console.warn('⚠️ Solo admins pueden cambiar patrones')
      return
    }
    emit('admin-set-pattern', { pattern, gameId })
  }

  const playerClaimBingo = (pattern: string, userId: string) => {
    emit('player-claim-bingo', { pattern, userId, gameId })
  }

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
    // Funciones específicas
    adminCallNumber,
    adminResetGame,
    adminTogileGame,
    adminSetPattern,
    playerClaimBingo,
  }
}