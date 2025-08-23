import { useState, useCallback, useEffect } from 'react'

type SetValue<T> = T | ((val: T) => T)

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // Estado para almacenar nuestro valor
  // Pasamos una función de estado inicial a useState para que la lógica solo se ejecute una vez
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      // Obtener del localStorage por clave
      const item = window.localStorage.getItem(key)
      // Parse JSON almacenado o devolver initialValue si no existe
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Si error, devolver initialValue
      console.error(`Error al leer localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Devolver una versión envuelta de la función setter de useState que persiste
  // el nuevo valor en localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Permitir que value sea una función para que tengamos la misma API que useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Guardar el estado
        setStoredValue(valueToStore)
        
        // Guardar en localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        // Una implementación más avanzada manejaría el caso de error
        console.error(`Error al escribir localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Función para eliminar el valor del localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error al eliminar localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Escuchar cambios en localStorage de otras pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error al parsear localStorage para key "${key}":`, error)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage