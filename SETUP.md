# Guía de Instalación y Ejecución Local

## Requisitos Previos

- **Node.js** v18 o superior (tienes v20.20.1 instalado ✅)
- **npm** (viene con Node.js)
- **Git** (ya inicializado ✅)

---

## 1. INICIALIZAR EL PROYECTO VITE

### Opción A: Si el directorio está vacío (sin archivos de Vite)

```bash
# Navegar al directorio del proyecto
cd C:\Users\info\Documents\bomberos

# Crear proyecto Vite con React + TypeScript
npm create vite@latest . -- --template react-ts
```

### Opción B: Si ya tienes archivos de configuración

Verifica que existan estos archivos:
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`

Si NO existen, ejecuta el comando de la Opción A.

---

## 2. INSTALAR DEPENDENCIAS

### Dependencias de Producción (necesarias para que funcione)

```bash
npm install react react-dom react-router-dom @supabase/supabase-js clsx tailwind-merge lucide-react
```

**Qué instala cada una:**
| Paquete | Propósito |
|---------|-----------|
| `react` | Biblioteca principal |
| `react-dom` | Renderizado en DOM |
| `react-router-dom` | Navegación entre páginas |
| `@supabase/supabase-js` | Cliente de Supabase |
| `clsx` | Utilidad para clases CSS |
| `tailwind-merge` | Merge de clases Tailwind |
| `lucide-react` | Iconos |

### Dependencias de Desarrollo (solo para desarrollo)

```bash
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

**Qué instala cada una:**
| Paquete | Propósito |
|---------|-----------|
| `typescript` | Tipos para JavaScript |
| `@types/react` | Tipos de React |
| `@types/react-dom` | Tipos de React DOM |
| `vite` | Bundler y servidor de desarrollo |
| `@vitejs/plugin-react` | Plugin de React para Vite |
| `tailwindcss` | Framework CSS |
| `@tailwindcss/vite` | Plugin de Tailwind para Vite |

---

## 3. CONFIGURACIÓN DE ARCHIVOS

### 3.1 Verificar `vite.config.ts`

Asegúrate de que tenga:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
```

### 3.2 Verificar `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### 3.3 Verificar `index.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cuartel de Bomberos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3.4 Verificar `src/index.css` (Tailwind)

```css
@import "tailwindcss";

@theme {
  --color-primary: #dc2626;
  --color-primary-dark: #b91c1c;
  --color-primary-light: #fecaca;
  --color-secondary: #1e293b;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}
```

---

## 4. ESTRUCTURA DE CARPETAS

Crear la siguiente estructura:

```bash
mkdir -p src/{components/{ui,layout},pages,lib,hooks,types,data}
```

Estructura resultante:
```
src/
├── components/
│   ├── ui/          # Button, Input, Card, etc.
│   └── layout/      # Header, Sidebar, Layout
├── pages/           # Login, Dashboard, etc.
├── lib/             # supabase.ts, utils.ts
├── hooks/           # useAuth.ts, useVehiculos.ts
├── types/           # usuario.ts, vehiculo.ts
├── data/            # mock data (para pruebas locales)
├── App.tsx          # Router principal
├── main.tsx         # Entry point
└── index.css        # Estilos globales + Tailwind
```

---

## 5. EJECUTAR EN MODO DESARROLLO

```bash
npm run dev
```

**Salida esperada:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://TU_IP:5173/
```

Abre tu navegador en: `http://localhost:5173`

---

## 6. PRUEBAS LOCALES (SIN SUPABASE)

### Opción A: Usar datos mock (recomendado para empezar)

Crear archivo `src/data/mock.ts`:

```typescript
export const mockVehiculos = [
  {
    id: '1',
    nombre: 'Móvil 1',
    dominio: 'ABC123',
    tipo: 'camion',
    estado: 'disponible',
    ultimo_km: 15000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Ambulancia',
    dominio: 'XYZ789',
    tipo: 'ambulancia',
    estado: 'disponible',
    ultimo_km: 8500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockUsuario = {
  id: 'user-1',
  nombre: 'Juan',
  apellido: 'Pérez',
  rol: 'admin' as const,
  estado: 'activo' as const,
  es_conductor_habilitado: true,
  es_oficial_autorizante: true,
}
```

### Opción B: Verificar que la app carga

Modificar `src/App.tsx` temporalmente:

```typescript
function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Cuartel de Bomberos
        </h1>
        <p className="text-text-muted">
          Aplicación cargada correctamente ✅
        </p>
        <p className="text-sm text-text-muted mt-2">
          Localhost: 5173
        </p>
      </div>
    </div>
  )
}

export default App
```

---

## 7. CONFIGURAR SUPABASE (CUANDO ESTÉS LISTO)

### 7.1 Crear proyecto en Supabase

1. Ir a https://supabase.com
2. Click en "New Project"
3. Nombre: `cuartel-bomberos`
4. Base de datos password: (crear uno seguro)
5. Region: `South America (São Paulo)` (más cercano a Paraguay)

### 7.2 Obtener credenciales

Una vez creado el proyecto:
1. Ir a **Settings** → **API**
2. Copiar:
   - `URL` (Project URL)
   - `anon` key (public)

### 7.3 Crear archivo `.env.local`

En la raíz del proyecto:

```bash
# Crear archivo .env.local
touch .env.local
```

Contenido:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7.4 Ejecutar migración de base de datos

1. Ir a **SQL Editor** en Supabase
2. Copiar el contenido de `database.md`
3. Ejecutar el SQL
4. Verificar que las tablas se crearon en **Table Editor**

---

## 8. COMANDOS ÚTILES

### Desarrollo
```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Previsualiza la build
npm run lint         # Ejecuta linter
```

### Limpieza
```bash
rm -rf node_modules  # Eliminar node_modules
rm package-lock.json # Eliminar lock file
npm install          # Reinstalar dependencias
```

### Verificar instalación
```bash
npm list --depth=0   # Ver paquetes instalados
node --version       # Ver versión de Node
npm --version        # Ver versión de npm
```

---

## 9. ORDEN RECOMENDADO DE EJECUCIÓN

```bash
# 1. Inicializar proyecto (si no está hecho)
npm create vite@latest . -- --template react-ts

# 2. Instalar dependencias
npm install react react-dom react-router-dom @supabase/supabase-js clsx tailwind-merge lucide-react
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite

# 3. Verificar que funciona
npm run dev

# 4. Abrir navegador
# http://localhost:5173
```

---

## 10. SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "Cannot find module '@vitejs/plugin-react'"
```bash
npm install -D @vitejs/plugin-react
```

### Error: "Failed to load PostCSS config"
```bash
npm install -D tailwindcss @tailwindcss/vite
```

### Error: "Port 5173 is already in use"
Cambiar puerto en `vite.config.ts`:
```typescript
server: {
  port: 3000, // otro puerto
}
```

### La página no carga estilos Tailwind
Verificar que en `src/index.css` tengas:
```css
@import "tailwindcss";
```

---

## 11. CHECKLIST FINAL

Antes de empezar a programar, verifica:

- [ ] Node.js instalado (v20+)
- [ ] Dependencias instaladas (`npm list --depth=0`)
- [ ] `npm run dev` funciona sin errores
- [ ] TailwindCSS carga correctamente (veremos estilos)
- [ ] Estructura de carpetas creada
- [ ] (Opcional) Supabase configurado

---

## 12. SIGUIENTE PASO

Una vez que todo funcione:

1. Confirma que `http://localhost:5173` muestra la app
2. Avísame y continuamos con:
   - Crear componentes base (Button, Input, Card)
   - Configurar React Router
   - Implementar módulo de Vehículos

---

**Nota:** Este proyecto usa TailwindCSS v4 con el nuevo `@import "tailwindcss"` en lugar de las directivas antiguas. Asegúrate de usar `@tailwindcss/vite` como plugin de Vite.