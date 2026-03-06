// utils/config-negocio.js - VERSIÓN MULTI-TENANT
// CLIENTE: Studioisma.nails

console.log('🏢 config-negocio.js cargado');

// ============================================
// 🔥 CONFIGURACIÓN POR CLIENTE
// ============================================
// ⚠️ IMPORTANTE: Cambiá este ID por el de cada cliente
const NEGOCIO_ID_POR_DEFECTO = 'd4f7e2b1-3a8c-4b6d-9e5f-1c2d3e4f5a6b'; // ID de Studioisma.nails

// Cache de configuración (para evitar llamadas innecesarias)
let configCache = null;
let ultimaActualizacion = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

/**
 * Obtiene el negocio_id del localStorage o usa el ID por defecto
 */
function getNegocioId() {
    // 1. Prioridad: lo que haya en localStorage (cuando el admin se loguea)
    const localId = localStorage.getItem('negocioId');
    if (localId) {
        console.log('📌 Usando negocioId de localStorage:', localId);
        return localId;
    }
    
    // 2. Si no, usar el ID por defecto quemado en el código
    console.log('📌 Usando negocioId por defecto (quemado en código):', NEGOCIO_ID_POR_DEFECTO);
    return NEGOCIO_ID_POR_DEFECTO;
}

/**
 * Carga la configuración del negocio desde Supabase
 * @param {boolean} forceRefresh - Si es true, ignora el caché
 */
window.cargarConfiguracionNegocio = async function(forceRefresh = false) {
    const negocioId = getNegocioId();
    if (!negocioId) {
        console.error('❌ No hay negocioId disponible');
        return null;
    }

    // Usar caché si no se fuerza refresco y tenemos datos recientes
    if (!forceRefresh && configCache && (Date.now() - ultimaActualizacion) < CACHE_DURATION) {
        console.log('📦 Usando cache de configuración');
        return configCache;
    }

    try {
        console.log('🌐 Cargando configuración del negocio desde Supabase...');
        console.log('📡 ID del negocio:', negocioId);
        
        const url = `${window.SUPABASE_URL}/rest/v1/negocios?id=eq.${negocioId}&select=*`;
        
        console.log('📡 URL completa:', url);
        
        const response = await fetch(url, {
            headers: {
                'apikey': window.SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
            return null;
        }

        const data = await response.json();
        
        // GUARDAR EN CACHE
        configCache = data[0] || null;
        ultimaActualizacion = Date.now();
        
        if (configCache) {
            console.log('✅ Configuración cargada y cacheada:');
            console.log('   - Nombre:', configCache.nombre);
            console.log('   - Teléfono:', configCache.telefono);
            console.log('   - Email:', configCache.email);
            console.log('   - Instagram:', configCache.instagram);
            console.log('   - Facebook:', configCache.facebook);
            console.log('   - Logo:', configCache.logo_url);
            
            // Guardar ID en localStorage si no existe
            const localId = localStorage.getItem('negocioId');
            if (!localId) {
                console.log('💾 Guardando ID en localStorage para futuras sesiones');
                localStorage.setItem('negocioId', negocioId);
            }
        } else {
            console.log('⚠️ No se encontró configuración para el negocio');
        }
        
        return configCache;
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        return null;
    }
};

/**
 * Obtiene el nombre del negocio
 */
window.getNombreNegocio = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.nombre || 'Studioisma.nails';
};

/**
 * Obtiene el teléfono del dueño
 */
window.getTelefonoDuenno = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.telefono || '54646800';
};

/**
 * Obtiene el email del negocio
 */
window.getEmailNegocio = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.email || '';
};

/**
 * Obtiene el Instagram
 */
window.getInstagram = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.instagram || '';
};

/**
 * Obtiene el Facebook
 */
window.getFacebook = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.facebook || '';
};

/**
 * Obtiene el horario de atención
 */
window.getHorarioAtencion = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.horario_atencion || '';
};

/**
 * Obtiene el mensaje de bienvenida
 */
window.getMensajeBienvenida = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.mensaje_bienvenida || '¡Bienvenida a nuestro salón!';
};

/**
 * Obtiene el mensaje de confirmación
 */
window.getMensajeConfirmacion = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.mensaje_confirmacion || 'Tu turno ha sido reservado con éxito';
};

// 🗑️ FUNCIONES DE COLORES ELIMINADAS (ya no se usan)
// window.getColorPrincipal y window.getColorSecundario fueron eliminadas

/**
 * Obtiene el tópico de ntfy para notificaciones
 */
window.getNtfyTopic = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.ntfy_topic || 'studioisma-notifications';
};

/**
 * Verifica si el negocio ya está configurado
 */
window.negocioConfigurado = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.configurado || false;
};

// Precargar configuración al inicio
setTimeout(async () => {
    console.log('🔄 Precargando configuración automática...');
    await window.cargarConfiguracionNegocio();
}, 500);

console.log('✅ config-negocio.js listo para Studioisma.nails');
console.log('🏷️  ID configurado:', NEGOCIO_ID_POR_DEFECTO);