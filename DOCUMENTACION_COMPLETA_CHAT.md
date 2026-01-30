# CHACTIVO - Documentación Completa del Chat Gay

## Resumen Ejecutivo

Chactivo es una plataforma de chat en tiempo real diseñada exclusivamente para la comunidad LGBTQ+, con enfoque en seguridad, privacidad y engagement. Construida con React + Firebase, ofrece una experiencia moderna con PWA, sistema de IA y múltiples funcionalidades sociales.

---

## 1. BENEFICIOS PRINCIPALES DE LA PLATAFORMA

### Para la Comunidad LGBTQ+
- **Espacio Seguro**: Moderación activa y sistema de sanciones para mantener un ambiente respetuoso
- **Verificación de Edad**: Solo mayores de 18 años, garantizando interacciones maduras
- **Anonimato Opcional**: Participar como invitado sin revelar identidad
- **Múltiples Identidades**: Soporte para diversas orientaciones sexuales y géneros
- **Comunidad Regional**: Salas específicas por país (Chile, España, Brasil, México, Argentina)

### Tecnológicos
- **Chat en Tiempo Real**: Mensajes instantáneos con Firebase
- **PWA (App Instalable)**: Funciona como app nativa en móvil y escritorio
- **Rendimiento Optimizado**: Carga rápida con code splitting (80% reducción de bundle)
- **Multiplataforma**: Web, móvil y PWA desde una sola base de código
- **Escalable**: Soporta 4,000+ usuarios diarios en tier gratuito de Firebase

### De Usuario
- **Sin Registro Obligatorio**: Probar antes de registrarse (modo invitado)
- **Interfaz Moderna**: Diseño glassmorphism con animaciones suaves
- **Modo Oscuro/Claro**: Personalización visual completa
- **Notificaciones**: Alertas en tiempo real de mensajes y actividad

---

## 2. FUNCIONALIDADES DEL CHAT PRINCIPAL

### 2.1 Mensajería en Tiempo Real
| Función | Descripción |
|---------|-------------|
| **Mensajes Instantáneos** | Sincronización en tiempo real via Firebase |
| **Indicador de Escritura** | Ver cuando otros usuarios están escribiendo |
| **Estado de Entrega** | Confirmación visual de mensaje enviado |
| **Timestamps** | Hora y fecha automática en cada mensaje |
| **Historial Completo** | Acceso al historial de conversaciones por sala |
| **Estado de Lectura** | Tracking de mensajes leídos |

### 2.2 Interacción con Mensajes
| Función | Descripción |
|---------|-------------|
| **Reacciones** | Sistema de like/dislike en mensajes |
| **Citar/Responder** | Citar mensajes previos para dar contexto |
| **Selector de Emojis** | Picker completo de emojis integrado |
| **Frases Rápidas** | Respuestas predefinidas personalizables |

### 2.3 Sistema de Salas
| Sala | Descripción | Acceso |
|------|-------------|--------|
| **Principal** | Chat general para todos | Todos |
| **Santiago** | Sala específica de Santiago | Todos |
| **Gaming** | Para gamers y videojuegos | Todos |
| **Más de 30** | Usuarios mayores de 30 años | Todos |
| **España** | Chat regional España | Registrados |
| **Brasil** | Chat regional Brasil | Registrados |
| **México** | Chat regional México | Registrados |
| **Argentina** | Chat regional Argentina | Registrados |

### 2.4 Navegación de Salas
- **Sidebar (Desktop)**: Lista de salas siempre visible con indicadores de actividad
- **Modal (Mobile)**: Selector responsive para pantallas pequeñas
- **Indicadores de Actividad**: Pulso visual mostrando conversaciones activas
- **Contador de Usuarios**: Número de usuarios activos por sala
- **Listas Dinámicas**: Salas se adaptan según estado de autenticación

---

## 3. COMPARATIVA: INVITADO vs USUARIO REGISTRADO

### 3.1 Usuario Invitado (Sin Registro)

#### ✅ Puede Hacer:
| Acción | Detalle |
|--------|---------|
| **Ver Salas** | Navegar por todas las salas disponibles |
| **Leer Mensajes** | Acceso de solo lectura a conversaciones |
| **Entrar a Salas** | Unirse a salas públicas sin registro |
| **Enviar 10 Mensajes** | Límite de prueba antes de requerir registro |
| **Ver Perfiles** | Consultar perfiles de otros usuarios |
| **Ver OPIN** | Leer el feed de descubrimiento (solo lectura) |
| **Foro Anónimo** | Participar en foros anónimos |
| **Ver Indicadores** | Typing indicators y contadores de usuarios |
| **Instalar PWA** | Agregar app a pantalla de inicio |
| **Elegir Nickname** | Modal para establecer nombre temporal |
| **Verificar Edad** | Confirmación única de 18+ |

#### ❌ No Puede Hacer:
| Restricción | Razón |
|-------------|-------|
| Enviar +10 mensajes | Requiere registro después del límite |
| Crear posts OPIN | Función exclusiva de registrados |
| Chat Privado | No puede iniciar conversaciones 1-a-1 |
| Salas Privadas | Sin acceso a salas regionales |
| Funciones Premium | Bloqueadas completamente |
| Persistencia de Sesión | Datos se pierden al cerrar navegador |

#### UX para Invitados:
- **Banner de Invitado**: Indicador claro del estado con CTA para registrarse
- **Contador de Mensajes**: Visual del límite restante (10 mensajes)
- **Prompts de Registro**: CTAs estratégicos para incentivar registro
- **Almacenamiento Temporal**: IndexedDB mantiene datos durante sesión

---

### 3.2 Usuario Registrado

#### ✅ Acceso Completo:

**Autenticación y Perfil:**
| Función | Descripción |
|---------|-------------|
| **Registro Email/Password** | Autenticación segura Firebase |
| **Sesión Persistente** | Login guardado entre sesiones |
| **Perfil Personalizable** | Username, bio, avatar, género, orientación |
| **Sistema de Avatares** | Colección DiceBear + foto personalizada |
| **Información de Perfil** | Edad, género, orientación, bio, ubicación |
| **Tracking de Actividad** | Última actividad visible |

**Mensajería Sin Límites:**
| Función | Descripción |
|---------|-------------|
| **Mensajes Ilimitados** | Sin restricción de cantidad |
| **Todas las Salas** | Acceso a salas regionales exclusivas |
| **Navegación Directa** | Sin limitaciones de velocidad |

**Chat Privado (Funciones Sociales):**
| Función | Descripción |
|---------|-------------|
| **Solicitudes de Chat** | Enviar peticiones de mensaje directo |
| **Ventanas Privadas** | Interfaz de conversación 1-a-1 |
| **Notificaciones** | Alertas de mensajes privados |
| **Aceptar/Rechazar** | Control de quién puede contactarte |
| **Historial Privado** | Conversaciones guardadas |
| **Bloquear Usuarios** | Prevenir contacto no deseado |

**OPIN - Muro de Descubrimiento:**
| Función | Descripción |
|---------|-------------|
| **Crear Posts** | Publicaciones tipo estado (1 activo a la vez) |
| **Feed de Descubrimiento** | Ver posts públicos de la comunidad |
| **Sistema de Comentarios** | Comentar en posts de otros |
| **Editar/Eliminar** | Gestionar propios posts |
| **Notificaciones** | Alertas cuando comentan tu post |
| **Ordenamiento** | Ver recientes/trending |

**Configuraciones:**
| Función | Descripción |
|---------|-------------|
| **Selección de Tema** | Modo oscuro/claro con colores personalizados |
| **Preferencias de Fuente** | Tipografía personalizable |
| **Config. Notificaciones** | Control de alertas |
| **Privacidad** | Configurar quién puede contactarte |
| **Sonidos** | Activar/desactivar sonidos |
| **Apariencia** | Personalizar visualización del chat |

---

## 4. FUNCIONES PREMIUM

### Beneficios Actuales
| Función | Descripción |
|---------|-------------|
| **Chat Ilimitado** | Sin restricciones de tiempo o mensajes |
| **Verificación Prioritaria** | Proceso más rápido |
| **Eventos Exclusivos** | Acceso a eventos Premium-only |
| **Badge Premium** | Insignia visible en el chat |
| **Salas VIP** | Acceso a salas privadas exclusivas |
| **Soporte 24/7** | Atención prioritaria directa |

### Estado del Sistema Premium
- **Infraestructura Lista**: Sistema de upgrade implementado
- **Próximamente**: Integración de pagos (Mercado Pago, WebPay)
- **Precio**: $9,990 CLP/mes
- **Trial Gratuito**: Tier inicial con todas las funciones

---

## 5. FUNCIONES ESPECIALES

### 5.1 Sistema de IA Companion
| Función | Descripción |
|---------|-------------|
| **Widget CompanionAI** | Asistente IA integrado en el chat |
| **Respuestas Contextuales** | IA responde según contexto de conversación |
| **Multi-Proveedor** | Google Gemini + OpenAI GPT |
| **Personalidades** | Diferentes asistentes con personalidades únicas |

### 5.2 Sistema de Bots (para Salas Vacías)
**8 Personalidades de Bot:**
| Bot | Edad | Personalidad |
|-----|------|--------------|
| Carlos | 28 | Activo, extrovertido |
| Mateo | 25 | Pasivo, tímido |
| Alejandro | 32 | Versátil, maduro |
| David | 26 | Activo, juguetón |
| Miguel | 30 | Pasivo, calmado |
| Javier | 24 | Versátil, geek |
| Fernando | 29 | Activo, confiado |
| Pablo | 23 | Versátil, comediante |

**Degradación Inteligente:**
| Usuarios Reales | Bots Activos | Comportamiento |
|-----------------|--------------|----------------|
| 1 usuario | 2 bots | Arranque en frío |
| 2-3 usuarios | 2 bots | Menos activos |
| 4-5 usuarios | 1 bot | Discreto |
| 6+ usuarios | 0 bots | Comunidad natural |

**Características de Bots:**
- Conversaciones naturales (OpenAI GPT)
- Delays humanos (5-15 segundos)
- Anti-repetición (cooldown 7 minutos)
- Consistencia de personalidad
- Detección anti-spam

### 5.3 Geolocalización
| Función | Descripción |
|---------|-------------|
| **Ubicación Opcional** | Compartir ubicación voluntariamente |
| **Usuarios Cercanos** | Descubrir miembros LGBTQ+ cerca |
| **Badges de Distancia** | Mostrar distancia a usuarios cercanos |
| **Permisos Claros** | Prompts de privacidad transparentes |
| **Promoción Regional** | Sugerir salas relevantes por ubicación |

### 5.4 Sistema de Foro
| Función | Descripción |
|---------|-------------|
| **Foro Anónimo** | Postear sin cuenta |
| **Crear Hilos** | Iniciar discusiones |
| **Comentarios Anidados** | Sistema de respuestas |
| **Badge de Autor** | Identificación en posts propios |

### 5.5 Sistema de Eventos
| Función | Descripción |
|---------|-------------|
| **Calendario** | Ver eventos de comunidad |
| **Notificaciones** | Alertas de eventos próximos |
| **Modal de Evento** | Detalles en popup |
| **Tipos de Eventos** | Pride, meetups, salud, testing |

### 5.6 Verificación y Seguridad
| Función | Descripción |
|---------|-------------|
| **Verificación 18+** | Confirmación obligatoria de edad |
| **Verificación Email** | Validación de correo |
| **Sistema de Sanciones** | Advertencias, bans temporales/permanentes |
| **Sistema de Reportes** | Denuncias iniciadas por usuarios |
| **Estado de Verificación** | Visible en perfiles |

### 5.7 Sistema de Notificaciones
| Tipo | Descripción |
|------|-------------|
| **Mensajes Privados** | Alertas de DMs |
| **Comentarios OPIN** | Cuando comentan tu post |
| **Menciones** | Si se implementan |
| **Anuncios Sistema** | Comunicados importantes |
| **Panel Dedicado** | Centro de notificaciones |
| **Campana Visual** | Indicador de no leídos |
| **Sonidos** | Audio configurable |
| **Toasts** | Mensajes temporales inline |

---

## 6. FUNCIONES DE ADMINISTRACIÓN

### Panel de Admin (`/admin`)

#### Analytics en Tiempo Real
| Métrica | Descripción |
|---------|-------------|
| Vistas de Página | Tracking de navegación |
| Registros | Nuevos usuarios |
| Logins | Inicios de sesión |
| Mensajes Enviados | Actividad de chat |
| Salas Creadas/Unidas | Engagement de salas |
| Abandonos | Tracking de salidas |

#### Gestión de Reportes
| Función | Descripción |
|---------|-------------|
| **Ver Reportes** | Dashboard de denuncias |
| **Filtrar** | Por estado (pendiente, resuelto, rechazado) |
| **Detalles** | Reporter, objetivo, tipo, descripción |
| **Acciones** | Resolver, rechazar, sancionar, mensajear |
| **Estadísticas** | Totales, pendientes, resueltos |

#### Sistema de Tickets
| Función | Descripción |
|---------|-------------|
| **Ver Tickets** | Soporte de usuarios |
| **Estados** | Abierto, en progreso, resuelto, cerrado |
| **Prioridades** | Urgente, alta, media, baja |
| **Categorías** | General, técnico, billing, bugs, features |
| **Notas Admin** | Respuestas a tickets |

#### Moderación de Contenido
| Función | Descripción |
|---------|-------------|
| **Eliminar Mensajes** | Remover contenido inapropiado |
| **Sistema de Sanciones** | Warnings, bans temp/perm |
| **Cambiar Identidad** | Modificar cuentas para testing |
| **Alertas Inteligentes** | Flags automáticos |

---

## 7. CARACTERÍSTICAS TÉCNICAS

### Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18.2 + Vite |
| **Estilos** | Tailwind CSS |
| **Animaciones** | Framer Motion |
| **Componentes** | Radix UI |
| **Routing** | React Router v6 |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **IA** | Google Gemini + OpenAI GPT |
| **Hosting** | Firebase Hosting + Vercel |

### Seguridad
| Aspecto | Implementación |
|---------|----------------|
| **Autenticación** | Firebase Auth estándar industria |
| **Contraseñas** | Hashing bcrypt automático |
| **Sesiones** | Tokens Firebase seguros |
| **Acceso por Roles** | Verificación de rol admin |
| **Reglas Firestore** | Permisos estrictos read/write |
| **Validación Server** | Datos validados antes de guardar |
| **Aislamiento** | Usuarios solo ven sus datos |
| **Email Inmutable** | No se puede cambiar una vez registrado |

### Rendimiento
| Optimización | Beneficio |
|--------------|-----------|
| **Code Splitting** | 80% reducción de bundle |
| **Lazy Loading** | Carga bajo demanda |
| **Caching Inteligente** | Verificación automática de versión |
| **Monitoreo** | Analytics de performance |
| **Auto-update** | Verifica nuevas versiones cada 60s |
| **Queries Optimizados** | Límites eficientes en Firebase |

---

## 8. LANDING PAGES Y SEO

### Páginas de Aterrizaje
| Página | Enfoque |
|--------|---------|
| **Global** | Entrada principal (Chile) |
| **Chile/Santiago** | Regional Chile |
| **España** | Regional España |
| **Brasil** | Regional Brasil |
| **México** | Regional México |
| **Argentina** | Regional Argentina |
| **Gaming** | Comunidad gamer |
| **Más de 30** | Usuarios 30+ |

### Contenido Informativo
| Sección | Descripción |
|---------|-------------|
| **FAQ** | Preguntas frecuentes |
| **Reglas del Chat** | Lineamientos de comunidad |
| **News Ticker** | Eventos y anuncios |
| **Recursos de Salud** | Mental, testing, información |
| **Estadísticas Globales** | Usuarios activos, mensajes |

---

## 9. RESUMEN DE BENEFICIOS POR TIPO DE USUARIO

### Invitados
✅ Explorar comunidad sin compromiso
✅ 10 mensajes de prueba
✅ Lectura de conversaciones y perfiles
✅ Privacidad total (sin tracking)

### Usuarios Registrados
✅ Chat ilimitado
✅ Mensajes privados
✅ Crear y compartir OPIN
✅ Perfiles personalizables con fotos
✅ Acceso a todas las salas
✅ Favoritos y preferencias guardadas

### Usuarios Premium
✅ Soporte prioritario 24/7
✅ Salas VIP exclusivas
✅ Badge Premium visible
✅ Eventos exclusivos
✅ Verificación rápida

### Administradores
✅ Analytics en tiempo real
✅ Gestión de reportes y sanciones
✅ Sistema de tickets
✅ Herramientas de moderación
✅ Métricas de comportamiento

---

## 10. MÉTRICAS DE CAPACIDAD

| Métrica | Valor |
|---------|-------|
| **Usuarios Diarios Soportados** | 4,000+ (tier gratuito Firebase) |
| **Consumo Firebase** | 2-7% del tier gratuito |
| **Agregación de Datos** | 1 documento/día |
| **Historial Analytics** | Hasta 30 días |
| **Tiempo de Carga** | Optimizado con code splitting |

---

*Documentación generada el 29 de enero de 2026*
*Versión: Chactivo v1.0*
