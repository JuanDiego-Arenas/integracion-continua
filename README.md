
## Integrantes
- Orjuela Bonilla Camilo Esteban
- Nicolas Felipe Quevedo Montaño
- Juan Diego Arenas Cuellar
- Joan Villamarin Urrutia
- Ronald Charari Parra


# CONTROLSTOCK - Sistema de Gestión de Inventarios

CONTROLSTOCK es un sistema web para la gestión empresarial de inventarios, desarrollado como solución monolítica con **Node.js + Express + PostgreSQL**.

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│          Bootstrap 5 + Chart.js                 │
├─────────────────────────────────────────────────┤
│               Express (API REST)                │
│   controllers → models → pool (pg)              │
├─────────────────────────────────────────────────┤
│               PostgreSQL                        │
│   Tablas: productos, categorías, movimientos,   │
│   alertas_stock.                                │
└─────────────────────────────────────────────────┘
```

- **Backend**: Express 5 con rutas REST, controladores y modelos separados por recurso.
- **Base de datos**: PostgreSQL con integridad referencial, función `registrar_movimiento()` para trazabilidad atómica (stock anterior/nuevo, UUID por movimiento, alertas automáticas).
- **Frontend**: HTML/CSS/JS vanilla con Bootstrap 5 y Chart.js para graficos.
- **Dashboard**: KPIs, gráficos de evolución mensual, stock por categoría y rotación de inventario.

## Cómo ejecutar localmente

### Requisitos
- Node.js 18+
- PostgreSQL 16+
- pnpm (`npm install -g pnpm`)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/JuanDiego-Arenas/integracion-continua.git
cd integracion-continua/backend

# 2. Configurar variables de entorno
cp example.env .env
# Editar .env con los datos de tu PostgreSQL

# 3. Instalar dependencias
pnpm install

# 5. Iniciar servidor
pnpm dev
```

El servidor arranca en `http://localhost:3000`. La base de datos se inicializa automáticamente al iniciar por primera vez (ejecuta `schema.sql` desde `init.js`).
