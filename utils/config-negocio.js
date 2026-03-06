// utils/config-negocio.js - VERSIÓN MULTI-TENANT

console.log('🏢 config-negocio.js cargado');

// ============================================
// 🔥 CONFIGURACIÓN POR CLIENTE
// ============================================
// ⚠️ IMPORTANTE: Cambiá este ID por el de cada cliente
const NEGOCIO_ID_POR_DEFECTO = '5e710464-de34-45ae-9197-cd6eeb748ca0'; // ID de BennetSalón

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
            console.log('   - NTFY Topic:', configCache.ntfy_topic);
            console.log('   - Logo:', configCache.logo_url);
            
            // Si el ID de localStorage es diferente al que usamos, actualizamos
            const localId = localStorage.getItem('negocioId');
            if (!localId && negocioId === NEGOCIO_ID_POR_DEFECTO) {
                console.log('💾 Guardando ID por defecto en localStorage para futuras sesiones');
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
    return config?.nombre || 'Mi Salón';
};

/**
 * Obtiene el teléfono del dueño
 */
window.getTelefonoDuenno = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.telefono || '53357234';
};

/**
 * Obtiene el color principal
 */
window.getColorPrincipal = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.color_primario || '#ec4899';
};

/**
 * Obtiene el color secundario
 */
window.getColorSecundario = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.color_secundario || '#f9a8d4';
};

/**
 * Obtiene el tópico de ntfy para notificaciones
 */
window.getNtfyTopic = async function() {
    const config = await window.cargarConfiguracionNegocio();
    return config?.ntfy_topic || 'lag-barberia';
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

console.log('✅ config-negocio.js listo (modo multi-tenant)');
console.log('🏷️  ID por defecto configurado:', NEGOCIO_ID_POR_DEFECTO);