# Marketing Dashboard - Multi-Tenant

Dashboard de marketing multi-tenant con autenticación JWT, gestión de organizaciones y análisis de métricas desde Google Sheets.

## 🚀 Quick Start

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Configurar base de datos
cp .env.example .env
# Edita .env con tu DATABASE_URL

# 3. Setup inicial
npm run db:setup

# 4. Iniciar desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Credenciales Iniciales

**Admin:**
- Email: `admin@agrowth.com`
- Password: `admin123456`

**Clientes:** (password: `cliente123`)
- LemonTech: `lemontech@cliente.com`
- Del Mundo: `delmundo@cliente.com`
- Gullich: `gullich@cliente.com`
- Falda del Carmen: `falda@cliente.com`

## 📚 Documentación

- **[SETUP.md](./SETUP.md)** - Configuración detallada del sistema
- **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** - Guía de deploy a Vercel

## ✨ Características

### Para Administradores
- 🏢 Gestión de organizaciones (clientes)
- 👥 Creación y gestión de usuarios
- 🎯 Configuración de funnels por organización
- 📊 Dashboard consolidado de todos los clientes
- 🎨 Personalización de branding (logo, colores)

### Para Clientes
- 📈 Dashboard personalizado con sus métricas
- 🔄 Funnels dinámicos desde Google Sheets
- 📊 Análisis de campañas (Google Ads, Meta, LinkedIn, Bing)
- 📉 KPIs: Clicks, CPC, Conversiones, Tasa de conversión
- 📅 Calendario de acciones de marketing

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS 4
- **Backend**: Express + tRPC + TypeScript
- **Database**: MySQL + Drizzle ORM
- **Auth**: JWT + bcrypt
- **Deployment**: Vercel

## 📦 Estructura del Proyecto

```
marketing-dashboard/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas (Dashboard, Admin, Login)
│   │   ├── components/ # Componentes UI
│   │   └── contexts/   # Contextos (Auth, BusinessUnit)
│
├── server/              # Backend Express
│   ├── _core/          # Core del servidor
│   ├── services/       # Servicios (auth, googleSheets)
│   ├── routers.ts      # Endpoints tRPC
│   ├── db.ts           # Funciones de base de datos
│   └── scripts/        # Scripts de seed y migración
│
├── drizzle/             # Schema de base de datos
├── api/                 # Entry point para Vercel
└── shared/              # Código compartido
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor dev
npm run build            # Build para producción
npm run start            # Iniciar servidor producción

# Base de datos
npm run db:push          # Ejecutar migraciones
npm run db:seed          # Poblar datos iniciales
npm run db:reset         # Limpiar base de datos
npm run db:setup         # Push + Seed

# Otros
npm run check            # TypeScript check
npm run format           # Prettier format
npm run test             # Ejecutar tests
```

## 🌐 Deploy a Vercel

Ver guía completa en [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

Resumen rápido:

```bash
# 1. Subir a GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main

# 2. Importar en Vercel (vercel.com)
# 3. Configurar variables de entorno:
#    - DATABASE_URL
#    - JWT_SECRET

# 4. Deploy automático!
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT tokens con httpOnly cookies
- Validación de inputs con Zod
- Aislamiento de datos por organización
- CORS configurado

**⚠️ IMPORTANTE**: En producción, cambia:
- Las contraseñas de todos los usuarios
- El `JWT_SECRET` a un valor aleatorio seguro

## 📊 Flujo Multi-Tenant

1. **Admin** crea una organización
2. **Admin** configura funnels (tabs del Google Sheet)
3. **Admin** crea usuarios y los asigna a la organización
4. **Cliente** hace login y ve solo sus datos
5. Datos completamente aislados por organización

## 🗄️ Base de Datos

El sistema usa MySQL con estas tablas principales:

- `organizations` - Clientes
- `users` - Usuarios (admin y clientes)
- `funnels` - Funnels por organización
- `organization_users` - Relación usuarios-organizaciones
- `platform_connections` - Conexiones OAuth
- Más tablas para métricas, reportes, alerts, etc.

## 🤝 Contribuir

Este proyecto es interno. Para cambios:

1. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
2. Commit: `git commit -m "Descripción"`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

## 📝 Licencia

MIT

## 📞 Soporte

Para problemas o preguntas:
- Revisa la documentación en `SETUP.md` y `VERCEL_DEPLOY.md`
- Revisa los logs en Vercel (si aplica)
- Contacta al equipo de desarrollo

---

Hecho con ❤️ por A+Growth
