# 🔑 Métodos Alternativos para Generar Token de Meta

El Graph API Explorer no está disponible. Aquí hay **4 alternativas**:

---

## ✅ Opción 1: Desde la Configuración de tu App (MÁS FÁCIL)

### Pasos:

1. Ve a: **https://developers.facebook.com/apps/**

2. Selecciona tu app: **"Bot Access Data"**

3. En el menú lateral izquierdo, busca:
   - **"Tools and Support"**
   - O **"App Dashboard"** → **"Tools"**

4. Busca una opción que diga:
   - **"Access Token Tool"**
   - O **"Get User Access Token"**

5. Genera un token con estos permisos:
   - ✅ ads_read
   - ✅ ads_management
   - ✅ business_management

---

## ✅ Opción 2: Desde Meta Business Manager (RECOMENDADO - Token Permanente)

### Pasos:

1. Ve a: **https://business.facebook.com/**

2. Selecciona tu Business (si tienes uno)

3. Click en el ícono ⚙️ **Settings** (arriba a la derecha)

4. En el menú lateral:
   - **Users** → **System Users**

5. Click **"Add"** para crear un nuevo System User:
   - Nombre: "Meta Dashboard API"
   - Role: Employee

6. Una vez creado:
   - Click en el System User
   - **"Assign Assets"** → **"Ad Accounts"**
   - Selecciona tu cuenta: `act_655164846858616`
   - Permisos: **"Manage campaigns"**

7. Click **"Generate New Token"**:
   - Selecciona tu app: "Bot Access Data"
   - Permisos:
     - ✅ ads_read
     - ✅ ads_management
     - ✅ business_management
   - **Expiration: Never** (¡No expira!)

8. **COPIA EL TOKEN** inmediatamente (no podrás verlo después)

9. Pégalo en tu `.env`:
   ```bash
   META_ACCESS_TOKEN=EL_TOKEN_QUE_COPIASTE
   ```

**VENTAJA:** Este token **NUNCA expira** 🎉

---

## ✅ Opción 3: Desde la URL de tu App

Puedes generar un token usando esta URL directa:

### URL:

```
https://developers.facebook.com/tools/accesstoken/?app_id=TU_APP_ID
```

**Pasos:**

1. Obtén tu App ID:
   - Ve a https://developers.facebook.com/apps/
   - Click en tu app "Bot Access Data"
   - En "App Settings" → "Basic", copia el **App ID**

2. Reemplaza `TU_APP_ID` en la URL de arriba

3. Abre la URL en tu navegador

4. Genera el token con los permisos necesarios

---

## ✅ Opción 4: Usar un Token de Larga Duración (60 días)

Si ya tuvieras un token de corta duración (1-2 horas), podrías convertirlo en uno de larga duración (60 días) con este comando:

```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_TOKEN_CORTO"
```

**Necesitas:**
- App ID
- App Secret (en App Settings → Basic)
- Un token de corta duración

---

## 🎯 MI RECOMENDACIÓN

**Prueba en este orden:**

1. **PRIMERO**: Opción 2 (Business Manager → System User)
   - ✅ Token permanente (nunca expira)
   - ✅ Más seguro
   - ✅ Ideal para automatización

2. **SEGUNDO**: Opción 1 (Desde tu App)
   - ✅ Rápido
   - ⚠️ Expira en 60 días

3. **TERCERO**: Opción 3 (URL directa)
   - ✅ Rápido
   - ⚠️ Expira en 60 días

---

## 📞 ¿Tienes acceso a Business Manager?

Verifica si tienes acceso:

1. Ve a: **https://business.facebook.com/**

2. ¿Ves un Business?
   - ✅ SÍ → Usa **Opción 2** (System User)
   - ❌ NO → Usa **Opción 1** (Desde tu App)

---

## 🆘 Si Nada Funciona

Como última opción, podemos:

1. **Crear una nueva app de Meta** desde cero
2. **Esperar a que el Graph API Explorer se restablezca** (puede ser temporal)
3. **Usar el método OAuth manual** (más técnico)

---

¿Cuál opción quieres probar primero?
