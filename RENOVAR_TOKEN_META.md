# Cómo Renovar el Token de Acceso de Meta

Tu token de Meta expiró el **12 de febrero de 2026**. Sigue estos pasos para generar un nuevo token.

## Opción 1: Token de Usuario (Rápido, expira en 60 días)

### Paso 1: Ir a Graph API Explorer
1. Ve a [Meta for Developers - Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Inicia sesión con tu cuenta de Facebook/Meta

### Paso 2: Seleccionar la Aplicación
1. En "Meta App" (arriba derecha), selecciona tu aplicación de ads
2. Si no tienes una app, necesitas crear una primero en [Meta for Developers](https://developers.facebook.com/apps)

### Paso 3: Generar Token
1. Click en "Generate Access Token"
2. Selecciona los siguientes permisos:
   - ✅ `ads_read` - Leer datos de ads
   - ✅ `ads_management` - Administrar ads
   - ✅ `business_management` - Gestionar Business Manager
3. Click en "Generate Access Token"
4. Autoriza los permisos
5. **Copia el token** (se ve así: `EAABwz...`)

### Paso 4: Actualizar el Archivo .env
1. Abre el archivo `.env` en tu proyecto
2. Reemplaza el token antiguo:

```bash
META_ACCESS_TOKEN=PEGA_TU_NUEVO_TOKEN_AQUI
META_AD_ACCOUNT_ID=act_655164846858616
```

### Paso 5: Verificar el Token
Ejecuta el script de prueba:

```bash
python test_token.py
```

Si ves tus ad accounts, ¡funcionó!

---

## Opción 2: Token de Larga Duración (No expira, recomendado)

Para un token que no expire (ideal para GitHub Actions), necesitas crear un **System User Token**.

### Paso 1: Crear System User

1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Settings (⚙️) > Users > System Users
3. Click "Add" para crear un nuevo System User
4. Nombre: "Meta Ads Dashboard Bot" (o el que prefieras)
5. Role: "Employee"
6. Click "Create System User"

### Paso 2: Asignar Permisos al System User

1. Selecciona el System User que acabas de crear
2. Click "Assign Assets"
3. En "Ad Accounts", selecciona tu ad account (`act_655164846858616`)
4. Permisos: Selecciona "Manage ads"
5. Click "Save Changes"

### Paso 3: Generar Token de Sistema

1. Aún en el System User, click "Generate New Token"
2. Selecciona tu App
3. Selecciona los permisos:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management`
4. Token expiration: Selecciona "Never" (Nunca)
5. Click "Generate Token"
6. **⚠️ IMPORTANTE**: Copia el token inmediatamente y guárdalo en un lugar seguro
   - No podrás verlo de nuevo
   - Es como una contraseña

### Paso 4: Actualizar .env y GitHub Secrets

**Para uso local** (archivo `.env`):
```bash
META_ACCESS_TOKEN=EL_TOKEN_DE_SISTEMA_QUE_COPIASTE
META_AD_ACCOUNT_ID=act_655164846858616
```

**Para GitHub Actions** (GitHub Secrets):
1. Ve a tu repositorio en GitHub
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Nombre: `META_ACCESS_TOKEN`
5. Value: Pega el token de sistema
6. Click "Add secret"
7. Repite para `META_AD_ACCOUNT_ID` con valor `act_655164846858616`

---

## Verificar que Funciona

### Prueba 1: Verificar Conexión
```bash
python test_account_access.py
```

Deberías ver:
```
✅ Acceso exitoso al Ad Account
Account ID: act_655164846858616
Account Name: [Nombre de tu cuenta]
```

### Prueba 2: Exportar Métricas
```bash
python meta_metrics_exporter.py
```

Deberías ver:
```
Exportando métricas de los últimos 30 días...
✅ Métricas exportadas a: dashboard/data/metrics.json
   - Período: 2026-XX-XX a 2026-XX-XX
   - Gasto total: $XXX.XX
   - Clicks totales: X,XXX
   - Conversiones: XX
   - Campañas: X
```

---

## Solución de Problemas

### Error: "Invalid OAuth access token"
- El token está mal copiado o expiró
- Genera un nuevo token siguiendo los pasos arriba
- Asegúrate de copiar el token completo (suelen ser muy largos)

### Error: "Permissions error"
- El token no tiene los permisos necesarios
- Regenera el token incluyendo todos los permisos: `ads_read`, `ads_management`, `business_management`

### Error: "Cannot access ad account"
- Verifica que tienes acceso al ad account `act_655164846858616`
- Asegúrate de que el System User (si usaste uno) tiene permisos sobre ese ad account

### ¿Cuándo expira mi token?

**Token de usuario**: Expira en 60 días. Verás la fecha de expiración en el error cuando falle.

**Token de sistema**: Si seleccionaste "Never", no expira. ¡Recomendado para automatización!

Para verificar cuándo expira tu token actual:
1. Ve a [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Pega tu token
3. Click "Debug"
4. Verás "Expires" con la fecha

---

## Mejor Práctica: Usar Variables de Entorno

**Nunca** compartas o subas tu token a GitHub (está en `.gitignore`).

Para GitHub Actions, usa GitHub Secrets (ya configurados arriba).

Para desarrollo local, usa el archivo `.env`:
```bash
META_ACCESS_TOKEN=tu_token_aqui
META_AD_ACCOUNT_ID=act_655164846858616
```

---

## Recursos

- [Meta Marketing API - Get Started](https://developers.facebook.com/docs/marketing-api/get-started)
- [Meta Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/)
- [System Users](https://www.facebook.com/business/help/503306463479099)
- [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

---

¿Necesitas ayuda? Revisa los errores en la consola o contacta soporte de Meta Developer.
