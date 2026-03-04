# Meta Ads - Marketing Dashboard

Dashboard interactivo para visualizar métricas de rendimiento de Meta Ads (Facebook/Instagram) con selector de fechas, gráficas y tablas de campañas.

## Vista Previa del Dashboard

El dashboard incluye:
- **Métricas principales**: Impressions, Clicks, CTR, Conversions
- **Métricas secundarias**: Spend, CPC, CPM, Cost/Conversion, Conversion Rate
- **Gráfica de gasto**: Visualización temporal del gasto en ads
- **Distribución por dispositivo**: Pie chart de gasto por mobile/desktop/tablet
- **Performance metrics**: Líneas de tiempo de clicks, conversions e impressions
- **Top países**: Tabla de países con mejor rendimiento
- **Campañas**: Tabla detallada de todas las campañas activas
- **Selector de fechas**: Last 7 days, Last 30 days, Last 90 days

## Estructura del Proyecto

```
dashboard/
├── index.html          # Dashboard principal
├── app.js             # Lógica de la aplicación y visualizaciones
└── data/              # Datos JSON exportados desde Meta API
    ├── metrics.json        # Últimos 30 días
    ├── metrics_7d.json     # Últimos 7 días
    └── metrics_90d.json    # Últimos 90 días

meta_metrics_exporter.py  # Script Python para extraer métricas de Meta API
```

## Configuración Inicial

### 1. Renovar Token de Meta

Tu token actual expiró el 12 de febrero de 2026. Para renovarlo:

1. Ve a [Meta for Developers](https://developers.facebook.com/tools/explorer/)
2. Selecciona tu app
3. Genera un nuevo User Access Token con estos permisos:
   - `ads_read`
   - `ads_management`
   - `business_management`
4. Copia el token y actualiza el archivo `.env`:

```bash
META_ACCESS_TOKEN=tu_nuevo_token_aqui
META_AD_ACCOUNT_ID=act_655164846858616
```

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

Las dependencias necesarias son:
- `facebook-business` - SDK de Meta Marketing API
- `python-dotenv` - Para manejar variables de entorno
- `requests` - Para llamadas HTTP

### 3. Extraer Métricas

Ejecuta el script Python para extraer las métricas de Meta:

```bash
python3 meta_metrics_exporter.py
```

Esto generará 3 archivos JSON en `dashboard/data/`:
- `metrics.json` - Últimos 30 días
- `metrics_7d.json` - Últimos 7 días
- `metrics_90d.json` - Últimos 90 días

### 4. Ver el Dashboard

Opción A: Servidor local Python
```bash
cd dashboard
python3 -m http.server 8000
```

Luego abre: http://localhost:8000

Opción B: Usar Live Server (VS Code extension) o cualquier otro servidor HTTP estático

## Despliegue en GitHub Pages

### Configuración Manual

1. **Crear repositorio en GitHub**:
```bash
git init
git add .
git commit -m "Initial commit: Meta Ads Dashboard"
git remote add origin https://github.com/TU_USUARIO/meta-dashboard.git
git push -u origin main
```

2. **Habilitar GitHub Pages**:
   - Ve a Settings > Pages
   - Source: Deploy from branch
   - Branch: main
   - Folder: /dashboard
   - Save

3. **Tu dashboard estará disponible en**:
   `https://TU_USUARIO.github.io/meta-dashboard/`

### Actualización Automática con GitHub Actions

El proyecto incluye un workflow de GitHub Actions que actualiza automáticamente las métricas.

**Archivo**: `.github/workflows/update-metrics.yml`

**Configurar Secrets en GitHub**:
1. Ve a Settings > Secrets and variables > Actions
2. Agrega estos secrets:
   - `META_ACCESS_TOKEN`: Tu token de Meta
   - `META_AD_ACCOUNT_ID`: Tu Ad Account ID (act_655164846858616)

**El workflow se ejecuta**:
- Automáticamente cada día a las 9 AM UTC
- Manualmente desde la pestaña "Actions" en GitHub
- En cada push a la rama main

## Métricas Incluidas

### Métricas Agregadas
- **Impressions**: Total de veces que se mostraron tus ads
- **Clicks**: Total de clicks en tus ads
- **Spend**: Gasto total en USD
- **CPC** (Cost Per Click): Costo promedio por click
- **CPM** (Cost Per Mille): Costo por 1,000 impressions
- **CTR** (Click-Through Rate): Porcentaje de clicks sobre impressions
- **Reach**: Personas únicas alcanzadas
- **Frequency**: Frecuencia promedio de exposición
- **Conversions**: Total de conversiones
- **Cost per Conversion**: Costo promedio por conversión
- **Conversion Rate**: Porcentaje de conversiones sobre clicks

### Métricas por Campaña
Para cada campaña se muestra:
- Nombre y objetivo
- Impressions, Clicks, Spend
- CTR, Conversions, Conversion Rate

### Insights Demográficos
- **Por edad y género**: Distribución de audiencia
- **Por país**: Top países con mejor rendimiento
- **Por dispositivo**: Mobile, Desktop, Tablet

## Personalización

### Cambiar Colores

Edita `index.html` y busca las clases de Tailwind CSS:
- `bg-red-600` - Color principal (rojo de Meta)
- `border-l-red-600` - Bordes izquierdos de cards
- Puedes cambiar a `bg-blue-600`, `bg-purple-600`, etc.

### Agregar Más Gráficas

En `app.js`, puedes agregar nuevas funciones de gráficas usando Chart.js:

```javascript
function updateCustomChart() {
    const ctx = document.getElementById('customChart');
    new Chart(ctx, {
        type: 'bar', // o 'line', 'pie', 'doughnut'
        data: { /* tus datos */ },
        options: { /* opciones */ }
    });
}
```

### Modificar Períodos de Fecha

Edita el selector en `index.html`:

```html
<select id="datePreset">
    <option value="7d">Last 7 days</option>
    <option value="30d">Last 30 days</option>
    <option value="90d">Last 90 days</option>
    <!-- Agregar nuevos períodos -->
    <option value="180d">Last 6 months</option>
</select>
```

Y actualiza `meta_metrics_exporter.py` para exportar esos períodos.

## Solución de Problemas

### El dashboard no muestra datos

1. Verifica que los archivos JSON existan en `dashboard/data/`
2. Abre la consola del navegador (F12) y revisa errores
3. Asegúrate de estar usando un servidor HTTP (no abrir directamente el archivo HTML)

### Error "Access Token Expired"

Tu token de Meta expiró. Sigue las instrucciones en "Renovar Token de Meta" arriba.

### Error de CORS

Si ves errores de CORS, asegúrate de:
- Usar un servidor HTTP local (no abrir el HTML directamente)
- Los archivos JSON deben estar en la misma carpeta o subdirectorio

### Las gráficas no se renderizan

Verifica que:
- Chart.js se cargó correctamente (revisa la consola)
- Los datos en JSON tienen el formato correcto
- Los canvas elements existen en el HTML

## Próximos Pasos

1. **Renovar tu token de Meta** (expiró el 12/Feb/2026)
2. **Ejecutar `meta_metrics_exporter.py`** para obtener datos reales
3. **Subir a GitHub** y habilitar GitHub Pages
4. **Configurar GitHub Actions** para actualización automática
5. **Personalizar** colores y branding según tu preferencia

## Stack Tecnológico

- **Frontend**: HTML5, CSS3 (Tailwind CSS via CDN), JavaScript
- **Visualizaciones**: Chart.js 4.4.0
- **Backend/API**: Python + facebook-business SDK
- **Despliegue**: GitHub Pages
- **Automatización**: GitHub Actions

## Recursos

- [Meta Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Tailwind CSS](https://tailwindcss.com/)
- [GitHub Pages Guide](https://pages.github.com/)

## Licencia

MIT License - Siéntete libre de usar y modificar este dashboard para tus necesidades.

---

**Desarrollado como referencia del dashboard de marketing multi-tenant**
