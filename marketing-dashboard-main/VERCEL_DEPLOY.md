# 🚀 Deploy a Vercel

Esta guía te ayudará a hacer deploy del Marketing Dashboard a Vercel.

## 📋 Pre-requisitos

1. **Cuenta de Vercel**: Crea una cuenta en [vercel.com](https://vercel.com)
2. **Base de datos MySQL**: Necesitas una base de datos MySQL accesible desde internet
   - **Recomendado**: [PlanetScale](https://planetscale.com) (MySQL serverless gratis)
   - **Alternativas**: Railway, AWS RDS, DigitalOcean

## 🗄️ 1. Configurar Base de Datos

### Opción A: PlanetScale (Recomendado)

1. Ve a [planetscale.com](https://planetscale.com) y crea una cuenta
2. Crea una nueva base de datos:
   - Nombre: `marketing-dashboard`
   - Región: Elige la más cercana a tus usuarios
3. Click en "Connect" → "Create password"
4. Selecciona "Prisma" o "General" para obtener el connection string
5. Copia el `DATABASE_URL` (formato: `mysql://...`)

### Opción B: Otras alternativas

Si usas otro proveedor, asegúrate de obtener una URL de conexión en este formato:
```
mysql://usuario:password@host:puerto/nombre_db
```

## 🔧 2. Deploy desde GitHub

### Paso 1: Subir a GitHub

```bash
# Si aún no has inicializado git
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub y luego:
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### Paso 2: Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click en "Import Git Repository"
3. Selecciona tu repositorio de GitHub
4. Vercel detectará automáticamente la configuración

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables" de Vercel, agrega:

```bash
# REQUERIDO
DATABASE_URL=mysql://usuario:password@host:puerto/nombre_db
JWT_SECRET=tu-secret-aleatorio-aqui

# Opcional
NODE_ENV=production
```

**Importante**: Para generar un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Paso 4: Deploy

1. Click en "Deploy"
2. Espera a que termine el build (~2-3 minutos)
3. Vercel te dará una URL: `https://tu-proyecto.vercel.app`

## 🗄️ 3. Inicializar Base de Datos

Una vez que el deploy esté completo:

### Opción A: Desde tu computadora local

```bash
# 1. Configura el .env con la DATABASE_URL de producción
DATABASE_URL="mysql://..."

# 2. Ejecuta las migraciones
npm run db:push

# 3. Pobla los datos iniciales
npm run db:seed
```

### Opción B: Desde Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link al proyecto
vercel link

# Ejecutar comando en Vercel
vercel exec npm run db:setup
```

## 🔑 4. Acceder al Dashboard

1. Ve a tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Deberías ver la página de login
3. Usa las credenciales del seed:
   - **Admin**: `admin@agrowth.com` / `admin123456`
   - **Clientes**: Ver `SETUP.md` para lista completa

## ⚙️ 5. Configuración Avanzada

### Dominios Personalizados

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones de DNS

### Variables de Entorno Adicionales

Si necesitas configurar email (futuro):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu-password-smtp
APP_URL=https://tudominio.com
```

### Monitoreo y Logs

- Ve a tu proyecto en Vercel
- Tab "Logs" para ver logs en tiempo real
- Tab "Analytics" para métricas de uso

## 🔄 6. Actualizaciones

Cada vez que hagas push a GitHub, Vercel desplegará automáticamente:

```bash
git add .
git commit -m "Tu mensaje"
git push
```

Vercel detectará el push y hará deploy automático en ~2 minutos.

## 🐛 7. Troubleshooting

### Error: "DATABASE_URL is not defined"

- Verifica que hayas agregado la variable en Vercel → Settings → Environment Variables
- Asegúrate de que esté configurada para "Production"
- Redeploy el proyecto después de agregar variables

### Error: "Cannot connect to database"

- Verifica que tu base de datos acepte conexiones externas
- En PlanetScale, asegúrate de tener una contraseña de conexión creada
- Verifica que el `DATABASE_URL` sea correcto

### Build Failed

- Revisa los logs en Vercel
- Si es un error de dependencias, verifica que `package.json` esté actualizado
- Puede que necesites ejecutar `npm install --legacy-peer-deps` localmente y hacer commit

### API no responde

- Verifica que `/api/trpc` esté funcionando: `https://tu-url.vercel.app/api/trpc`
- Revisa los logs de funciones serverless en Vercel
- Verifica que las variables de entorno estén configuradas

### Páginas en blanco

- Abre la consola del navegador (F12)
- Verifica errores de JavaScript
- Asegúrate de que el build del frontend terminó correctamente

## 📊 8. Monitoreo

### Vercel Analytics

Vercel incluye analytics básico gratis. Para habilitarlo:

1. Ve a tu proyecto → Analytics
2. Click en "Enable"
3. Verás métricas de tráfico y rendimiento

### Logs de Errores

Los logs están disponibles en:
- Vercel Dashboard → Tu proyecto → Logs
- Puedes filtrar por:
  - Tipo (Build, Serverless Function)
  - Tiempo
  - Errores

## 🔒 9. Seguridad en Producción

### Cambiar Contraseñas

Después del primer deploy, **cambia las contraseñas**:

1. Login como admin
2. Ve a `/admin` → Tab "Usuarios"
3. Edita cada usuario y cambia su contraseña
4. O ejecuta un script SQL directo en tu base de datos

### Configurar CORS (si es necesario)

Si usas subdominios o dominios diferentes:

```typescript
// En server/_core/app.ts, agrega:
app.use(cors({
  origin: ['https://tudominio.com', 'https://www.tudominio.com'],
  credentials: true
}));
```

## 💰 10. Costos

### Vercel

- **Hobby (Gratis)**:
  - 100 GB bandwidth/mes
  - Serverless Functions ilimitadas
  - Suficiente para proyectos pequeños/medianos

- **Pro ($20/mes)**:
  - 1TB bandwidth
  - Mejor rendimiento
  - Analytics avanzado

### Base de Datos (PlanetScale)

- **Hobby (Gratis)**:
  - 5GB storage
  - 1 billón row reads/mes
  - Suficiente para empezar

- **Scaler ($29/mes)**:
  - 10GB storage
  - Conexiones ilimitadas
  - Para producción seria

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel Dashboard
2. Verifica la documentación de Vercel: [vercel.com/docs](https://vercel.com/docs)
3. Revisa `SETUP.md` para problemas de base de datos

## ✅ Checklist de Deploy

- [ ] Base de datos MySQL configurada
- [ ] Repositorio en GitHub
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas (`DATABASE_URL`, `JWT_SECRET`)
- [ ] Deploy completado exitosamente
- [ ] Migraciones ejecutadas (`npm run db:push`)
- [ ] Datos iniciales cargados (`npm run db:seed`)
- [ ] Login funciona correctamente
- [ ] Panel de admin accesible
- [ ] Contraseñas de producción actualizadas
- [ ] Dominio personalizado configurado (opcional)

¡Listo! Tu dashboard está en producción 🎉
