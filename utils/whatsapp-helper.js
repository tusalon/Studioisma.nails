// utils/whatsapp-helper.js - VERSIÓN DEFINITIVA PARA iOS
// CLIENTE: Studioisma.nails

console.log('📱 whatsapp-helper.js VERSIÓN DEFINITIVA PARA iOS');

// ============================================
// DETECTOR DE iOS
// ============================================
window.esIOS = function() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

// ============================================
// FUNCIÓN UNIVERSAL - FUNCIONA EN iOS
// ============================================
window.enviarWhatsApp = function(telefono, mensaje) {
    try {
        console.log('📤 Iniciando envío WhatsApp a:', telefono);
        
        // Limpiar número (quitar todo excepto dígitos)
        const telefonoLimpio = telefono.replace(/\D/g, '');
        
        // Asegurar formato internacional (sin +)
        let numeroCompleto = telefonoLimpio;
        if (!numeroCompleto.startsWith('53')) {
            numeroCompleto = `53${numeroLimpio}`;
        }
        
        // Codificar mensaje
        const mensajeCodificado = encodeURIComponent(mensaje);
        
        // ✅ URL CORRECTA que funciona en iOS
        const url = `https://wa.me/${numeroCompleto}?text=${mensajeCodificado}`;
        
        console.log('🔗 Abriendo URL:', url);
        
        // ✅ MÉTODO QUE SÍ FUNCIONA EN iOS
        if (window.esIOS()) {
            // En iOS: usar location.href (funciona 100%)
            window.location.href = url;
        } else {
            // En Android/Desktop: mantener ventana nueva
            window.open(url, '_blank');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error en enviarWhatsApp:', error);
        
        // FALLBACK ULTRA SIMPLE
        const telefonoLimpio = telefono.replace(/\D/g, '');
        const url = `https://wa.me/53${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        
        // Último recurso
        window.location.href = url;
        
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE NUEVA RESERVA
// ============================================
window.notificarNuevaReserva = function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('📤 Enviando notificación de NUEVA RESERVA');

        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        // Mensaje para WhatsApp
        const mensajeWhatsApp = 
`🆕 *NUEVA RESERVA - Studioisma.nails*

👤 *Cliente:* ${booking.cliente_nombre}
📱 *WhatsApp:* ${booking.cliente_whatsapp}
💅 *Servicio:* ${booking.servicio} (${booking.duracion} min)
📅 *Fecha:* ${fechaConDia}
⏰ *Hora:* ${horaFormateada}
👩‍🎨 *Profesional:* ${profesional}

✅ Reserva confirmada automáticamente. 💖`;

        // Número fijo de la dueña (Studioisma.nails)
        const telefonoDuenno = "54646800";
        
        // ⚡ Enviar WhatsApp INMEDIATAMENTE
        window.enviarWhatsApp(telefonoDuenno, mensajeWhatsApp);
        
        // También enviar push (esto no afecta iOS)
        window.enviarPushNuevaReserva(booking);
        
        console.log('✅ Notificaciones enviadas');
        return true;
    } catch (error) {
        console.error('Error en notificarNuevaReserva:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE CANCELACIÓN
// ============================================
window.notificarCancelacion = function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva');
            return false;
        }

        console.log('📤 Enviando notificación de CANCELACIÓN');

        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        const mensajeWhatsApp = 
`❌ *CANCELACIÓN DE CLIENTE - Studioisma.nails*

👤 *Cliente:* ${booking.cliente_nombre}
📱 *WhatsApp:* ${booking.cliente_whatsapp}
💅 *Servicio:* ${booking.servicio}
📅 *Fecha:* ${fechaConDia}
⏰ *Hora:* ${horaFormateada}
👩‍🎨 *Profesional:* ${profesional}

El cliente canceló su turno desde la app.`;

        const telefonoDuenno = "54646800";
        
        // ⚡ Enviar WhatsApp INMEDIATAMENTE
        window.enviarWhatsApp(telefonoDuenno, mensajeWhatsApp);
        
        // Push (no afecta iOS)
        window.enviarPushCancelacion(booking);
        
        console.log('✅ Notificaciones de cancelación enviadas');
        return true;
    } catch (error) {
        console.error('Error en notificarCancelacion:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIONES PUSH (ntfy) - SIN CAMBIOS
// ============================================
window.enviarPushNuevaReserva = function(booking) {
    try {
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        const mensajePush = 
`NUEVA RESERVA
Cliente: ${booking.cliente_nombre}
WhatsApp: ${booking.cliente_whatsapp}
Servicio: ${booking.servicio} (${booking.duracion} min)
Fecha: ${fechaConDia}
Hora: ${horaFormateada}
Profesional: ${profesional}`;

        fetch('https://ntfy.sh/studioisma-notifications', {
            method: 'POST',
            body: mensajePush,
            headers: {
                'Title': 'Nueva reserva - Studioisma.nails',
                'Priority': 'default',
                'Tags': 'tada'
            }
        }).catch(error => console.error('❌ Error push:', error));
        
    } catch (error) {
        console.error('Error en push:', error);
    }
};

window.enviarPushCancelacion = function(booking) {
    try {
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const mensajePush = 
`CANCELACION DE CLIENTE
Cliente: ${booking.cliente_nombre}
WhatsApp: ${booking.cliente_whatsapp}
Servicio: ${booking.servicio}
Fecha: ${fechaConDia}`;

        fetch('https://ntfy.sh/studioisma-notifications', {
            method: 'POST',
            body: mensajePush,
            headers: {
                'Title': 'Cancelación - Studioisma.nails',
                'Priority': 'default',
                'Tags': 'x'
            }
        }).catch(error => console.error('❌ Error push:', error));
        
    } catch (error) {
        console.error('Error en push:', error);
    }
};

console.log('✅ whatsapp-helper.js VERSIÓN iOS LISTO');