# Configuración PWA - Bingo Online 75

## ✅ Características PWA Implementadas

### 1. Manifest.json
- Configuración completa con metadata de la aplicación
- Íconos en múltiples resoluciones (72x72 hasta 512x512)
- Shortcuts para acceso rápido
- Soporte para screenshots

### 2. Service Worker
- Configurado automáticamente con Vite PWA Plugin
- Cache automático de assets estáticos
- Estrategia NetworkFirst para APIs
- Actualización automática de la app

### 3. Instalación
- Hook personalizado `usePWA` para detectar capacidad de instalación
- Componente `PWAInstallPrompt` para mostrar botón de instalación
- Manejo del evento `beforeinstallprompt`
- Detección de app ya instalada

## 🚀 Funcionalidades

### Para Usuarios
- **Instalación nativa**: Botón "Instalar App" aparece automáticamente
- **Acceso offline**: Assets básicos funcionan sin internet
- **Inicio rápido**: Shortcuts desde el ícono de la app
- **Experiencia nativa**: Funciona como app nativa en móviles

### Para Desarrolladores
- **Hook usePWA**: Fácil integración de funcionalidades PWA
- **Componente reutilizable**: PWAInstallPrompt se puede usar en cualquier parte
- **Configuración automática**: Vite maneja el service worker automáticamente

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Edge (Android/Desktop)
- ✅ Safari (iOS/macOS) - limitado
- ✅ Firefox - limitado
- ⚠️ Internet Explorer - no soportado

### Características por Plataforma
- **Android**: Instalación completa, shortcuts, notificaciones
- **iOS**: Instalación vía "Agregar a Inicio", funcionalidad limitada
- **Desktop**: Instalación en Chrome/Edge, ventana independiente

## 🔧 Configuración Adicional

### Íconos
Los íconos PWA deben ser creados en las siguientes resoluciones:
- 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192 (requerido), 384x384, 512x512 (requerido)

### Screenshots (Opcional)
Para mejor experiencia en app stores:
- Mobile: 390x844 (narrow form factor)
- Desktop: 1920x1080 (wide form factor)

### Personalización
Editar `vite.config.ts` para ajustar:
- Colores del tema
- Estrategias de cache
- Archivos a cachear
- Configuración del manifest

## 📋 TODO Futuro

- [ ] Crear íconos reales (actualmente son placeholders)
- [ ] Agregar screenshots de la aplicación
- [ ] Implementar notificaciones push
- [ ] Cache más inteligente para el juego en vivo
- [ ] Sincronización en background
- [ ] Modo offline completo para ciertas funciones