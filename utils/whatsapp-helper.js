// utils/whatsapp-helper.js - Helper universal para WhatsApp

console.log('📱 whatsapp-helper.js cargado');

// Detectar si es dispositivo móvil
const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detectar si es Android (para usar intent://)
const isAndroid = () => {
    return /Android/i.test(navigator.userAgent);
};

// Detectar si es iOS
const isIOS = () => {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Función principal que SIEMPRE funciona con Business
window.enviarWhatsAppBusiness = function(telefono, mensaje, esBusiness = true) {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    console.log('📤 Enviando WhatsApp a:', telefonoLimpio);
    console.log('📱 Dispositivo:', isMobile() ? 'Móvil' : 'Desktop');
    console.log('📱 Android:', isAndroid());
    console.log('📱 iOS:', isIOS());
    
    // SIEMPRE intentar con el formato específico para Business primero
    if (esBusiness) {
        if (isAndroid()) {
            // ✅ ANDROID: Usar intent:// (funciona con Business)
            const intentUrl = `intent://send/${telefonoLimpio}?text=${mensajeCodificado}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
            
            // Crear un iframe oculto para intentar
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = intentUrl;
            document.body.appendChild(iframe);
            
            // Si no abre en 800ms, probar con el método universal
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.location.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
            }, 800);
            
            return;
        }
        
        if (isIOS()) {
            // ✅ iOS: Usar whatsapp:// (funciona con ambas apps)
            const businessUrl = `whatsapp://send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
            
            // Intentar abrir
            window.location.href = businessUrl;
            
            // Si no abre en 1 segundo, probar con API
            setTimeout(() => {
                window.location.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
            }, 1000);
            
            return;
        }
    }
    
    // Para desktop o como fallback
    if (!isMobile()) {
        // Desktop: usar WhatsApp Web
        window.open(`https://web.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`, '_blank');
    } else {
        // Último recurso en móvil
        window.location.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
    }
};

// Versión simplificada para usar en toda la app
window.enviarWhatsAppUniversal = function(telefono, mensaje) {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    if (isMobile()) {
        // ✅ EN MÓVIL: Intentar con la app primero
        
        // Guardar el timestamp actual para detectar si la app se abrió
        const startTime = Date.now();
        
        // Detectar si la página se oculta (la app se abrió)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('✅ App de WhatsApp se abrió correctamente');
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                clearTimeout(timeout);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Intentar con el método que funciona para Business
        if (isAndroid()) {
            // Android: intent:// (funciona con Business)
            const intentUrl = `intent://send/${telefonoLimpio}?text=${mensajeCodificado}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end;`;
            
            // Crear link y hacer click
            const link = document.createElement('a');
            link.href = intentUrl;
            link.click();
            
        } else {
            // iOS: whatsapp://
            window.location.href = `whatsapp://send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
        }
        
        // Timeout: si no abrió en 1.5 segundos, usar API
        const timeout = setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            console.log('⚠️ App no respondió, usando API');
            window.location.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
        }, 1500);
        
    } else {
        // Desktop: WhatsApp Web
        window.open(`https://web.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`, '_blank');
    }
};

// 🔥 FUNCIÓN ESPECÍFICA PARA NOTIFICACIONES AUTOMÁTICAS (funciona en iPhone)
window.enviarWhatsAppNotificacion = function(telefono, mensaje) {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    const mensajeCodificado = encodeURIComponent(mensaje);
    
    console.log('📤 [NOTIFICACIÓN] Enviando WhatsApp a:', telefonoLimpio);
    
    // Crear un link invisible y hacer click (funciona en iPhone)
    const link = document.createElement('a');
    link.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Limpiar después
    setTimeout(() => {
        document.body.removeChild(link);
    }, 200);
    
    return true;
};

// FUNCIÓN: Notificar al cliente aprobado (CON DÍA DE LA SEMANA)
window.notificarClienteAprobado = async function(telefono, nombre) {
    // Obtener fecha actual con día de la semana
    const fechaHoy = new Date();
    const fechaStr = `${fechaHoy.getFullYear()}-${(fechaHoy.getMonth()+1).toString().padStart(2,'0')}-${fechaHoy.getDate().toString().padStart(2,'0')}`;
    const fechaConDia = window.formatFechaCompleta ? 
        window.formatFechaCompleta(fechaStr) : 
        fechaStr;
    
    const nombreNegocio = await window.getNombreNegocio();
    
    const mensaje = 
`✅ *¡FELICIDADES! Has sido ACEPTADO en ${nombreNegocio}*

Hola *${nombre}*, nos complace informarte que tu solicitud de acceso ha sido *APROBADA*.

🎉 *Ya puede reservar turnos:*
• Reservar online las 24/7
• Cancelar turnos desde la app
• Recibir recordatorios automáticos

📱 *Ingresar ahora mismo:*
1. Abrir la app desde tu celular
2. Iniciar sesión con tu número
3. Elegir servicio, profesional y horario

_${fechaConDia}_`;

    window.enviarWhatsAppBusiness(telefono, mensaje, true);
};

// FUNCIÓN: Cancelación de turnos (CON DÍA DE LA SEMANA)
window.notificarCancelacion = async function(telefono, nombre, fecha, hora, servicio, profesional) {
    // La fecha puede venir en formato YYYY-MM-DD o ya formateada
    let fechaConDia = fecha;
    
    // Verificar si la fecha está en formato YYYY-MM-DD
    if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(fecha) : 
            fecha;
    } else if (window.getDiaSemana) {
        const fechaParts = fecha.split(' ');
        if (fechaParts.length > 1) {
            const fechaNumero = fechaParts[fechaParts.length - 1];
            if (fechaNumero.match(/^\d{1,2}$/)) {
                fechaConDia = fecha;
            }
        }
    }
    
    const nombreNegocio = await window.getNombreNegocio();
    
    const mensaje = 
`❌ *CANCELACIÓN DE TURNO*

Hola *${nombre}*, lamentamos informarte que tu turno ha sido cancelado.

📅 *Fecha:* ${fechaConDia}
⏰ *Hora:* ${hora}
💈 *Servicio:* ${servicio}
👨‍🎨 *Profesional:* ${profesional}

🔔 *Motivo:* Cancelación por administración

📱 *¿Quieres reprogramar?*
Puedes hacerlo desde la app

Disculpe las molestias.`;

    window.enviarWhatsAppUniversal(telefono, mensaje);
};

console.log('✅ whatsapp-helper.js listo para usar (con fechas completas)');