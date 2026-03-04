# 🚀 Próximos Pasos - Dashboard de Meta Ads

## ✅ Lo que Ya Tienes

1. ✅ **Dashboard funcionando** con datos demo
   - URL: http://localhost:8000
   - Con visualizaciones, gráficas y tablas

2. ✅ **Script de extracción** de métricas
   - `meta_metrics_exporter.py`

3. ✅ **Cuenta publicitaria configurada**
   - `act_655164846858616` en tu archivo `.env`

4. ✅ **GitHub Actions** listo para deploy

5. ✅ **Documentación completa**

## ⚠️ Lo que Necesitas Hacer AHORA

### Paso 1: Renovar Token de Meta (5 minutos)

Tu token expiró el **12 de febrero de 2026**.

```bash
# Ver instrucciones completas
cat RENOVAR_TOKEN_META.md
```

**Pasos rápidos:**

1. Ve a: https://developers.facebook.com/tools/explorer/

2. Genera token con estos permisos:
   - ✅ ads_read
   - ✅ ads_management
   - ✅ business_management

3. Copia el token (empieza con: EAABwz...)

4. Actualiza tu `.env`:
   ```bash
   nano .env
   ```

   Reemplaza esta línea:
   ```
   META_ACCESS_TOKEN=TU_NUEVO_TOKEN_AQUI
   ```

5. Guarda: Ctrl+O, Enter, Ctrl+X

### Paso 2: Verificar Conexión (1 minuto)

```bash
python3 test_token.py
```

Deberías ver:
```
✅ Token válido
📊 Ad Accounts disponibles:
   - act_655164846858616: [Nombre de tu cuenta]
```

### Paso 3: Ver Todas tus Cuentas Publicitarias (Opcional)

Si tienes múltiples cuentas y quieres elegir cuál usar:

```bash
python3 ver_cuentas_publicitarias.py
```

Esto te mostrará:
- Todas las cuentas a las que tienes acceso
- Cuál está configurada actualmente (✅)
- Nombre, estado, moneda y gasto de cada una

**Para cambiar de cuenta:**
1. Edita `.env`
2. Cambia `META_AD_ACCOUNT_ID=act_XXXXXXXX`
3. Vuelve a extraer métricas

### Paso 4: Extraer Métricas Reales (1 minuto)

```bash
python3 meta_metrics_exporter.py
```

Esto generará:
- ✅ `dashboard/data/metrics.json` (30 días)
- ✅ `dashboard/data/metrics_7d.json` (7 días)
- ✅ `dashboard/data/metrics_90d.json` (90 días)

Verás:
```
✅ Métricas exportadas a: dashboard/data/metrics.json
   - Período: 2026-XX-XX a 2026-XX-XX
   - Gasto total: $X,XXX.XX
   - Clicks totales: XX,XXX
   - Conversiones: XXX
   - Campañas: XX
```

### Paso 5: Ver tu Dashboard con Datos Reales

```bash
# Ya está corriendo en:
open http://localhost:8000

# Click en "Refresh" para cargar los nuevos datos
```

Ahora verás:
- ✅ Tus métricas reales de Meta
- ✅ Tus campañas reales
- ✅ Tu distribución por país/dispositivo
- ✅ Tu gasto real a lo largo del tiempo

## 🌐 Para Publicar en GitHub (Opcional, 15 minutos)

Una vez que tengas datos reales, puedes publicar el dashboard:

### 1. Crear Repositorio en GitHub

```bash
# Inicializar Git
git init
git add .
git commit -m "Initial commit: Meta Ads Dashboard"

# Crear repo en GitHub (ve a github.com/new)
# Luego:
git remote add origin https://github.com/TU_USUARIO/meta-ads-dashboard.git
git push -u origin main
```

### 2. Habilitar GitHub Pages

1. Ve a tu repo en GitHub
2. **Settings** > **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main**
5. Folder: **/dashboard**
6. Click **Save**

Tu dashboard estará en:
`https://TU_USUARIO.github.io/meta-ads-dashboard/`

### 3. Configurar GitHub Actions (Actualización Automática)

1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Click "**New repository secret**"
3. Agrega:
   - Name: `META_ACCESS_TOKEN`
   - Value: [tu token de Meta]
4. Agrega:
   - Name: `META_AD_ACCOUNT_ID`
   - Value: `act_655164846858616`

Ahora el dashboard se actualizará automáticamente:
- ⏰ Cada día a las 9 AM UTC
- 🖱️ Manualmente desde la pestaña "Actions"

## 📋 Checklist Completo

- [ ] Renovar token de Meta
- [ ] Verificar conexión (`python3 test_token.py`)
- [ ] (Opcional) Ver todas las cuentas (`python3 ver_cuentas_publicitarias.py`)
- [ ] Extraer métricas reales (`python3 meta_metrics_exporter.py`)
- [ ] Ver dashboard con datos reales (http://localhost:8000)
- [ ] (Opcional) Subir a GitHub
- [ ] (Opcional) Configurar GitHub Pages
- [ ] (Opcional) Configurar GitHub Actions

## 🎯 Flujo de Trabajo Regular

Una vez configurado, tu flujo será:

**Local (desarrollo):**
```bash
# Actualizar métricas cuando quieras
python3 meta_metrics_exporter.py

# Ver dashboard
open http://localhost:8000
```

**GitHub Pages (producción):**
- Se actualiza automáticamente cada día
- O manualmente desde Actions > Update Meta Ads Metrics > Run workflow

## 📖 Archivos de Ayuda

| Archivo | Para Qué |
|---------|----------|
| `PROXIMOS_PASOS.md` | Este archivo - guía de siguiente paso |
| `RENOVAR_TOKEN_META.md` | Guía completa para renovar token |
| `META_DASHBOARD_README.md` | README principal del proyecto |
| `DASHBOARD_README.md` | Documentación técnica |
| `QUICK_START.md` | Guía de inicio rápido |

## 🆘 Comandos Útiles

```bash
# Ver el dashboard
cd dashboard && python3 -m http.server 8000

# Verificar token
python3 test_token.py

# Ver todas las cuentas publicitarias
python3 ver_cuentas_publicitarias.py

# Extraer métricas
python3 meta_metrics_exporter.py

# Ver datos extraídos
cat dashboard/data/metrics.json | python3 -m json.tool | less

# Editar configuración
nano .env
```

## 🎉 ¡Empieza Aquí!

Tu siguiente paso inmediato:

```bash
# 1. Lee la guía de renovar token
cat RENOVAR_TOKEN_META.md

# 2. Ve a Meta for Developers
open https://developers.facebook.com/tools/explorer/

# 3. Genera tu nuevo token con los permisos necesarios

# 4. Actualiza tu .env
nano .env
```

---

**¿Necesitas ayuda?** Lee la documentación en los archivos .md o revisa los comentarios en el código.
