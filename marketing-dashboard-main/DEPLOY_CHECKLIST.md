# ✅ Deploy Checklist - Marketing Dashboard

Usa esta checklist para asegurar un deploy exitoso a Vercel.

## 🎯 Pre-Deploy

- [ ] El código está funcionando localmente (`npm run dev`)
- [ ] No hay errores en el build (`npm run build`)
- [ ] El `.env` local funciona correctamente
- [ ] Tienes cuenta en Vercel
- [ ] Tienes una base de datos MySQL lista

## 📦 1. Preparar Repositorio

```bash
# Si no has inicializado git
git init

# Agregar todos los archivos
git add .
git commit -m "Initial commit - Multi-tenant dashboard"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

- [ ] Código subido a GitHub
- [ ] Repositorio es privado (recomendado)

## 🗄️ 2. Base de Datos (PlanetScale Recomendado)

1. Ve a [planetscale.com](https://planetscale.com)
2. Crear cuenta → Crear database
3. Nombre: `marketing-dashboard`
4. Click "Connect" → "Create password"
5. Copiar `DATABASE_URL`

- [ ] Base de datos creada
- [ ] `DATABASE_URL` copiado
- [ ] Base de datos acepta conexiones externas

## 🚀 3. Deploy en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Selecciona tu repo de GitHub
4. **NO hagas deploy aún** - primero configura variables

### Configurar Variables de Entorno

En "Environment Variables":

```bash
DATABASE_URL=mysql://usuario:pass@host:3306/db
JWT_SECRET=[genera uno con el comando abajo]
NODE_ENV=production
```

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado (aleatorio y seguro)
- [ ] Variables aplicadas a "Production"

### Deploy!

4. Click "Deploy"
5. Esperar 2-3 minutos

- [ ] Build exitoso (sin errores)
- [ ] URL de Vercel funcionando

## 🗄️ 4. Inicializar Base de Datos

### Desde tu computadora (recomendado):

```bash
# Editar .env con DATABASE_URL de producción
DATABASE_URL="mysql://..." # El mismo de Vercel

# Ejecutar migraciones y seed
npm run db:setup
```

### Desde Vercel CLI (alternativa):

```bash
npm i -g vercel
vercel login
vercel link
vercel exec npm run db:setup
```

- [ ] Migraciones ejecutadas sin errores
- [ ] Datos iniciales cargados (4 clientes, 5 usuarios)

## 🔐 5. Verificar Funcionamiento

1. Abre tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Debería aparecer la página de login
3. Probar login admin:
   - Email: `admin@agrowth.com`
   - Password: `admin123456`
4. Verificar que carga el dashboard
5. Ir a `/admin` y verificar que muestra las organizaciones

- [ ] Página de login carga
- [ ] Login admin funciona
- [ ] Dashboard principal carga
- [ ] `/admin` funciona y muestra organizaciones
- [ ] Se pueden ver los 4 clientes (LemonTech, Del Mundo, Gullich, Falda del Carmen)

## 🔒 6. Seguridad Post-Deploy

**IMPORTANTE - Hacer esto inmediatamente:**

### Cambiar Contraseñas

```bash
# Opción 1: Desde /admin
Login como admin → /admin → Tab "Usuarios" → Editar cada usuario

# Opción 2: SQL directo en PlanetScale
UPDATE users SET hashedPassword = '[nuevo-hash]' WHERE email = 'admin@agrowth.com';
```

- [ ] Contraseña del admin cambiada
- [ ] Contraseñas de clientes cambiadas (o usuarios eliminados si no se usan)

### Verificar JWT Secret

- [ ] `JWT_SECRET` es aleatorio (no es el default)
- [ ] `JWT_SECRET` tiene al menos 32 caracteres

## 🌐 7. Dominio Personalizado (Opcional)

Si quieres usar tu propio dominio:

1. Vercel Dashboard → Tu proyecto → Settings → Domains
2. Agregar dominio: `dashboard.tudominio.com`
3. Configurar DNS según instrucciones de Vercel
4. Esperar propagación (5-30 minutos)

- [ ] Dominio agregado en Vercel
- [ ] DNS configurado
- [ ] Dominio funciona correctamente

## 📊 8. Monitoreo

### Verificar que todo funciona:

- [ ] Login funciona
- [ ] Logout funciona
- [ ] Dashboard carga métricas (o muestra mensaje si no hay Sheet configurado)
- [ ] Panel de admin accesible
- [ ] Crear una organización de prueba funciona
- [ ] Crear un usuario de prueba funciona
- [ ] Login como cliente funciona

### Revisar Logs

- [ ] Ir a Vercel → Tu proyecto → Logs
- [ ] No hay errores críticos en los logs
- [ ] API responde correctamente

## 🎉 9. Post-Deploy

### Configurar Organizaciones

Para cada cliente real:

1. Login como admin → `/admin`
2. Editar organización
3. Configurar Google Sheet ID real
4. Crear/editar funnels según el sheet real
5. Crear usuario cliente con email real
6. Enviar credenciales al cliente

- [ ] Sheets reales configurados (o dejados con demo)
- [ ] Usuarios reales creados con emails correctos

### Documentar

- [ ] Guardar las URLs importantes:
  - URL de Vercel: `_______________________`
  - URL de PlanetScale: `_______________________`
  - Email admin: `admin@agrowth.com`

- [ ] Documentar contraseñas en lugar seguro (1Password, LastPass, etc.)

## 🚨 Troubleshooting

### Si algo falla:

1. **Página en blanco**:
   - F12 → Console → Ver errores
   - Vercel → Logs → Ver errores de API

2. **API no responde**:
   - Verificar `DATABASE_URL` en Vercel
   - Verificar que la base de datos está accesible
   - Ver Vercel → Functions → Logs

3. **Login no funciona**:
   - Verificar que `db:seed` se ejecutó correctamente
   - Verificar `JWT_SECRET` está configurado
   - Ver logs de la API en Vercel

4. **Build failed**:
   - Ver logs del build en Vercel
   - Verificar que `vercel.json` existe
   - Verificar que todas las dependencias están en `package.json`

## 📞 Ayuda

Si necesitas ayuda:
- Ver `VERCEL_DEPLOY.md` para guía detallada
- Ver `SETUP.md` para problemas de base de datos
- Contactar al equipo de desarrollo

---

## ✅ Deploy Completado

Si marcaste todas las casillas importantes, ¡tu dashboard está en producción!

🎉 Felicitaciones, el sistema multi-tenant está funcionando en:

**URL**: https://tu-proyecto.vercel.app

**Próximos pasos**:
1. Configurar Google Sheets reales por cliente
2. Crear usuarios con emails reales
3. Cambiar todas las contraseñas
4. Configurar dominio personalizado
5. Monitorear uso y rendimiento
