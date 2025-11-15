# 🚀 Guía Definitiva: Deploy de AstroShibaPop en Vercel

**Última actualización:** Noviembre 2025 - Basado en las mejores prácticas actuales

---

## ⚠️ ANTES DE EMPEZAR - LEE ESTO

El error que estás viendo:
```
ERR_PNPM_UNSUPPORTED_ENGINE: Your pnpm version is incompatible
Expected version: >=8.0.0
Got: 6.35.1
```

**Significa que NO has configurado el Root Directory correctamente.**

---

## 🎯 Solución 1: Deploy con Root Directory (MÁS SIMPLE)

### Paso 1: Ve a Vercel Dashboard

1. Abre tu navegador
2. Ve a https://vercel.com/new
3. Inicia sesión con tu cuenta

### Paso 2: Importa el Repositorio

1. Click en "Add New..." → "Project"
2. Selecciona tu proveedor Git (GitHub/GitLab/Bitbucket)
3. Busca "Astro-Shiba-Pop"
4. Click en "Import"

### Paso 3: ⚠️ CONFIGURACIÓN CRÍTICA

**ESTA ES LA PARTE MÁS IMPORTANTE:**

En la pantalla de configuración del proyecto, verás varias secciones:

#### A) Root Directory
```
┌─────────────────────────────────────┐
│ Root Directory                       │
│ ┌─────────────────────────────────┐ │
│ │ ./                        [Edit]│ │ ← Click aquí en "Edit"
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

1. **Click en "Edit"** junto a "Root Directory"
2. **BORRA** `./`
3. **ESCRIBE** exactamente: `frontend`
4. **Click en "Save"** o presiona Enter

**RESULTADO ESPERADO:**
```
┌─────────────────────────────────────┐
│ Root Directory                       │
│ ┌─────────────────────────────────┐ │
│ │ frontend                  [Edit]│ │ ← Debe decir "frontend"
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### B) Framework Preset
```
┌─────────────────────────────────────┐
│ Framework Preset                     │
│ ┌─────────────────────────────────┐ │
│ │ Next.js               ✓         │ │ ← Debe detectar Next.js
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- **Debe auto-detectar "Next.js"**
- Si no lo detecta, selecciónalo manualmente del dropdown

#### C) Build Settings

**NO CAMBIES NADA AQUÍ** - El archivo `frontend/vercel.json` tiene los comandos correctos:
```
Build Command: (Detectado automáticamente)
Output Directory: .next
Install Command: (Detectado automáticamente)
```

### Paso 4: Variables de Entorno

Click en "Environment Variables" y agrega:

**Variable 1:**
```
Name:  NEXT_PUBLIC_NETWORK
Value: testnet
```

**Variable 2:**
```
Name:  NEXT_PUBLIC_API_URL
Value: http://localhost:4000/graphql
```
*(Puedes cambiarlo después cuando tengas el backend deployado)*

**Variable 3 (OPCIONAL - Solución para pnpm):**
```
Name:  ENABLE_EXPERIMENTAL_COREPACK
Value: 1
```
*(Esto habilita Corepack para usar exactamente pnpm 8.15.0)*

### Paso 5: Deploy! 🚀

1. **VERIFICA** que Root Directory = `frontend`
2. Click en el botón azul "**Deploy**"
3. Espera 2-4 minutos

### Paso 6: Verifica el Build

En los logs deberías ver:

✅ **BUILD CORRECTO:**
```bash
Cloning github.com/nunalabs/Astro-Shiba-Pop
Running "vercel build"
Vercel CLI 48.10.2

Running "install" command: cd ../.. && pnpm install...
✓ Dependencies installed

Running "build" command: cd ../.. && pnpm --filter=frontend build...
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Build Completed
```

❌ **BUILD INCORRECTO** (si ves esto, NO configuraste Root Directory):
```bash
> Detected Turbo. Adjusting default settings...   ← MAL!
Running "install" command: pnpm install...
ERR_PNPM_UNSUPPORTED_ENGINE                      ← MAL!
```

---

## 🎯 Solución 2: Deploy con Corepack (ALTERNATIVA)

Si la Solución 1 falla, intenta esta:

### Paso 1: Configura Root Directory = `frontend` (igual que antes)

### Paso 2: Agrega Variables de Entorno Adicionales

En "Environment Variables":

```
ENABLE_EXPERIMENTAL_COREPACK=1
COREPACK_ENABLE_STRICT=0
```

### Paso 3: Deploy

Esto forzará a Vercel a usar exactamente pnpm 8.15.0 especificado en `package.json`.

---

## 🎯 Solución 3: Deploy desde Vercel CLI

Si prefieres usar la terminal:

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Ve a la carpeta frontend
cd frontend

# 4. Deploy
vercel

# Sigue las instrucciones:
# - Set up and deploy? → Yes
# - Which scope? → [Tu cuenta]
# - Link to existing project? → No
# - Project name? → astro-shiba-pop
# - Directory? → ./  (ya estás en frontend/)
# - Override settings? → No
```

**Para producción:**
```bash
cd frontend
vercel --prod
```

---

## 🔍 Troubleshooting

### ❌ Error: "Detected Turbo" en los logs

**Problema:** Root Directory NO está configurado a `frontend`

**Solución:**
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → General
3. Busca "Root Directory"
4. Click "Edit"
5. Cambia a `frontend`
6. Click "Save"
7. **Redeploy** desde Deployments → (tres puntos) → Redeploy

### ❌ Error: "ERR_PNPM_UNSUPPORTED_ENGINE"

**Problema:** Mismo que arriba - Root Directory incorrecto

**Solución:** Configura Root Directory = `frontend`

### ❌ Error: "Cannot find module '@astroshibapop/shared-types'"

**Problema:** Este paquete ya fue removido del frontend

**Solución:**
1. Pull los últimos cambios del repositorio
2. Redeploy

### ❌ Build exitoso pero página en blanco

**Solución:**
1. Abre DevTools (F12) → Console
2. Busca errores de API
3. Verifica que `NEXT_PUBLIC_API_URL` esté configurado
4. Recuerda: el frontend usa datos mock, no necesitas backend para probar la UI

---

## ✅ Checklist Pre-Deploy

Antes de hacer click en "Deploy":

- [ ] Root Directory configurado a `frontend` ⚠️ **CRÍTICO**
- [ ] Framework detectado como Next.js
- [ ] Variable `NEXT_PUBLIC_NETWORK=testnet` agregada
- [ ] Variable `NEXT_PUBLIC_API_URL` agregada (puede ser placeholder)
- [ ] (Opcional) `ENABLE_EXPERIMENTAL_COREPACK=1` agregada

---

## 📋 Checklist Post-Deploy

Después de deploy exitoso:

- [ ] Build completó sin errores
- [ ] Visitaste la URL de Vercel
- [ ] Página principal carga correctamente
- [ ] Header de navegación funciona
- [ ] Todas las páginas son accesibles:
  - [ ] Home (/)
  - [ ] Create Token (/create)
  - [ ] Swap (/swap)
  - [ ] Pools (/pools)
  - [ ] Tokens (/tokens)
  - [ ] Leaderboard (/leaderboard)
- [ ] Botón "Connect Wallet" responde al click
- [ ] Datos mock se muestran correctamente

---

## 🎨 Características Disponibles (Frontend Solo)

**✅ Lo que FUNCIONA sin backend:**
- Todas las páginas y navegación
- UI completa y responsive
- Conexión de wallet Freighter
- Datos de ejemplo/mock en todas las secciones

**❌ Lo que NO funciona sin backend:**
- Crear tokens reales
- Swaps reales
- Agregar/quitar liquidez real
- Leaderboard con datos reales
- Stats en tiempo real

**Para funcionalidad completa:** Deploy backend + contratos (ver `DEPLOYMENT_GUIDE.md`)

---

## 🆘 ¿Aún tienes problemas?

### Opción A: Verifica la Configuración Visualmente

1. Ve a https://vercel.com/dashboard
2. Click en tu proyecto "astro-shiba-pop"
3. Settings → General
4. Scroll hasta "Root Directory"
5. **DEBE** decir `frontend`
6. Si no, editalo y guarda
7. Ve a Deployments → Click en el último → Redeploy

### Opción B: Elimina y Recrea el Proyecto

1. Ve a Settings → General
2. Scroll hasta el final
3. "Delete Project"
4. Vuelve a importar desde cero siguiendo Solución 1

### Opción C: Comparte los Logs

Si nada funciona, copia y comparte:
1. Los primeras 50 líneas del Build Log
2. Un screenshot de la sección "Root Directory" en Settings
3. Tu `package.json` del frontend

---

## 📚 Recursos Adicionales

- **Vercel Monorepo Docs:** https://vercel.com/docs/monorepos
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Guía Completa del Proyecto:** Ver `DEPLOYMENT_GUIDE.md`
- **Reporte de Issues:** https://github.com/nunalabs/Astro-Shiba-Pop/issues

---

## 💡 Pro Tips

1. **Preview Deployments:** Cada PR automáticamente crea un preview deployment
2. **Custom Domain:** Agrega tu dominio en Settings → Domains
3. **Analytics:** Habilita Vercel Analytics para métricas
4. **Logs en Tiempo Real:** Ve a tu proyecto → Deployments → (click en uno) → Function Logs

---

**¡Éxito con tu deployment!** 🚀
