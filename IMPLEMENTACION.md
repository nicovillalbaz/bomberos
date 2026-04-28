# Plan de Implementación - Proyecto Cuartel de Bomberos

## Estado Actual del Proyecto

**Archivos existentes:**
- `database.md` - Diseño completo de base de datos (listo para Supabase)
- Archivos de especificación en carpetas: `Usuarios/`, `Moviles/`, `Guardia/`, `Inventarios/`, `Servicios/`, `NovedadesGlobales/`, `Reportes/`

**Stack confirmado:**
- Frontend: React + Vite + TypeScript
- Estilos: TailwindCSS
- UI: shadcn/ui (opcional, usar componentes propios)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Cloudflare Pages o Vercel

---

## FASE 1: CONFIGURACIÓN INICIAL DEL PROYECTO

### 1.1 Inicializar proyecto Vite

```bash
# En la raíz del proyecto (C:\Users\info\Documents\bomberos)
npm create vite@latest . -- --template react-ts
```

### 1.2 Instalar dependencias

```bash
# Dependencias principales
npm install react react-dom react-router-dom @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge

# Dependencias de desarrollo
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

### 1.3 Configurar TailwindCSS

```bash
# El archivo vite.config.ts debe incluir:
# import tailwindcss from '@tailwindcss/vite'
# plugins: [react(), tailwindcss()]
```

---

## FASE 2: ESTRUCTURA DE CARPETAS

### Estructura recomendada:

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (Button, Input, Card, etc.)
│   └── layout/         # Header, Sidebar, Layout
├── pages/              # Vistas/Páginas
│   ├── auth/           # Login, Register
│   ├── dashboard/       # Dashboard principal
│   ├── moviles/        # Gestión de vehículos
│   ├── salidas/        # Salidas de móvil
│   ├── guardias/       # Guardias y turnos
│   ├── inventario/     # Inventarios
│   ├── servicios/     # Servicios
│   ├── reportes/       # Reportes
│   └── usuarios/       # Gestión de usuarios
├── components/        # Componentes específicos por módulo
├── hooks/             # Hooks personalizados
├── lib/               # Utilidades (supabase, utils)
├── types/              # TypeScript types
├── stores/             # Estado global (opcional)
└── data/               # Datos mock (para desarrollo local)
```

---

## FASE 3: IMPLEMENTACIÓN POR MÓDULO

### 3.1 Módulo: Autenticación

**Archivos a crear:**
- `src/pages/auth/Login.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/hooks/useAuth.ts`

**Funcionalidades:**
- Login con email/password
- Logout
- Protected routes
- Recuperación de contraseña

**Orden de implementación:**
1. Configurar Supabase client
2. Crear hook useAuth
3. Crear página de login
4. Proteger rutas

---

### 3.2 Módulo: Vehículos

**Archivos a crear:**
- `src/types/vehiculo.ts`
- `src/lib/api/vehiculos.ts`
- `src/pages/moviles/index.tsx`
- `src/pages/moviles/[id].tsx`
- `src/components/moviles/vehiculoCard.tsx`

**Funcionalidades:**
- Listar vehículos
- Ver detalle de vehículo
- CRUD de vehículos (admin)

**Orden de implementación:**
1. Definir tipos
2. Crear API functions
3. Crear componentes UI
4. Crear páginas

---

### 3.3 Módulo: Salidas de Móvil

**Archivos a crear:**
- `src/types/salida.ts`
- `src/lib/api/salidas.ts`
- `src/pages/salidas/index.tsx`
- `src/pages/salidas/nueva.tsx`
- `src/components/salidas/SalidaForm.tsx`

**Funcionalidades:**
- Registrar salida
- Listar salidas
- Filtrar por fecha/móvil

---

### 3.4 Módulo: Guardia

**Archivos a crear:**
- `src/types/guardia.ts`
- `src/lib/api/guardias.ts`
- `src/pages/guardias/index.tsx`
- `src/components/guardia/BotonesRapidos.tsx`

**Funcionalidades:**
- Crear rol de guardia (oficial/admin)
- Marcar asistencia
- Botones rápidos (ingreso/salida/acción)

---

### 3.5 Módulo: Inventario

**Archivos a crear:**
- `src/types/material.ts`
- `src/types/inventario.ts`
- `src/lib/api/inventario.ts`
- `src/pages/inventario/index.tsx`
- `src/pages/inventario/[ubicacion].tsx`

**Funcionalidades:**
- Inventario por móvil
- Inventario de compañía
- Inventario de depósito
- Inventario global (vista consolidada)

---

### 3.6 Módulo: Servicios

**Archivos a crear:**
- `src/types/servicio.ts`
- `src/lib/api/servicios.ts`
- `src/pages/servicios/index.tsx`
- `src/pages/servicios/nuevo.tsx`

**Funcionalidades:**
- Registrar servicio
- Vincular a salida de móvil
- Tipos y subtipos

---

### 3.7 Módulo: Novedades Globales

**Archivos a crear:**
- `src/types/novedad.ts`
- `src/lib/api/novedades.ts`
- `src/pages/novedades/index.tsx`
- `src/components/novedades/NovedadItem.tsx`

**Funcionalidades:**
- Línea de tiempo
- Crear manuales
- Crear automáticas (desde otros módulos)

---

### 3.8 Módulo: Reportes

**Archivos a crear:**
- `src/pages/reportes/index.tsx`
- `src/components/reportes/FiltrosReporte.tsx`
- `src/components/reportes/TablaReporte.tsx`
- `src/lib/export/csv.ts`

**Funcionalidades:**
- Selector de módulo
- Filtros
- Columnas visibles
- Exportar CSV

---

## FASE 4: APIs Y SUPABASE

### 4.1 Ejecutar migración en Supabase

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto
3. SQL Editor
4. Copiar SQL de `database.md`
5. Ejecutar

### 4.2 Variables de entorno

```bash
# Crear archivo .env.local
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

---

## FASE 5: DESARROLLO LOCAL (SIN SUPABASE)

### Opción A: Datos Mock

Crear archivos en `src/data/mock.ts` con datos de ejemplo para desarrollo sin backend.

### Opción B: SQLite local

Usar `sql.js` o similar para desarrollo offline.

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Sprint 1: Fundamentos
1. Setup proyecto + TailwindCSS
2. Routing + Layout base
3. Autenticación básica

### Sprint 2: Módulos Core
4. Vehículos
5. Salidas de móvil
6. Guardia

### Sprint 3: Módulos Restantes
7. Inventario
8. Servicios
9. Novedades globales

### Sprint 4: Reportes + Final
10. Reportes + Export CSV
11. Mejoras UI/UX
12. PWA (opcional)

---

## COMMANDOS PARA INSTALAR DEPENDENCIAS

```bash
# === FASE 1: Setup ===
npm create vite@latest . -- --template react-ts
npm install

# === FASE 2: Dependencias principales ===
npm install react react-dom react-router-dom @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge

# === FASE 3: Dev dependencies ===
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite

# === FASE 4: Verificar que funciona ===
npm run dev
```

---

## SIGUIENTE PASOS

1. **Ejecutar comandos de Fase 1 y Fase 2**
2. **Confirmar que el proyecto corre** (`npm run dev`)
3. **Continuar con Fase 3** (estructura de carpetas)
4. **Continuar con Fase 4** (módulos uno por uno)

---

*Este plan fue generado a partir del análisis de database.md y los archivos de especificación existentes.*