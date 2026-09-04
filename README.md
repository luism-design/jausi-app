# jausi — portal inmobiliario

App reconstruida en React + Vite, conectada a Supabase (auth + base de datos + storage).

## 1. Configurar variables de entorno

Copia `.env.example` a `.env` (ya viene con tus datos actuales de Supabase):

```
VITE_SUPABASE_URL=https://esrugjecbczwmyxbdnpb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## 2. Instalar y correr en local

```
npm install
npm run dev
```

Abre http://localhost:5173

## 3. Base de datos

El esquema SQL está en `schema.sql` (en la carpeta raíz que te compartí aparte). Debes correrlo una sola vez
en el **SQL Editor** de tu proyecto de Supabase antes de usar la app.

## 4. Desplegar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a https://vercel.com, "Add New Project", importa el repo.
3. En "Environment Variables" agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos valores del `.env`.
4. Deploy.
5. En Vercel, ve a Project Settings → Domains, agrega `jausi.co` y sigue las instrucciones para apuntar el DNS.

## Estructura

```
src/
  lib/          cliente de Supabase, contexto de auth, utilidades
  components/   Nav, PropertyCard
  views/        Home, Detail, Advisor, Crm, Auth, Publish
```
