import { useLocation } from 'react-router-dom'
import PWAInstallPrompt from './PWAInstallPrompt'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  
  // Páginas simplificadas sin navbar/footer - ahora todas las páginas son full-screen
  const simplifiedPages = ['/login', '/register', '/dashboard', '/game']
  const shouldHideNavbar = simplifiedPages.some(page => location.pathname.startsWith(page))

  if (shouldHideNavbar) {
    return (
      <>
        {children}
        <PWAInstallPrompt />
      </>
    )
  }

  // Fallback para rutas no cubiertas (como 404)
  return (
    <div className="min-h-screen">
      {children}
      <PWAInstallPrompt />
    </div>
  )
}

export default Layout