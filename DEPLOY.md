# GUÍA DE DESPLIEGUE — Plan de Trabajo Docente
## De cero a producción en 30 minutos

---

## PASO 1: Crear cuenta en Supabase (Base de datos)

1. Ve a **https://supabase.com** y crea una cuenta gratis (puedes usar GitHub).
2. Clic en **"New Project"**.
3. Llena:
   - **Organization**: la que creaste al registrarte
   - **Name**: `plan-docente`
   - **Database Password**: anota esta contraseña (la necesitas si quieres conectar directamente por SQL)
   - **Region**: elige la más cercana a Colombia → **South America (São Paulo)**
4. Clic **"Create new project"**. Espera ~2 minutos a que se aprovisione.

---

## PASO 2: Crear las tablas en Supabase

1. En tu proyecto de Supabase, ve al menú izquierdo → **SQL Editor**.
2. Clic en **"New query"**.
3. Abre el archivo `supabase/schema.sql` que viene en este proyecto.
4. **Copia TODO el contenido** y pégalo en el SQL Editor.
5. Clic en **"Run"** (botón verde).
6. Deberías ver mensajes de éxito. Si hay error, asegúrate de haber copiado TODO el archivo.

**Verificar**: Ve a **Table Editor** en el menú izquierdo. Deberías ver 5 tablas: `parametros`, `profesores`, `cursos`, `actividades`, `asignaciones`, todas con datos.

---

## PASO 3: Copiar las credenciales de Supabase

1. En Supabase, ve a **Settings** (ícono de engranaje) → **API**.
2. Copia estos dos valores:
   - **Project URL**: algo como `https://xxxxx.supabase.co`
   - **anon public key**: empieza con `eyJhbGciOiJIUzI1NiIs...`
3. Guárdalos en un bloc de notas — los necesitas en el siguiente paso.

---

## PASO 4: Crear cuenta en Vercel (Hosting)

1. Ve a **https://vercel.com** y crea una cuenta gratis con tu cuenta de **GitHub**.
2. Si no tienes GitHub: ve a **https://github.com** y crea una cuenta primero.

---

## PASO 5: Subir el proyecto a GitHub

### Opción A: Desde la terminal (si tienes Git instalado)

```bash
cd plan-docente
git init
git add .
git commit -m "Plan de Trabajo Docente v1"
git remote add origin https://github.com/TU-USUARIO/plan-docente.git
git push -u origin main
```

### Opción B: Subir archivos manualmente en GitHub

1. Ve a **https://github.com/new** y crea un repositorio llamado `plan-docente`.
2. NO marques "Initialize with README".
3. Una vez creado, clic en **"uploading an existing file"**.
4. Arrastra TODA la carpeta `plan-docente` al navegador.
5. Clic en **"Commit changes"**.

**IMPORTANTE**: NO subas el archivo `.env.local` a GitHub. Solo sube `.env.local.example`.

---

## PASO 6: Desplegar en Vercel

1. Ve a **https://vercel.com/new**.
2. Selecciona **"Import Git Repository"** → busca `plan-docente`.
3. En la pantalla de configuración:
   - **Framework Preset**: Next.js (se detecta automáticamente)
   - **Root Directory**: déjalo vacío (o `.`)
   - **Environment Variables**: Aquí agregas las credenciales de Supabase:
     - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. Clic en **"Deploy"**.
5. Espera ~2 minutos. Cuando termine, Vercel te da una URL como:
   `https://plan-docente-xxxxx.vercel.app`

**¡Tu app está en producción!**

---

## PASO 7: Verificar que funciona

1. Abre la URL que te dio Vercel.
2. Deberías ver el Dashboard con los 6 KPIs y la tabla de profesores.
3. Navega a cada pantalla y verifica que carga datos.
4. En **Asignaciones**, prueba:
   - Selecciona un profesor tipo "Plan Investigador" (Carlos Rodríguez)
   - Intenta agregar un 2do curso → debería mostrar error rojo
5. En **Mi Plan**, verifica que NO muestra columnas de horas.

---

## SOLUCIÓN DE PROBLEMAS

### "La página carga pero no muestra datos"
→ Verifica que las Environment Variables en Vercel estén correctas. Ve a Vercel → tu proyecto → Settings → Environment Variables.

### "Error 500 o página en blanco"
→ En Vercel, ve a tu proyecto → Deployments → clic en el deployment → Logs. Busca el error.

### "CORS error" o "Unauthorized"
→ En Supabase, ve a Settings → API → asegúrate de que estés usando la anon key (no la service_role key).
→ Verifica que las políticas RLS estén creadas (se crean con el schema.sql).

### "No puedo ver la vista_resumen"
→ Algunas veces las vistas necesitan permisos adicionales. En SQL Editor ejecuta:
```sql
GRANT SELECT ON vista_resumen TO anon;
GRANT SELECT ON vista_resumen TO authenticated;
```

### Quiero cambiar algo en la app
1. Edita los archivos localmente (o en GitHub directamente).
2. Haz push a GitHub.
3. Vercel re-despliega automáticamente en ~1 minuto.

---

## ESTRUCTURA DEL PROYECTO

```
plan-docente/
├── package.json          ← Dependencias (Next.js, Supabase, etc.)
├── next.config.js        ← Config de Next.js
├── tailwind.config.ts    ← Colores y estilos
├── .env.local.example    ← Plantilla de variables de entorno
├── supabase/
│   └── schema.sql        ← TODO el SQL para crear tablas + datos
└── src/
    ├── lib/
    │   ├── supabase.ts   ← Conexión a Supabase
    │   └── types.ts      ← Definición de tipos + constantes
    ├── components/
    │   ├── Sidebar.tsx    ← Menú lateral de navegación
    │   └── ui.tsx         ← Componentes reutilizables (Badge, KPI, etc.)
    └── app/
        ├── layout.tsx     ← Layout principal con Sidebar
        ├── page.tsx       ← Redirige a /dashboard
        ├── globals.css    ← Estilos base
        ├── dashboard/     ← Pantalla 1: KPIs + tabla resumen
        ├── asignaciones/  ← Pantalla 2: Crear/eliminar asignaciones
        ├── mi-plan/       ← Pantalla 3: Vista profesor (sin horas)
        ├── resumen/       ← Pantalla 4: Barras de progreso
        ├── profesores/    ← Pantalla 5: CRUD profesores
        ├── catalogos/     ← Pantalla 6: Cursos + Actividades
        └── parametros/    ← Pantalla 7: Configuración
```

---

## DESARROLLO LOCAL (OPCIONAL)

Si quieres probar la app en tu computador antes de subir a Vercel:

1. Instala Node.js: https://nodejs.org (descarga la versión LTS)
2. Abre terminal en la carpeta del proyecto
3. Crea el archivo `.env.local` copiando `.env.local.example` y poniendo tus credenciales
4. Ejecuta:
```bash
npm install
npm run dev
```
5. Abre http://localhost:3000 en tu navegador

---

## FUTURAS MEJORAS

- **Autenticación**: Agregar login con Supabase Auth para que cada profesor solo vea su plan
- **Roles**: Usar RLS de Supabase para que admin vea todo y profesores solo MiPlan
- **Exportar PDF**: Usar librería como jsPDF para exportar planes individuales
- **Notificaciones**: Supabase Edge Functions + email cuando se asigna algo nuevo
- **Histórico**: Comparar semestres anteriores con gráficas
