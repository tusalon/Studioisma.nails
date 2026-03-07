// utils/whatsapp-helper.js - VERSIÓN SIMPLIFICADA QUE FUNCIONA EN iOS

console.log('📱 whatsapp-helper.js VERSIÓN SIMPLIFICADA');

// ============================================
// FUNCIÓN ÚNICA Y UNIVERSAL - FUNCIONA EN TODOS LADOS
// ============================================
window.enviarWhatsApp = function(telefono, mensaje) {
    try {
        const telefonoLimpio = telefono.replace(/\D/g, '');
        const mensajeCodificado = encodeURIComponent(mensaje);
        
        console.log('📤 Enviando WhatsApp a:', telefonoLimpio);
        
        // ✅ MÉTODO QUE FUNCIONA EN iOS, Android y Desktop
        const url = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`;
        
        // Crear link invisible y hacer click
        const link = document.createElement('a');
        link.href = url;
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
    } catch (error) {
        console.error('❌ Error en enviarWhatsApp:', error);
        
        // Fallback: abrir en nueva ventana
        const telefonoLimpio = telefono.replace(/\D/g, '');
        const mensajeCodificado = encodeURIComponent(mensaje);
        window.open(`https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${mensajeCodificado}`, '_blank');
        
        return false;
    }
};

// ============================================
// NOTIFICACIÓN DE NUEVA RESERVA
// ============================================
window.notificarNuevaReserva = function(booking) {
    try {
        if (!booking) {
            console.error('❌ No hay datos de reserva para notificar');
            return false;
        }

        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        const mensaje = 
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
        
        // Enviar WhatsApp
        window.enviarWhatsApp(telefonoDuenno, mensaje);
        
        // También enviar push
        window.enviarPushNuevaReserva(booking);
        
        console.log('✅ Notificaciones de nueva reserva enviadas');
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
            console.error('❌ No hay datos de reserva para notificar cancelación');
            return false;
        }

        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(booking.fecha) : 
            booking.fecha;
        
        const horaFormateada = window.formatTo12Hour ? 
            window.formatTo12Hour(booking.hora_inicio) : 
            booking.hora_inicio;
            
        const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
        
        const mensaje = 
`❌ *CANCELACIÓN DE CLIENTE - Studioisma.nails*

👤 *Cliente:* ${booking.cliente_nombre}
📱 *WhatsApp:* ${booking.cliente_whatsapp}
💅 *Servicio:* ${booking.servicio}
📅 *Fecha:* ${fechaConDia}
⏰ *Hora:* ${horaFormateada}
👩‍🎨 *Profesional:* ${profesional}

El cliente canceló su turno desde la app.`;

        const telefonoDuenno = "54646800";
        
        // Enviar WhatsApp
        window.enviarWhatsApp(telefonoDuenno, mensaje);
        
        // También enviar push
        window.enviarPushCancelacion(booking);
        
        console.log('✅ Notificaciones de cancelación enviadas');
        return true;
    } catch (error) {
        console.error('Error en notificarCancelacion:', error);
        return false;
    }
};

// ============================================
// NOTIFICACIONES PUSH (ntfy)
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
Profesional: ${profesional}

Reserva confirmada automáticamente.`;

        const tituloPush = 'Nueva reserva - Studioisma.nails';

        fetch('https://ntfy.sh/studioisma-notifications', {
            method: 'POST',
            body: mensajePush,
            headers: {
                'Title': tituloPush,
                'Priority': 'default',
                'Tags': 'tada'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Push de nueva reserva enviado');
            }
        })
        .catch(error => {
            console.error('❌ Error enviando push:', error);
        });
        
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
Fecha: ${fechaConDia}
Hora: ${window.formatTo12Hour ? window.formatTo12Hour(booking.hora_inicio) : booking.hora_inicio}`;

        const tituloPush = 'Cancelación - Studioisma.nails';

        fetch('https://ntfy.sh/studioisma-notifications', {
            method: 'POST',
            body: mensajePush,
            headers: {
                'Title': tituloPush,
                'Priority': 'default',
                'Tags': 'x'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('✅ Push de cancelación enviado');
            }
        })
        .catch(error => {
            console.error('❌ Error enviando push:', error);
        });
        
    } catch (error) {
        console.error('Error en push:', error);
    }
};

// ============================================
// NOTIFICACIÓN PARA CLIENTE APROBADO
// ============================================
window.notificarClienteAprobado = function(telefono, nombre) {
    try {
        const fechaHoy = new Date();
        const fechaStr = `${fechaHoy.getFullYear()}-${(fechaHoy.getMonth()+1).toString().padStart(2,'0')}-${fechaHoy.getDate().toString().padStart(2,'0')}`;
        const fechaConDia = window.formatFechaCompleta ? 
            window.formatFechaCompleta(fechaStr) : 
            fechaStr;
        
        const mensaje = 
`✅ *¡FELICIDADES! Has sido ACEPTADA en Studioisma.nails*

Hola *${nombre}*, nos complace informarte que tu solicitud de acceso ha sido *APROBADA*.

🎉 *Ya puede reservar turnos:*
• Reservar online las 24/7
• Cancelar turnos desde la app
• Recibir recordatorios automáticos

📱 *Ingresar ahora mismo:*
1. Abrir la app desde tu celular
2. Iniciar sesión con tu número
3. Elegir servicio, profesional y horario

💖 *Studioisma.nails - Tu espacio de belleza*

_${fechaConDia}_`;

        window.enviarWhatsApp(telefono, mensaje);
        return true;
    } catch (error) {
        console.error('Error en notificarClienteAprobado:', error);
        return false;
    }
};

console.log('✅ whatsapp-helper.js simplificado listo');