// Código temporal para debuggear el problema de redirección

// VERSIÓN ORIGINAL del LoginPage useEffect:
/*
useEffect(() => {
  if (isAuthenticated) {
    navigate('/menu')
  }
}, [isAuthenticated, navigate])
*/

// VERSIÓN CON DEBUGGING:
/*
useEffect(() => {
  console.log('[LOGIN-EFFECT] useEffect triggered');
  console.log('[LOGIN-EFFECT] isAuthenticated:', isAuthenticated);
  console.log('[LOGIN-EFFECT] current path:', window.location.pathname);
  
  if (isAuthenticated) {
    console.log('[LOGIN-EFFECT] Navigating to /menu');
    navigate('/menu')
  }
}, [isAuthenticated, navigate])
*/

// VERSIÓN CONDICIONAL (solo en login):
/*
useEffect(() => {
  console.log('[LOGIN-EFFECT] useEffect triggered');
  console.log('[LOGIN-EFFECT] isAuthenticated:', isAuthenticated);
  console.log('[LOGIN-EFFECT] current path:', window.location.pathname);
  
  if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/')) {
    console.log('[LOGIN-EFFECT] Navigating to /menu from login page');
    navigate('/menu')
  } else if (isAuthenticated) {
    console.log('[LOGIN-EFFECT] Already authenticated but not on login page - not redirecting');
  }
}, [isAuthenticated, navigate])
*/