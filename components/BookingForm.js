// components/BookingForm.js - VERSIÓN ADAPTADA DE SETMORE (funciona en iPhone)

function BookingForm({ service, profesional, date, time, onSubmit, onCancel, cliente }) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    // ============================================
    // FUNCIÓN PARA GENERAR UID (UUID v4 simulado)
    // ============================================
    function generarUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ============================================
    // FUNCIÓN PARA FORMATEAR FECHA EN FORMATO SETMORE
    // ============================================
    function formatearFechaSetmore(fechaStr, horaStr) {
        // fechaStr: "2026-03-25"
        // horaStr: "08:00"
        const [year, month, day] = fechaStr.split('-');
        const [hour, minute] = horaStr.split(':');
        
        // Setmore usa: 20260220T140000Z (UTC)
        const fecha = new Date(Date.UTC(
            parseInt(year), 
            parseInt(month) - 1, 
            parseInt(day), 
            parseInt(hour), 
            parseInt(minute), 
            0
        ));
        
        return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    // ============================================
    // FUNCIÓN PARA ARCHIVO .ICS (EXACTAMENTE COMO SETMORE)
    // ============================================
    function generarArchivoCalendario(bookingData) {
        const uid = generarUUID();
        const dtstart = formatearFechaSetmore(bookingData.fecha, bookingData.hora_inicio);
        
        // Calcular hora fin (sumar duración)
        const fechaInicio = new Date(bookingData.fecha + 'T' + bookingData.hora_inicio + ':00');
        const fechaFin = new Date(fechaInicio.getTime() + (bookingData.duracion || 60) * 60000);
        
        const yearFin = fechaFin.getUTCFullYear();
        const monthFin = String(fechaFin.getUTCMonth() + 1).padStart(2, '0');
        const dayFin = String(fechaFin.getUTCDate()).padStart(2, '0');
        const hourFin = String(fechaFin.getUTCHours()).padStart(2, '0');
        const minFin = String(fechaFin.getUTCMinutes()).padStart(2, '0');
        const dtend = `${yearFin}${monthFin}${dayFin}T${hourFin}${minFin}00Z`;
        
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        // Formatear fecha para descripción legible
        const fechaLegible = new Date(bookingData.fecha + 'T' + bookingData.hora_inicio).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Studioisma//Setmore//ES
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:America/Havana
TZURL:http://tzurl.org/zoneinfo-outlook/America/Havana
X-LIC-LOCATION:America/Havana
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:CST
DTSTART:19701101T010000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:CDT
DTSTART:19700308T000000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
END:VTIMEZONE
X-WR-TIMEZONE:America/Havana
BEGIN:VEVENT
UID:${uid}
SEQUENCE:0
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${bookingData.servicio} con ${bookingData.profesional_nombre}
TRANSP:OPAQUE
LOCATION:Studioisma.nails
DESCRIPTION:Appointment Details\\nWhen: ${fechaLegible}\\nService: ${bookingData.servicio}\\nProvider: ${bookingData.profesional_nombre}\\nClient: ${bookingData.cliente_nombre}\\nWhatsApp: +53 ${bookingData.cliente_whatsapp}
ORGANIZER;CN="Studioisma.nails":mailto:studioisma@gmail.com
ATTENDEE;ROLE=CHAIR;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="Studioisma.nails":MAILTO:studioisma@gmail.com
ATTENDEE;ROLE=REQ-PARTICIPANT;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="${bookingData.cliente_nombre}":MAILTO:cliente@email.com
STATUS:CONFIRMED
CLASS:PUBLIC
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Tu turno es MAÑANA
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Tu turno es en 1 HORA
END:VALARM
END:VEVENT
END:VCALENDAR`;
    }

    // ============================================
    // FUNCIÓN PARA FORZAR DESCARGA (CORREGIDA)
    // ============================================
    function descargarArchivoICS(contenido, nombreArchivo) {
        try {
            console.log('📥 Iniciando descarga...');
            
            // Usar application/octet-stream para FORZAR descarga
            const blob = new Blob([contenido], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = nombreArchivo;
            
            // IMPORTANTE: Agregar al DOM antes de hacer click
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Descarga iniciada:', nombreArchivo);
            return true;
            
        } catch (error) {
            console.error('❌ Error en descarga:', error);
            
            // Fallback con Data URI
            try {
                const dataUri = `data:application/octet-stream;charset=utf-8,${encodeURIComponent(contenido)}`;
                window.open(dataUri, '_blank');
            } catch (e) {
                console.error('❌ Fallback falló:', e);
            }
            
            return false;
        }
    }

    // ============================================
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const bookings = await getBookingsByDateAndProfesional(date, profesional.id);
            const baseSlots = [time];
            const available = filterAvailableSlots(baseSlots, service.duracion, bookings);

            if (available.length === 0) {
                setError("Ese horario ya no está disponible.");
                setSubmitting(false);
                return;
            }

            const endTime = calculateEndTime(time, service.duracion);

            const bookingData = {
                cliente_nombre: cliente.nombre,
                cliente_whatsapp: cliente.whatsapp,
                servicio: service.nombre,
                duracion: service.duracion,
                profesional_id: profesional.id,
                profesional_nombre: profesional.nombre,
                fecha: date,
                hora_inicio: time,
                hora_fin: endTime,
                estado: "Reservado"
            };

            const result = await createBooking(bookingData);
            
            if (result.success && result.data) {
                console.log('✅ Reserva creada');
                
                // ===== GENERAR Y DESCARGAR ARCHIVO =====
                try {
                    console.log('📅 Generando archivo ICS (formato Setmore)...');
                    
                    const icsContent = generarArchivoCalendario(result.data);
                    
                    const fechaSegura = result.data.fecha.replace(/-/g, '');
                    const horaSegura = result.data.hora_inicio.replace(':', '');
                    const nombreSeguro = result.data.cliente_nombre
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                    
                    const nombreArchivo = `turno-${fechaSegura}-${horaSegura}-${nombreSeguro}.ics`;
                    
                    // DESCARGAR INMEDIATAMENTE
                    descargarArchivoICS(icsContent, nombreArchivo);
                    
                } catch (icsError) {
                    console.error('Error generando archivo:', icsError);
                }
                
                // ===== NOTIFICACIONES WHATSAPP =====
                if (window.notificarNuevaReserva) {
                    window.notificarNuevaReserva(result.data);
                }
                
                onSubmit(result.data);
            }
        } catch (err) {
            console.error('Error:', err);
            setError("Ocurrió un error al guardar la reserva.");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl space-y-6 border-2 border-pink-300">
                <div className="flex justify-between items-center border-b border-pink-200 pb-4">
                    <h3 className="text-xl font-bold text-pink-800 flex items-center gap-2">
                        <span>💖</span>
                        Confirmar Reserva
                    </h3>
                    <button onClick={onCancel} className="text-pink-400 hover:text-pink-600">
                        <i className="icon-x text-2xl"></i>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200 space-y-2">
                        <div className="flex items-center gap-3 text-pink-700">
                            <span className="text-2xl">✨</span>
                            <span className="font-medium">{service.nombre}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-pink-700">
                            <span className="text-2xl">👩‍🎨</span>
                            <span>Con: <strong>{profesional.nombre}</strong></span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-pink-700">
                            <span className="text-2xl">📅</span>
                            <span>{window.formatFechaCompleta ? window.formatFechaCompleta(date) : date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-pink-700">
                            <span className="text-2xl">⏰</span>
                            <span>{window.formatTo12Hour ? window.formatTo12Hour(time) : time} ({service.duracion} min)</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                            <p className="text-sm text-pink-700">
                                <span className="font-semibold">Tus datos:</span> {cliente.nombre} - +{cliente.whatsapp}
                            </p>
                        </div>

                        {error && (
                            <div className="text-pink-600 text-sm bg-pink-100 p-3 rounded-lg flex items-start gap-2 border border-pink-300">
                                <span className="text-pink-500">⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3.5 rounded-xl font-bold hover:from-pink-600 hover:to-pink-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <span>💖</span>
                                    Confirmar Reserva
                                    <span>✨</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}