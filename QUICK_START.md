# 🚀 Inicio Rápido - Meta Ads Dashboard

## ✅ Lo que se creó

### 📊 Dashboard Completo
```
dashboard/
├── index.html       # Dashboard interactivo con visualizaciones
├── app.js          # Lógica de gráficas y métricas (Chart.js)
└── data/           # Carpeta para JSON de métricas
    ├── .gitkeep
    ├── metrics.json      # 30 días (con datos demo)
    ├── metrics_7d.json   # 7 días (vacío)
    └── metrics_90d.json  # 90 días (vacío)
```

### 🐍 Script de Extracción
- `meta_metrics_exporter.py` - Extrae métricas de Meta API y genera JSON

### ⚙️ Automatización
- `.github/workflows/update-metrics.yml` - GitHub Actions para actualización diaria

### 📚 Documentación
- `META_DASHBOARD_README.md` - README principal del proyecto
- `DASHBOARD_README.md` - Documentación técnica del dashboard
- `RENOVAR_TOKEN_META.md` - Guía para renovar tu token de Meta
- `QUICK_START.md` - Esta guía rápida

## 🎯 Tu Próximo Paso (IMPORTANTE)

### ⚠️ Token Expirado

Tu token de Meta **expiró el 12 de febrero de 2026**. Necesitas renovarlo:

```bash
# 1. Lee la guía completa
cat RENOVAR_TOKEN_META.md

# 2. Ve a Meta for Developers
open https://developers.facebook.com/tools/explorer/

# 3. Genera un nuevo token con permisos:
#    ✅ ads_read
#    ✅ ads_management
#    ✅ business_management

# 4. Actualiza tu .env
nano .env
# Pega tu nuevo token
```

## 🔥 Ver el Dashboard AHORA (con datos demo)

El dashboard ya está funcionando con **datos de demostración**:

```bash
# El servidor ya está corriendo en puerto 8000
# Abre tu navegador en:
open http://localhost:8000
```

O si el servidor no está corriendo:
```bash
cd dashboard
python3 -m http.server 8000
open http://localhost:8000
```

**Verás**:
- ✅ Métricas de ejemplo (30 días de datos ficticios)
- ✅ Gráficas funcionando (gasto, dispositivos, performance)
- ✅ Tablas de campañas y países
- ✅ Selector de fechas (7d, 30d, 90d)

## 📝 Pasos para Usar con Datos Reales

### 1️⃣ Renovar Token (5 minutos)
```bash
# Sigue las instrucciones en:
cat RENOVAR_TOKEN_META.md
```

### 2️⃣ Extraer Métricas Reales (1 minuto)
```bash
# Esto conectará a la API de Meta y extraerá tus datos reales
python3 meta_metrics_exporter.py
```

Verás:
```
Exportando métricas de los últimos 30 días...
✅ Métricas exportadas a: dashboard/data/metrics.json
   - Período: 2026-XX-XX a 2026-XX-XX
   - Gasto total: $X,XXX.XX
   - Clicks totales: XX,XXX
   - Conversiones: XXX
   - Campañas: XX
```

### 3️⃣ Actualizar Dashboard (automático)
```bash
# Refresca el navegador (el dashboard carga los nuevos datos automáticamente)
# O haz click en el botón "Refresh" en el dashboard
```

### 4️⃣ Subir a GitHub (10 minutos)
```bash
# Inicializar Git
git init
git add .
git commit -m "Initial commit: Meta Ads Dashboard"

# Crear repo en GitHub y subir
git remote add origin https://github.com/TU_USUARIO/meta-ads-dashboard.git
git push -u origin main
```

### 5️⃣ Configurar GitHub Pages (2 minutos)
1. Ve a tu repo en GitHub
2. Settings > Pages
3. Source: **main** branch
4. Folder: **/dashboard**
5. Save

**Tu dashboard estará en**: `https://TU_USUARIO.github.io/meta-ads-dashboard/`

### 6️⃣ Configurar GitHub Actions (3 minutos)
1. Settings > Secrets and variables > Actions
2. New repository secret:
   - Name: `META_ACCESS_TOKEN`
   - Value: [tu token de Meta]
3. New repository secret:
   - Name: `META_AD_ACCOUNT_ID`
   - Value: `act_655164846858616`

**Listo!** Se actualizará automáticamente cada día a las 9 AM UTC.

## 🎨 Características del Dashboard

### Métricas Principales
- Impressions, Clicks, CTR, Conversions
- Spend, CPC, CPM, Cost/Conv, Conv Rate

### Visualizaciones
- 📊 Gráfica de gasto a lo largo del tiempo
- 🥧 Pie chart de distribución por dispositivo
- 📈 Performance metrics (clicks, conversions, impressions)
- 🌍 Tabla de top países
- 📋 Tabla de todas las campañas

### Selector de Fechas
- Last 7 days
- Last 30 days (default)
- Last 90 days

### Actualización
- Botón "Refresh" para recargar datos
- Auto-actualización diaria con GitHub Actions

## 🛠️ Comandos Útiles

```bash
# Ver el dashboard
cd dashboard && python3 -m http.server 8000

# Extraer métricas de Meta
python3 meta_metrics_exporter.py

# Verificar que tu token funciona
python3 test_token.py

# Ver archivos JSON generados
cat dashboard/data/metrics.json | python3 -m json.tool

# Ver los logs del servidor
# (ya está corriendo en background, ID: 4cf054)
```

## 📖 Documentación Completa

| Archivo | Descripción |
|---------|-------------|
| `META_DASHBOARD_README.md` | README principal con toda la info |
| `DASHBOARD_README.md` | Documentación técnica del dashboard |
| `RENOVAR_TOKEN_META.md` | Cómo renovar tu token de Meta |
| `QUICK_START.md` | Esta guía rápida |

## ❓ Problemas Comunes

### El dashboard no carga
```bash
# Asegúrate de que el servidor HTTP esté corriendo
cd dashboard
python3 -m http.server 8000
```

### Error de token expirado
```bash
# Renueva tu token siguiendo la guía
cat RENOVAR_TOKEN_META.md
```

### GitHub Actions falla
- Verifica que los secrets estén configurados correctamente
- Usa un System User token (no expira) en lugar de user token

## 🎉 ¡Listo!

**Dashboard funcionando**: http://localhost:8000

**Siguiente paso**: Renovar tu token de Meta para obtener datos reales

```bash
cat RENOVAR_TOKEN_META.md
```

---

¿Necesitas ayuda? Revisa la documentación completa en `META_DASHBOARD_README.md`
