# 📋 Guía de Sistema de Denuncias - Chactivo

## 🎯 Resumen

Las denuncias ahora se **guardan automáticamente en Firestore** en la colección `reports`. Puedes acceder a ellas de 3 formas diferentes.

---

## 📍 ¿Dónde se Guardan las Denuncias?

**Ubicación en Firestore:**
```
/reports/{reportId}
```

**Estructura de una denuncia:**
```javascript
{
  reporterId: "uid-del-denunciante",
  reporterUsername: "NombreUsuario",
  type: "acoso" | "violencia" | "drogas" | "ventas" | "otras",
  otherType: "Descripción si type='otras'",
  description: "Descripción detallada del problema",
  targetUsername: "NombreDelDenunciado",
  targetId: "uid-del-denunciado (si está disponible)",
  roomId: "sala-donde-ocurrió (opcional)",
  messageId: "id-del-mensaje (opcional)",
  evidence: [], // URLs de capturas (futuro)
  status: "pending" | "reviewing" | "resolved" | "dismissed",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  reviewedBy: "uid-del-admin (cuando se revisa)",
  reviewNotes: "Notas del administrador"
}
```

---

## 🔍 Forma 1: Firebase Console (Más Fácil)

### Paso a Paso:

1. **Ir a Firebase Console:**
   ```
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/databases/-default-/data
   ```

2. **Navegar a la colección `reports`:**
   - En el panel izquierdo, busca la colección `reports`
   - Haz clic en ella

3. **Ver todas las denuncias:**
   - Verás una lista de todos los documentos (denuncias)
   - Haz clic en cualquier documento para ver los detalles completos

4. **Filtrar denuncias:**
   - Usa el botón "Filter" para buscar por:
     - `status == "pending"` → Solo pendientes
     - `type == "acoso"` → Solo acoso
     - `createdAt >= [fecha]` → Desde una fecha

### Ventajas:
- ✅ No requiere código
- ✅ Visual y fácil de usar
- ✅ Puedes editar denuncias directamente

---

## 💻 Forma 2: Consola del Navegador (Para Desarrolladores)

### Paso a Paso:

1. **Abrir la app en el navegador:**
   ```
   http://localhost:3002
   ```

2. **Abrir DevTools (F12)**

3. **Ir a la pestaña "Console"**

4. **Ejecutar código JavaScript:**

```javascript
// Importar el servicio (solo en desarrollo, ya que usa import dinámico)
const { getAllReports, getReportStats } = await import('./src/services/reportService.js');

// Ver todas las denuncias
const denuncias = await getAllReports();
console.table(denuncias);

// Ver solo denuncias pendientes
const pendientes = await getAllReports('pending');
console.table(pendientes);

// Ver estadísticas
const stats = await getReportStats();
console.log('Estadísticas:', stats);
```

### Ventajas:
- ✅ Rápido para desarrolladores
- ✅ Puedes manipular datos con JavaScript
- ✅ Ideal para debugging

---

## 🛠️ Forma 3: Panel de Administración (Futuro - Recomendado)

**NOTA:** Aún no está implementado, pero aquí está el plan:

### Crear página `/admin/denuncias`

```javascript
// Ejemplo de cómo se vería:
import { getAllReports, updateReportStatus } from '@/services/reportService';

function AdminReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      const data = await getAllReports();
      setReports(data);
    };
    loadReports();
  }, []);

  const handleResolve = async (reportId) => {
    await updateReportStatus(reportId, 'resolved', 'Resuelto por admin');
    // Recargar denuncias
  };

  return (
    <div>
      <h1>Panel de Denuncias</h1>
      {reports.map(report => (
        <div key={report.id}>
          <h3>{report.type.toUpperCase()}</h3>
          <p>{report.description}</p>
          <p>Denunciado: {report.targetUsername}</p>
          <button onClick={() => handleResolve(report.id)}>Resolver</button>
        </div>
      ))}
    </div>
  );
}
```

**¿Quieres que implemente este panel de administración?**

---

## 📊 Funciones Disponibles

El archivo `src/services/reportService.js` tiene estas funciones:

### 1. `createReport(reportData)`
Crea una nueva denuncia.

```javascript
await createReport({
  reporterUsername: 'Juan',
  type: 'acoso',
  description: 'Usuario está acosando en la sala',
  targetUsername: 'Spammer123',
});
```

### 2. `getAllReports(status?)`
Obtiene todas las denuncias (opcionalmente filtradas por estado).

```javascript
const todas = await getAllReports();
const pendientes = await getAllReports('pending');
```

### 3. `getUserReports(userId)`
Obtiene las denuncias de un usuario específico.

```javascript
const misDenuncias = await getUserReports('mi-user-id');
```

### 4. `updateReportStatus(reportId, newStatus, reviewNotes)`
Actualiza el estado de una denuncia (SOLO ADMIN).

```javascript
await updateReportStatus(
  'report-id-123',
  'resolved',
  'Usuario fue suspendido por 7 días'
);
```

### 5. `getReportStats()`
Obtiene estadísticas de denuncias.

```javascript
const stats = await getReportStats();
// Retorna:
// {
//   total: 15,
//   pending: 8,
//   reviewing: 3,
//   resolved: 4,
//   dismissed: 0,
//   byType: { acoso: 10, violencia: 2, ... }
// }
```

---

## 🔒 Reglas de Seguridad Actuales

En `firestore.rules` (líneas 140-152):

```javascript
match /reports/{reportId} {
  // Solo admins pueden leer reportes (por ahora nadie)
  allow read: if false;

  // Usuarios autenticados pueden crear reportes
  allow create: if isAuthenticated() &&
                  request.resource.data.keys().hasAll(['reporterId', 'targetId', 'reason', 'timestamp']) &&
                  request.resource.data.reporterId == request.auth.uid &&
                  request.resource.data.reason.size() > 10;

  // No se pueden actualizar ni eliminar reportes
  allow update, delete: if false;
}
```

**⚠️ IMPORTANTE:** Actualmente `allow read: if false` significa que **nadie puede leer las denuncias desde la app**, ni siquiera admins. Solo puedes verlas desde Firebase Console.

### Para permitir que admins lean denuncias:

Necesitas:
1. Agregar un campo `isAdmin: true` en la colección `users` para ciertos usuarios
2. Actualizar las reglas:

```javascript
match /reports/{reportId} {
  // Solo admins pueden leer
  allow read: if isAuthenticated() &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;

  // Usuarios autenticados pueden crear
  allow create: if isAuthenticated() && ...
}
```

---

## 🎯 Próximos Pasos Recomendados

### Opción 1: Panel de Admin Completo
Crear una página `/admin` con:
- ✅ Lista de todas las denuncias
- ✅ Filtros por estado y tipo
- ✅ Acciones: Resolver, Desestimar, Marcar como revisando
- ✅ Notas del administrador
- ✅ Historial de cambios

### Opción 2: Sistema de Roles
- Agregar campo `role: "user" | "moderator" | "admin"` en users
- Solo moderadores y admins pueden ver denuncias
- Solo admins pueden cambiar estados

### Opción 3: Notificaciones
- Email al admin cuando llega nueva denuncia
- Notificación in-app al denunciante cuando se resuelve

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo hago admin a un usuario?**
R: Por ahora, manualmente en Firebase Console:
1. Ve a `users/{userId}`
2. Agrega campo `isAdmin: true`

**P: ¿Las denuncias son anónimas?**
R: No completamente. Se guarda el `reporterId` y `reporterUsername` por seguridad.

**P: ¿Puedo borrar una denuncia?**
R: Por ahora no, debido a las reglas de seguridad. Puedes marcarla como "dismissed".

**P: ¿Dónde se envían las notificaciones?**
R: Aún no hay sistema de notificaciones. Solo se guardan en Firestore.

---

## 📞 Soporte

Si necesitas ayuda para:
- Implementar el panel de admin
- Configurar roles y permisos
- Agregar notificaciones por email
- Cualquier otra funcionalidad

¡Solo pregunta! 🚀
