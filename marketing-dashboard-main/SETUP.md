# Marketing Dashboard - Multi-Tenant Setup

Este documento explica cómo configurar y usar el sistema multi-tenant del dashboard de marketing.

## 🚀 Setup Inicial

### 1. Configurar Base de Datos

Crea un archivo `.env` en la raíz del proyecto con tu conexión MySQL:

```bash
DATABASE_URL="mysql://usuario:password@localhost:3306/marketing_dashboard"
JWT_SECRET="tu-secret-key-aqui-cambiar-en-produccion"
```

### 2. Ejecutar Migraciones y Seed

```bash
# Opción 1: Ejecutar todo de una vez
npm run db:setup

# Opción 2: Paso a paso
npm run db:push    # Crear tablas
npm run db:seed    # Poblar datos iniciales
```

## 👥 Clientes Iniciales Creados

El script de seed crea los siguientes clientes:

### 1. **LemonTech**
- Color: Naranja (#f97316)
- Funnels:
  - LemonSuite - Google Ads
  - LemonSuite - Meta
  - CaseTracking - Google Ads
  - LemonFlow - Google Ads
  - LemonFlow - Meta

### 2. **Del Mundo**
- Color: Azul (#3b82f6)
- Funnels:
  - Google Search
  - Meta Ads

### 3. **Gullich Expediciones**
- Color: Verde (#10b981)
- Funnels:
  - Google Ads Principal
  - Meta Awareness

### 4. **Falda del Carmen**
- Color: Púrpura (#8b5cf6)
- Funnels:
  - Google Search
  - Meta Retargeting

## 🔑 Credenciales de Acceso

### Usuario Administrador
```
Email: admin@agrowth.com
Password: admin123456
```

### Usuarios Clientes
Todos los usuarios cliente usan la misma contraseña: `cliente123`

- **LemonTech**: lemontech@cliente.com
- **Del Mundo**: delmundo@cliente.com
- **Gullich**: gullich@cliente.com
- **Falda del Carmen**: falda@cliente.com

## 📝 Flujo de Uso

### Para Administradores

1. **Login**: Ingresa con `admin@agrowth.com`
2. **Panel Admin**: Ve a `/admin` (aparece en el sidebar)
3. **Gestionar Organizaciones**:
   - Crear nueva organización
   - Configurar Google Sheet ID
   - Personalizar logo y color
4. **Gestionar Funnels**:
   - Seleccionar organización
   - Crear funnels (tabs del Sheet)
   - Configurar orden y plataforma
5. **Gestionar Usuarios**:
   - Crear usuarios para clientes
   - Asignar a organizaciones
   - Definir roles

### Para Clientes

1. **Login**: Ingresa con tu email y contraseña
2. **Dashboard**: Verás solo los datos de tu organización
3. **Funnels**: Los tabs son dinámicos según tu configuración
4. **Métricas**: Aisladas por organización

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Base de datos
npm run db:push          # Ejecutar migraciones
npm run db:seed          # Poblar clientes iniciales
npm run db:reset         # Limpiar datos (¡cuidado!)
npm run db:setup         # Push + Seed en un comando

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción
```

## 📊 Configurar Google Sheet por Cliente

Cada cliente puede tener su propio Google Sheet:

1. Ve a `/admin` → Tab "Organizaciones"
2. Edita la organización
3. Pega el Sheet ID (de la URL del Google Sheet)
4. Guarda

**Formato del Sheet ID:**
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
                                        ^^^^^^^^^^
                                        Este es el ID
```

## 🎨 Personalización

### Logo por Cliente
- Sube el logo en `/admin/organizations`
- El logo se muestra en el dashboard del cliente

### Color Primario
- Configura el color hex en `/admin/organizations`
- Se aplica al branding del cliente

## 🔒 Seguridad

### Cambiar Contraseñas
Después del setup inicial, **cambia estas contraseñas**:

```typescript
// En producción, usar contraseñas fuertes:
// Admin: admin123456 → Nueva contraseña fuerte
// Clientes: cliente123 → Contraseñas individuales
```

### JWT Secret
En producción, genera un secret aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Agrégalo al `.env`:
```
JWT_SECRET=tu-secret-generado-aqui
```

## 🧪 Modo Demo

El dashboard incluye un "Demo Mode" que muestra datos de ejemplo:
- Toggle en el sidebar
- Útil para probar sin conectar plataformas reales

## 📞 Soporte

Si tienes problemas con el setup:
1. Verifica que `DATABASE_URL` esté correctamente configurado
2. Revisa que MySQL esté corriendo
3. Ejecuta `npm run db:reset` y luego `npm run db:seed` para empezar de cero

## 🎯 Próximos Pasos

Después del setup:
1. ✅ Login como admin
2. ✅ Revisar organizaciones en `/admin`
3. ✅ Probar login como cliente
4. ✅ Configurar Google Sheets reales por cliente
5. ✅ Crear usuarios adicionales según necesites
