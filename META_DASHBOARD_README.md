# Meta Ads Analytics Dashboard 📊

Dashboard interactivo completo para visualizar y analizar el rendimiento de tus campañas de Meta Ads (Facebook/Instagram) con actualización automática, selector de fechas y visualizaciones avanzadas.

![Meta Dashboard](https://img.shields.io/badge/Meta-Ads-1877F2?style=for-the-badge&logo=meta)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-222?style=for-the-badge&logo=github)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-FF6384?style=for-the-badge&logo=chartdotjs)

## ✨ Características

### 📈 Visualizaciones Dinámicas
- **Gráfica de gasto temporal**: Visualiza tu inversión publicitaria a lo largo del tiempo
- **Distribución por dispositivo**: Pie chart con el desglose mobile/desktop/tablet
- **Performance metrics**: Líneas múltiples mostrando clicks, conversions e impressions
- **Top países**: Tabla con los países de mejor rendimiento
- **Campañas detalladas**: Tabla completa con todas tus campañas y sus métricas

### 🎯 Métricas Completas
- **Performance**: Impressions, Clicks, CTR, Conversions, Conversion Rate
- **Presupuesto**: Spend, CPC, CPM, Cost per Conversion
- **Audiencia**: Reach, Frequency, Engagement
- **Demografía**: Por edad, género, país, dispositivo

### ⚡ Funcionalidades
- ✅ Selector de períodos (7, 30, 90 días)
- ✅ Actualización automática diaria vía GitHub Actions
- ✅ Dashboard responsive (mobile-friendly)
- ✅ Diseño moderno inspirado en el dashboard de referencia
- ✅ Sin necesidad de backend o base de datos
- ✅ Hosting gratuito en GitHub Pages

## 📸 Vista Previa

El dashboard se ve exactamente como el dashboard de referencia que compartiste, con:
- Header con selector de fechas y botón de refresh
- Cards de métricas con bordes de colores
- Gráficas interactivas con Chart.js
- Tablas con hover effects y diseño limpio
- Colores corporativos de Meta (azul y rojo)

## 🚀 Inicio Rápido

### 1. Clonar o Descargar el Proyecto

Ya tienes el proyecto configurado en:
```
/Users/amirgomez/Ad variations creation/Test 1/
```

### 2. Renovar el Token de Meta (⚠️ IMPORTANTE)

Tu token actual expiró. Sigue las instrucciones en `RENOVAR_TOKEN_META.md`:

```bash
# Ver instrucciones completas
cat RENOVAR_TOKEN_META.md
```

**Resumen rápido**:
1. Ve a https://developers.facebook.com/tools/explorer/
2. Genera un nuevo token con permisos `ads_read`, `ads_management`, `business_management`
3. Actualiza tu archivo `.env`:

```bash
META_ACCESS_TOKEN=tu_nuevo_token_aqui
META_AD_ACCOUNT_ID=act_655164846858616
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Exportar Métricas

```bash
python3 meta_metrics_exporter.py
```

Esto generará:
- `dashboard/data/metrics.json` (30 días)
- `dashboard/data/metrics_7d.json` (7 días)
- `dashboard/data/metrics_90d.json` (90 días)

### 5. Ver el Dashboard Localmente

```bash
cd dashboard
python3 -m http.server 8000
```

Abre tu navegador en: **http://localhost:8000**

## 📁 Estructura del Proyecto

```
meta-ads-dashboard/
│
├── dashboard/                      # Dashboard frontend
│   ├── index.html                 # Página principal del dashboard
│   ├── app.js                     # Lógica y visualizaciones (Chart.js)
│   └── data/                      # Datos JSON generados
│       ├── metrics.json           # Últimos 30 días
│       ├── metrics_7d.json        # Últimos 7 días
│       └── metrics_90d.json       # Últimos 90 días
│
├── .github/                       # GitHub Actions workflows
│   └── workflows/
│       └── update-metrics.yml     # Auto-actualización diaria
│
├── meta_metrics_exporter.py       # Script Python para extraer métricas de Meta API
├── requirements.txt               # Dependencias Python
├── .env                          # Credenciales (NO SUBIR A GIT)
├── .gitignore                    # Archivos a ignorar por Git
│
├── META_DASHBOARD_README.md       # Este archivo (README principal)
├── DASHBOARD_README.md            # Documentación técnica del dashboard
└── RENOVAR_TOKEN_META.md          # Guía para renovar token de Meta
```

## 🌐 Despliegue en GitHub Pages

### Paso 1: Crear Repositorio

```bash
git init
git add .
git commit -m "Initial commit: Meta Ads Dashboard"
git remote add origin https://github.com/TU_USUARIO/meta-ads-dashboard.git
git push -u origin main
```

### Paso 2: Habilitar GitHub Pages

1. Ve a tu repo > **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**
4. Folder: **/dashboard**
5. Click **Save**

Tu dashboard estará en: `https://TU_USUARIO.github.io/meta-ads-dashboard/`

### Paso 3: Configurar GitHub Actions (Actualización Automática)

1. Ve a **Settings** > **Secrets and variables** > **Actions**
2. Click "**New repository secret**"
3. Agrega estos secrets:

| Name | Value |
|------|-------|
| `META_ACCESS_TOKEN` | Tu token de Meta (usa un System User token para que no expire) |
| `META_AD_ACCOUNT_ID` | `act_655164846858616` |

4. El workflow se ejecutará automáticamente:
   - ⏰ Cada día a las 9 AM UTC
   - 🖱️ Manualmente desde la pestaña "Actions"
   - 🔄 En cada push a main

## 📊 Métricas Disponibles

### Métricas Principales
| Métrica | Descripción |
|---------|-------------|
| **Impressions** | Veces que se mostró tu ad |
| **Clicks** | Clicks totales en tus ads |
| **CTR** | Click-Through Rate (%) |
| **Conversions** | Acciones completadas |
| **Spend** | Gasto total en USD |
| **CPC** | Costo promedio por click |
| **CPM** | Costo por 1,000 impressions |
| **Cost/Conv** | Costo por conversión |
| **Conv Rate** | Tasa de conversión (%) |

### Insights Demográficos
- Por **edad** y **género**
- Por **país** (top 10)
- Por **dispositivo** (mobile, desktop, tablet)

### Datos de Campañas
Para cada campaña activa:
- Nombre y objetivo
- Métricas de performance completas
- Estado (Active, Paused, etc.)

## 🎨 Personalización

### Cambiar Colores del Dashboard

Edita `dashboard/index.html` y busca las clases de Tailwind:

```html
<!-- Color principal (actualmente rojo de Meta) -->
<div class="bg-red-600"></div>
<div class="border-l-red-600"></div>

<!-- Cambiar a azul -->
<div class="bg-blue-600"></div>
<div class="border-l-blue-600"></div>
```

### Agregar Más Períodos de Fecha

1. **En `dashboard/index.html`** agrega opciones:
```html
<option value="180d">Last 6 months</option>
<option value="365d">Last year</option>
```

2. **En `meta_metrics_exporter.py`** exporta esos períodos:
```python
exporter.export_all_metrics(days=180, output_file='dashboard/data/metrics_180d.json')
```

3. **En `dashboard/app.js`** actualiza el fileMap:
```javascript
const fileMap = {
    '180d': 'data/metrics_180d.json',
    '365d': 'data/metrics_365d.json'
};
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** + **CSS3** - Estructura y estilos
- **Tailwind CSS** (via CDN) - Framework CSS utility-first
- **JavaScript (Vanilla)** - Lógica de la aplicación
- **Chart.js 4.4.0** - Visualizaciones interactivas

### Backend/API
- **Python 3.9+** - Script de extracción
- **facebook-business SDK** - Conexión a Meta Marketing API
- **python-dotenv** - Manejo de variables de entorno

### DevOps
- **GitHub Pages** - Hosting gratuito
- **GitHub Actions** - CI/CD para actualización automática

## 🔧 Solución de Problemas

### El dashboard no carga datos

**Causa**: Los archivos JSON no existen o están vacíos.

**Solución**:
```bash
# Verifica que existan los archivos
ls -la dashboard/data/

# Si no existen, ejecuta el exportador
python3 meta_metrics_exporter.py
```

### Error "Access Token Expired"

**Causa**: Tu token de Meta expiró (esto pasó el 12/Feb/2026).

**Solución**: Sigue las instrucciones en `RENOVAR_TOKEN_META.md` para generar un nuevo token.

### GitHub Actions falla

**Causa**: Los secrets no están configurados correctamente.

**Solución**:
1. Ve a Settings > Secrets > Actions
2. Verifica que `META_ACCESS_TOKEN` y `META_AD_ACCOUNT_ID` estén correctos
3. Usa un **System User token** (no expira) en lugar de un user token

### El dashboard se ve roto

**Causa**: Estás abriendo el HTML directamente sin servidor HTTP.

**Solución**: Usa un servidor HTTP:
```bash
cd dashboard
python3 -m http.server 8000
```

## 📖 Documentación Adicional

- **[DASHBOARD_README.md](./DASHBOARD_README.md)**: Documentación técnica completa del dashboard
- **[RENOVAR_TOKEN_META.md](./RENOVAR_TOKEN_META.md)**: Guía paso a paso para renovar tu token de Meta
- **[GET_NEW_TOKEN.md](./GET_NEW_TOKEN.md)**: Instrucciones originales para obtener tokens

## 🎯 Próximos Pasos

1. ✅ ~~Crear el dashboard con visualizaciones~~
2. ✅ ~~Implementar selector de fechas~~
3. ✅ ~~Configurar GitHub Actions~~
4. ✅ ~~Documentar el proyecto~~
5. ⬜ **Renovar token de Meta** (tu siguiente paso)
6. ⬜ Exportar métricas reales
7. ⬜ Subir a GitHub
8. ⬜ Configurar GitHub Pages
9. ⬜ Configurar secrets para GitHub Actions

## 🤝 Basado en

Este dashboard está inspirado en el diseño y funcionalidad de tu **marketing-dashboard** multi-tenant, adaptado específicamente para Meta Ads con:
- Mismo estilo visual (Tailwind CSS, cards, colores)
- Mismo tipo de gráficas (Chart.js similar a Recharts)
- Mismo selector de fechas
- Misma estructura de métricas y tablas

## 📝 Licencia

MIT License - Libre para usar y modificar.

---

**Dashboard desarrollado para análisis de campañas de Meta Ads**

¿Preguntas? Revisa la documentación adicional o los comentarios en el código.
