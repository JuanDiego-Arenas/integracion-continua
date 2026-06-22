-- ============================================================
-- CONTROLSTOCK - Esquema de Base de Datos
-- Sistema de Gestión de Inventarios con Trazabilidad Completa
-- ============================================================

-- Extensión para UUID (opcional, para trazabilidad avanzada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CATEGORÍAS
-- ============================================================
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. PRODUCTOS
-- ============================================================
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);

-- ============================================================
-- 3. TIPOS DE MOVIMIENTO (catálogo fijo)
-- ============================================================
CREATE TABLE tipos_movimiento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    factor INTEGER NOT NULL DEFAULT 1 CHECK (factor IN (1, -1)) -- 1=entrada, -1=salida
);

INSERT INTO tipos_movimiento (nombre, descripcion, factor) VALUES
    ('entrada', 'Ingreso de mercancía al inventario', 1),
    ('salida', 'Salida de mercancía del inventario', -1),
    ('ajuste_entrada', 'Ajuste positivo de inventario', 1),
    ('ajuste_salida', 'Ajuste negativo de inventario', -1);

-- ============================================================
-- 4. MOVIMIENTOS (TRAZABILIDAD COMPLETA)
-- ============================================================
CREATE TABLE movimientos (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo_movimiento_id INTEGER NOT NULL REFERENCES tipos_movimiento(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    stock_anterior INTEGER NOT NULL CHECK (stock_anterior >= 0),
    stock_nuevo INTEGER NOT NULL CHECK (stock_nuevo >= 0),
    observacion TEXT,
    usuario VARCHAR(100) NOT NULL DEFAULT 'sistema',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movimientos_producto ON movimientos(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos(created_at);
CREATE INDEX idx_movimientos_tipo ON movimientos(tipo_movimiento_id);

-- ============================================================
-- 5. ALERTAS DE STOCK
-- ============================================================
CREATE TABLE alertas_stock (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('stock_minimo', 'stock_cero')),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alertas_producto ON alertas_stock(producto_id);
CREATE INDEX idx_alertas_leida ON alertas_stock(leida);

-- ============================================================
-- FUNCIÓN: Actualizar stock y registrar movimiento con transacción
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_movimiento(
    p_producto_id INTEGER,
    p_tipo_movimiento_id INTEGER,
    p_cantidad INTEGER,
    p_observacion TEXT,
    p_usuario VARCHAR
) RETURNS TABLE(
    out_movimiento_id INTEGER,
    out_movimiento_uuid UUID,
    out_stock_anterior INTEGER,
    out_stock_nuevo INTEGER
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_factor INTEGER;
    v_nuevo_stock INTEGER;
    v_tipo_nombre VARCHAR;
    v_movimiento_id INTEGER;
    v_movimiento_uuid UUID;
    v_stock_anterior INTEGER;
    v_stock_nuevo INTEGER;
BEGIN
    -- Obtener stock actual y factor del tipo de movimiento (con lock)
    SELECT p.stock_actual, tm.factor, tm.nombre
    INTO v_stock_actual, v_factor, v_tipo_nombre
    FROM productos p
    JOIN tipos_movimiento tm ON tm.id = p_tipo_movimiento_id
    WHERE p.id = p_producto_id
    FOR UPDATE OF p;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    -- Calcular nuevo stock
    v_nuevo_stock := v_stock_actual + (v_factor * p_cantidad);

    -- Validar que el stock no sea negativo
    IF v_nuevo_stock < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente. Actual: %, requerido: %', v_stock_actual, p_cantidad;
    END IF;

    -- Insertar movimiento
    INSERT INTO movimientos (producto_id, tipo_movimiento_id, cantidad, stock_anterior, stock_nuevo, observacion, usuario)
    VALUES (p_producto_id, p_tipo_movimiento_id, p_cantidad, v_stock_actual, v_nuevo_stock, p_observacion, p_usuario)
    RETURNING id, uuid, stock_anterior, stock_nuevo
    INTO v_movimiento_id, v_movimiento_uuid, v_stock_anterior, v_stock_nuevo;

    out_movimiento_id := v_movimiento_id;
    out_movimiento_uuid := v_movimiento_uuid;
    out_stock_anterior := v_stock_anterior;
    out_stock_nuevo := v_stock_nuevo;

    -- Actualizar stock del producto
    UPDATE productos SET stock_actual = v_nuevo_stock, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_producto_id;

    -- Generar alerta si corresponde
    IF v_nuevo_stock = 0 THEN
        INSERT INTO alertas_stock (producto_id, tipo_alerta, mensaje)
        VALUES (p_producto_id, 'stock_cero', 'El producto ha llegado a stock cero');
    ELSIF v_nuevo_stock <= (SELECT stock_minimo FROM productos WHERE id = p_producto_id) THEN
        INSERT INTO alertas_stock (producto_id, tipo_alerta, mensaje)
        VALUES (p_producto_id, 'stock_minimo', 'El producto está por debajo del stock mínimo');
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VISTA: Dashboard - Stock por categoría
-- ============================================================
CREATE OR REPLACE VIEW vw_stock_por_categoria AS
SELECT
    c.id AS categoria_id,
    c.nombre AS categoria,
    COUNT(p.id) AS total_productos,
    COALESCE(SUM(p.stock_actual), 0) AS stock_total,
    COALESCE(SUM(p.stock_actual * p.precio), 0) AS valor_total_inventario,
    COUNT(CASE WHEN p.stock_actual <= p.stock_minimo THEN 1 END) AS productos_criticos
FROM categorias c
LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = TRUE
GROUP BY c.id, c.nombre;

-- ============================================================
-- VISTA: Dashboard - Rotación de inventario (últimos 30 días)
-- ============================================================
CREATE OR REPLACE VIEW vw_rotacion_inventario AS
SELECT
    p.id AS producto_id,
    p.nombre AS producto,
    c.nombre AS categoria,
    COALESCE(SUM(CASE WHEN tm.factor = -1 THEN m.cantidad ELSE 0 END), 0) AS salidas_30d,
    COALESCE(SUM(CASE WHEN tm.factor = 1 THEN m.cantidad ELSE 0 END), 0) AS entradas_30d,
    p.stock_actual,
    CASE
        WHEN p.stock_actual > 0 THEN
            ROUND(COALESCE(SUM(CASE WHEN tm.factor = -1 THEN m.cantidad ELSE 0 END), 0)::DECIMAL / p.stock_actual, 2)
        ELSE 0
    END AS indice_rotacion
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN movimientos m ON m.producto_id = p.id AND m.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
LEFT JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
WHERE p.activo = TRUE
GROUP BY p.id, p.nombre, c.nombre, p.stock_actual;

-- ============================================================
-- VISTA: Dashboard - Evolución temporal (últimos 12 meses)
-- ============================================================
CREATE OR REPLACE VIEW vw_evolucion_mensual AS
SELECT
    DATE_TRUNC('month', m.created_at)::DATE AS mes,
    tm.nombre AS tipo_movimiento,
    tm.factor,
    COUNT(*) AS total_transacciones,
    SUM(m.cantidad) AS total_unidades
FROM movimientos m
JOIN tipos_movimiento tm ON tm.id = m.tipo_movimiento_id
WHERE m.created_at >= CURRENT_TIMESTAMP - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', m.created_at), tm.nombre, tm.factor
ORDER BY mes DESC;
