// ============================================================
// CONTROLSTOCK - App Frontend
// ============================================================

const API = '/api';

let charts = {};

// ============================================================
// API Client
// ============================================================
const api = {
    async get(path) {
        const res = await fetch(`${API}${path}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },
    async post(path, body) {
        const res = await fetch(`${API}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },
    async put(path, body) {
        const res = await fetch(`${API}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
    },
    async del(path) {
        const res = await fetch(`${API}${path}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data;
    },
};

// ============================================================
// Navigation
// ============================================================
const pageConfig = {
    dashboard: { title: 'Dashboard', breadcrumb: 'Resumen general' },
    productos: { title: 'Productos', breadcrumb: 'Gestión de productos' },
    categorias: { title: 'Categorías', breadcrumb: 'Gestión de categorías' },
    movimientos: { title: 'Registrar Movimiento', breadcrumb: 'Movimientos de inventario' },
    historial: { title: 'Historial', breadcrumb: 'Historial de movimientos' },
    alertas: { title: 'Alertas', breadcrumb: 'Alertas de stock' },
};

function navigateTo(page) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const section = document.getElementById(`page-${page}`);
    if (section) section.classList.add('active');

    const btn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (btn) btn.classList.add('active');

    const config = pageConfig[page];
    if (config) {
        document.getElementById('page-title').textContent = config.title;
        document.getElementById('breadcrumb').innerHTML = `<li class="breadcrumb-item active">${config.breadcrumb}</li>`;
    }

    if (page === 'dashboard') loadDashboard();
    if (page === 'productos') loadProductos();
    if (page === 'categorias') loadCategorias();
    if (page === 'movimientos') loadMovimientoForm();
    if (page === 'historial') loadHistorial();
    if (page === 'alertas') loadAlertas();
}

document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.toggle-sidebar')) {
            sidebar.classList.remove('open');
        }
    }
});

// ============================================================
// Dashboard
// ============================================================
async function loadDashboard() {
    try {
        const [resumen, stockCat, rotacion, evolucion, recientes] = await Promise.all([
            api.get('/dashboard/resumen'),
            api.get('/dashboard/stock-por-categoria'),
            api.get('/dashboard/rotacion'),
            api.get('/dashboard/evolucion-mensual'),
            api.get('/dashboard/movimientos-recientes?limite=8'),
        ]);

        document.getElementById('kpi-productos').textContent = resumen.total_productos;
        document.getElementById('kpi-stock').textContent = resumen.stock_total;
        document.getElementById('kpi-valor').textContent = `$${Number(resumen.valor_total_inventario).toLocaleString('es-CO')}`;
        document.getElementById('kpi-alertas').textContent = resumen.alertas_pendientes;
        document.getElementById('kpi-criticos').textContent = resumen.productos_criticos;
        document.getElementById('kpi-sinstock').textContent = resumen.productos_sin_stock;

        renderEvolucionChart(evolucion);
        renderCategoriasChart(stockCat);
        renderRotacionChart(rotacion);
        renderMovimientosRecientes(recientes);

    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

function renderEvolucionChart(data) {
    const months = [...new Set(data.map(d => d.mes))].slice(-6);
    const entradas = months.map(m => {
        const item = data.find(d => d.mes === m && d.factor === 1);
        return item ? Number(item.total_unidades) : 0;
    });
    const salidas = months.map(m => {
        const item = data.find(d => d.mes === m && d.factor === -1);
        return item ? Number(item.total_unidades) : 0;
    });

    const labels = months.map(m => {
        const d = normalizeDate(m);
        if (!d) return m;
        return d.toLocaleString('es', { month: 'short', year: '2-digit' });
    });

    destroyChart('chart-evolucion');
    charts.evolucion = new Chart(document.getElementById('chart-evolucion'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Entradas', data: entradas, backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Salidas', data: salidas, backgroundColor: '#ef4444', borderRadius: 4 },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12 } } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } },
            },
        },
    });
}

function renderCategoriasChart(data) {
    const labels = data.map(d => d.categoria);
    const values = data.map(d => Number(d.stock_total));
    const colors = ['#1a56db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

    destroyChart('chart-categorias');
    charts.categorias = new Chart(document.getElementById('chart-categorias'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 10, padding: 8, font: { size: 10 } },
                },
            },
        },
    });
}

function renderRotacionChart(data) {
    const top = data.filter(d => d.indice_rotacion > 0).slice(0, 8);
    const labels = top.map(d => d.producto.length > 18 ? d.producto.slice(0, 18) + '..' : d.producto);
    const values = top.map(d => Number(d.indice_rotacion));

    destroyChart('chart-rotacion');
    charts.rotacion = new Chart(document.getElementById('chart-rotacion'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Índice de rotación',
                data: values,
                backgroundColor: '#1a56db',
                borderRadius: 4,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                y: { grid: { display: false } },
            },
        },
    });
}

function renderMovimientosRecientes(data) {
    const container = document.getElementById('movimientos-recientes');
    if (!data.length) {
        container.innerHTML = '<p class="text-muted text-center mb-0">No hay movimientos recientes</p>';
        return;
    }
    container.innerHTML = data.map(m => {
        const icon = m.factor === 1 ? 'bi-arrow-down-circle text-success' : 'bi-arrow-up-circle text-danger';
        const signo = m.factor === 1 ? '+' : '-';
        return `
            <div class="d-flex align-items-center gap-3 mb-2 pb-2 border-bottom" style="font-size:0.85rem">
                <i class="bi ${icon} fs-5"></i>
                <div class="flex-grow-1">
                    <strong>${m.producto_nombre}</strong>
                    <br><small class="text-muted">${m.tipo_movimiento}</small>
                </div>
                <div class="text-end">
                    <span class="fw-bold ${m.factor === 1 ? 'text-success' : 'text-danger'}">${signo}${m.cantidad}</span>
                    <br><small class="text-muted">${formatDate(m.created_at)}</small>
                </div>
            </div>
        `;
    }).join('');
}

function destroyChart(id) {
    Object.keys(charts).forEach(k => {
        if (charts[k] && charts[k].canvas && charts[k].canvas.id === id) {
            charts[k].destroy();
            delete charts[k];
        }
    });
}

// ============================================================
// Productos CRUD
// ============================================================
let productoModal = null;
document.addEventListener('DOMContentLoaded', () => {
    productoModal = new bootstrap.Modal(document.getElementById('modalProducto'));
});

async function loadProductos() {
    try {
        const productos = await api.get('/productos');
        const tbody = document.getElementById('productos-tbody');
        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay productos registrados</td></tr>';
            return;
        }
        tbody.innerHTML = productos.map(p => {
            const status = p.stock_actual === 0 ? 'danger' : p.stock_actual <= p.stock_minimo ? 'warning' : 'ok';
            const label = p.stock_actual === 0 ? 'Sin stock' : p.stock_actual <= p.stock_minimo ? 'Stock bajo' : 'OK';
            return `
                <tr>
                    <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${esc(p.codigo)}</span></td>
                    <td><strong>${esc(p.nombre)}</strong></td>
                    <td>${esc(p.categoria_nombre || '-')}</td>
                    <td><strong>${p.stock_actual}</strong></td>
                    <td>${p.stock_minimo}</td>
                    <td><span class="badge-stock ${status}">${label}</span></td>
                    <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editProducto(${p.id})" title="Editar"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProducto(${p.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}

// Search
document.getElementById('search-producto')?.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    try {
        const productos = await api.get(`/productos${q ? `?search=${encodeURIComponent(q)}` : ''}`);
        const tbody = document.getElementById('productos-tbody');
        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Sin resultados</td></tr>';
            return;
        }
        tbody.innerHTML = productos.map(p => {
            const status = p.stock_actual === 0 ? 'danger' : p.stock_actual <= p.stock_minimo ? 'warning' : 'ok';
            const label = p.stock_actual === 0 ? 'Sin stock' : p.stock_actual <= p.stock_minimo ? 'Stock bajo' : 'OK';
            return `
                <tr>
                    <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${esc(p.codigo)}</span></td>
                    <td><strong>${esc(p.nombre)}</strong></td>
                    <td>${esc(p.categoria_nombre || '-')}</td>
                    <td><strong>${p.stock_actual}</strong></td>
                    <td>${p.stock_minimo}</td>
                    <td><span class="badge-stock ${status}">${label}</span></td>
                    <td>$${Number(p.precio).toLocaleString('es-CO')}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary me-1" onclick="editProducto(${p.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProducto(${p.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
});

async function openProductoModal(editId) {
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-producto-title').textContent = 'Nuevo Producto';

    const select = document.getElementById('prod-categoria');
    select.innerHTML = '<option value="">Seleccione...</option>';
    try {
        const cats = await api.get('/categorias');
        cats.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${esc(c.nombre)}</option>`;
        });
    } catch (err) { console.error(err); }

    if (editId) {
        document.getElementById('modal-producto-title').textContent = 'Editar Producto';
        try {
            const prod = await api.get(`/productos/${editId}`);
            document.getElementById('prod-id').value = prod.id;
            document.getElementById('prod-codigo').value = prod.codigo;
            document.getElementById('prod-nombre').value = prod.nombre;
            document.getElementById('prod-descripcion').value = prod.descripcion || '';
            document.getElementById('prod-categoria').value = prod.categoria_id;
            document.getElementById('prod-stock-minimo').value = prod.stock_minimo;
            document.getElementById('prod-stock-actual').value = prod.stock_actual;
            document.getElementById('prod-precio').value = prod.precio;
        } catch (err) { console.error(err); }
    }

    productoModal.show();
}

window.openProductoModal = openProductoModal;

async function editProducto(id) {
    await openProductoModal(id);
}
window.editProducto = editProducto;

document.getElementById('form-producto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const body = {
        codigo: document.getElementById('prod-codigo').value,
        nombre: document.getElementById('prod-nombre').value,
        descripcion: document.getElementById('prod-descripcion').value,
        categoria_id: parseInt(document.getElementById('prod-categoria').value),
        stock_minimo: parseInt(document.getElementById('prod-stock-minimo').value) || 0,
        stock_actual: parseInt(document.getElementById('prod-stock-actual').value) || 0,
        precio: parseFloat(document.getElementById('prod-precio').value) || 0,
    };

    try {
        if (id) {
            await api.put(`/productos/${id}`, body);
        } else {
            await api.post('/productos', body);
        }
        productoModal.hide();
        loadProductos();
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

async function deleteProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        await api.del(`/productos/${id}`);
        loadProductos();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
window.deleteProducto = deleteProducto;

// ============================================================
// Categorias CRUD
// ============================================================
let categoriaModal = null;
document.addEventListener('DOMContentLoaded', () => {
    categoriaModal = new bootstrap.Modal(document.getElementById('modalCategoria'));
});

async function loadCategorias() {
    try {
        const cats = await api.get('/categorias');
        const tbody = document.getElementById('categorias-tbody');
        if (!cats.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay categorías registradas</td></tr>';
            return;
        }
        tbody.innerHTML = cats.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><strong>${esc(c.nombre)}</strong></td>
                <td>${esc(c.descripcion || '-')}</td>
                <td>${formatDate(c.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-1" onclick="editCategoria(${c.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategoria(${c.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function openCategoriaModal(editId) {
    document.getElementById('form-categoria').reset();
    document.getElementById('cat-id').value = '';
    document.getElementById('modal-categoria-title').textContent = 'Nueva Categoría';

    if (editId) {
        document.getElementById('modal-categoria-title').textContent = 'Editar Categoría';
        try {
            const cat = await api.get(`/categorias/${editId}`);
            document.getElementById('cat-id').value = cat.id;
            document.getElementById('cat-nombre').value = cat.nombre;
            document.getElementById('cat-descripcion').value = cat.descripcion || '';
        } catch (err) { console.error(err); }
    }

    categoriaModal.show();
}
window.openCategoriaModal = openCategoriaModal;

async function editCategoria(id) {
    await openCategoriaModal(id);
}
window.editCategoria = editCategoria;

document.getElementById('form-categoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const body = {
        nombre: document.getElementById('cat-nombre').value,
        descripcion: document.getElementById('cat-descripcion').value,
    };

    try {
        if (id) {
            await api.put(`/categorias/${id}`, body);
        } else {
            await api.post('/categorias', body);
        }
        categoriaModal.hide();
        loadCategorias();
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

async function deleteCategoria(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
        await api.del(`/categorias/${id}`);
        loadCategorias();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
window.deleteCategoria = deleteCategoria;

// ============================================================
// Movimientos (Registrar)
// ============================================================
async function loadMovimientoForm() {
    try {
        const [productos, tipos] = await Promise.all([
            api.get('/productos?activo=true'),
            api.get('/movimientos/tipos'),
        ]);

        const selProd = document.getElementById('mov-producto');
        selProd.innerHTML = '<option value="">Seleccione producto...</option>' +
            productos.map(p => `<option value="${p.id}">${esc(p.codigo)} - ${esc(p.nombre)} (Stock: ${p.stock_actual})</option>`).join('');

        const selTipo = document.getElementById('mov-tipo');
        selTipo.innerHTML = '<option value="">Seleccione tipo...</option>' +
            tipos.map(t => `<option value="${t.id}">${t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1)}</option>`).join('');
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('form-movimiento')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        producto_id: parseInt(document.getElementById('mov-producto').value),
        tipo_movimiento_id: parseInt(document.getElementById('mov-tipo').value),
        cantidad: parseInt(document.getElementById('mov-cantidad').value),
        observacion: document.getElementById('mov-observacion').value,
        usuario: 'admin',
    };

    try {
        await api.post('/movimientos', body);
        alert('Movimiento registrado exitosamente');
        document.getElementById('form-movimiento').reset();
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

// ============================================================
// Historial
// ============================================================
async function loadHistorial() {
    try {
        const movs = await api.get('/movimientos');
        const tbody = document.getElementById('historial-tbody');
        if (!movs.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No hay movimientos registrados</td></tr>';
            return;
        }
        tbody.innerHTML = movs.map(m => {
            const icon = m.factor === 1 ? 'text-success' : 'text-danger';
            return `
                <tr>
                    <td><code>${m.uuid ? m.uuid.slice(0, 8) + '..' : '-'}</code></td>
                    <td><strong>${esc(m.producto_nombre)}</strong><br><small class="text-muted">${esc(m.producto_codigo)}</small></td>
                    <td><span class="badge ${m.factor === 1 ? 'bg-success' : 'bg-danger'} bg-opacity-10 ${m.factor === 1 ? 'text-success' : 'text-danger'}">${esc(m.tipo_movimiento)}</span></td>
                    <td class="${icon} fw-bold">${m.factor === 1 ? '+' : '-'}${m.cantidad}</td>
                    <td>${m.stock_anterior}</td>
                    <td>${m.stock_nuevo}</td>
                    <td>${esc(m.usuario)}</td>
                    <td>${esc(m.observacion || '-')}</td>
                    <td><small class="text-muted">${formatDateTime(m.created_at)}</small></td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
    }
}

// ============================================================
// Alertas
// ============================================================
async function loadAlertas() {
    try {
        const alertas = await api.get('/alertas');
        const tbody = document.getElementById('alertas-tbody');
        if (!alertas.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No hay alertas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = alertas.map(a => `
            <tr class="${a.leida ? '' : 'table-warning'}">
                <td><strong>${esc(a.producto_nombre)}</strong><br><small class="text-muted">${esc(a.producto_codigo)}</small></td>
                <td>${esc(a.categoria_nombre || '-')}</td>
                <td><span class="badge ${a.tipo_alerta === 'stock_cero' ? 'bg-danger' : 'bg-warning'} bg-opacity-10 ${a.tipo_alerta === 'stock_cero' ? 'text-danger' : 'text-warning'}">${a.tipo_alerta === 'stock_cero' ? 'Stock Cero' : 'Stock Mínimo'}</span></td>
                <td>${esc(a.mensaje)}</td>
                <td class="fw-bold ${a.stock_actual === 0 ? 'text-danger' : 'text-warning'}">${a.stock_actual}</td>
                <td>${a.stock_minimo}</td>
                <td>${a.leida ? '<span class="badge bg-secondary bg-opacity-10 text-secondary">Leída</span>' : '<span class="badge bg-warning bg-opacity-10 text-warning">Pendiente</span>'}</td>
                <td><small class="text-muted">${formatDateTime(a.created_at)}</small></td>
                <td>${a.leida ? '' : `<button class="btn btn-sm btn-outline-secondary" onclick="marcarAlertaLeida(${a.id})"><i class="bi bi-check"></i></button>`}</td>
            </tr>
        `).join('');

        // Update badge
        const noLeidas = alertas.filter(a => !a.leida).length;
        const badge = document.getElementById('alerta-badge');
        if (noLeidas > 0) {
            badge.textContent = noLeidas;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
    }
}

async function marcarAlertaLeida(id) {
    try {
        await api.post(`/alertas/${id}/leer`, {});
        loadAlertas();
    } catch (err) {
        console.error(err);
    }
}
window.marcarAlertaLeida = marcarAlertaLeida;

async function marcarTodasLeidas() {
    try {
        await api.post('/alertas/leer-todas', {});
        loadAlertas();
    } catch (err) {
        console.error(err);
    }
}
window.marcarTodasLeidas = marcarTodasLeidas;

// ============================================================
// Helpers
// ============================================================
function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function normalizeDate(d) {
    if (!d) return null;
    const s = String(d).replace(' ', 'T');
    const date = new Date(s);
    return isNaN(date.getTime()) ? null : date;
}

function formatDate(d) {
    const date = normalizeDate(d);
    if (!date) return '-';
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
    const date = normalizeDate(d);
    if (!date) return '-';
    return date.toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
