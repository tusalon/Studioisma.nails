// components/BookingForm.js - VERSIÓN COMPLETA CON ARCHIVOS .ICS
// Incluye: generación automática de archivos de calendario con recordatorios 24h y 1h antes

function BookingForm({ service, profesional, date, time, onSubmit, onCancel, cliente }) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    // ============================================
    // FUNCIONES PARA ARCHIVO .ICS (NUEVAS)
    // ============================================
    
    function generarArchivoCalendario(bookingData) {
        // Valores por defecto seguros
        const nombreNegocio = 'Studioisma.nails';
        const direccion = 'Consulte dirección por WhatsApp';
        const telefono = '53357234';
        
        // Fecha del turno
        const fechaTurno = new Date(bookingData.fecha + 'T' + bookingData.hora_inicio + ':00');
        
        // Calcular hora de fin
        let fechaFin;
        if (bookingData.hora_fin) {
            fechaFin = new Date(bookingData.fecha + 'T' + bookingData.hora_fin + ':00');
        } else {
            const duracion = bookingData.duracion || 60;
            fechaFin = new Date(fechaTurno.getTime() + duracion * 60000);
        }
        
        // Formatear fechas para ICS (formato: YYYYMMDDTHHMMSS)
        const formatDateICS = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}`;
        };
        
        const profesional = bookingData.profesional_nombre || 'No asignada';
        const servicio = bookingData.servicio || 'Turno';
        const duracion = bookingData.duracion || 60;
        
        // ID único para el evento
        const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear contenido .ics con DOS recordatorios (24h y 1h)
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${nombreNegocio}//Recordatorio Turnos//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${eventId}@${nombreNegocio.replace(/\s/g, '')}.com
DTSTAMP:${formatDateICS(new Date())}
DTSTART:${formatDateICS(fechaTurno)}
DTEND:${formatDateICS(fechaFin)}
SUMMARY:💅 ${servicio} - ${nombreNegocio}
DESCRIPTION:Tu turno con ${profesional}. Duración: ${duracion} minutos. Si necesitas cancelar, avísanos con 1h de antelación. Tel: +53 ${telefono}
LOCATION:${direccion}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Tu turno es MAÑANA
TRIGGER:-P1D
END:VALARM
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Recordatorio: Tu turno es en 1 HORA
TRIGGER:-PT1H
END:VALARM
END:VEVENT
END:VCALENDAR`;
    }

    function descargarArchivoICS(contenido, nombreArchivo) {
        try {
            const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = nombreArchivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            console.log('✅ Archivo de calendario descargado:', nombreArchivo);
            return true;
        } catch (error) {
            console.error('Error descargando archivo:', error);
            return false;
        }
    }

    // ============================================
    // HANDLE SUBMIT (MODIFICADO CON ARCHIVO .ICS)
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Verificar disponibilidad actualizada
            const bookings = await getBookingsByDateAndProfesional(date, profesional.id);
            const baseSlots = [time];
            const available = filterAvailableSlots(baseSlots, service.duracion, bookings);

            if (available.length === 0) {
                setError("Ese horario ya no está disponible. Por favor elegí otro.");
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

            console.log('📤 Enviando reserva:', bookingData);
            const result = await createBooking(bookingData);
            
            if (result.success && result.data) {
                console.log('✅ Reserva creada exitosamente');
                
                // ===== 🔥 NUEVO: GENERAR ARCHIVO DE CALENDARIO =====
                try {
                    console.log('📅 Generando archivo de calendario con recordatorios...');
                    
                    // Generar contenido .ics
                    const icsContent = generarArchivoCalendario(result.data);
                    
                    // Crear nombre del archivo (seguro para sistema de archivos)
                    const fechaSegura = result.data.fecha.replace(/-/g, '');
                    const horaSegura = result.data.hora_inicio.replace(':', '');
                    const nombreSeguro = result.data.cliente_nombre
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                    
                    const nombreArchivo = `turno-${fechaSegura}-${horaSegura}-${nombreSeguro}.ics`;
                    
                    // Descargar archivo
                    descargarArchivoICS(icsContent, nombreArchivo);
                    
                    // Mensaje amigable al usuario (con setTimeout para no interferir)
                    setTimeout(() => {
                        alert('📅 Se ha descargado un archivo de calendario.\n\nÁbrelo para agregar el turno a tu agenda con recordatorios automáticos (24h y 1h antes).');
                    }, 500);
                    
                } catch (icsError) {
                    console.error('Error generando archivo ICS:', icsError);
                    // No interrumpimos el flujo principal si falla
                }
                // ===== FIN DEL NUEVO CÓDIGO =====
                
                // ===== CÓDIGO EXISTENTE: NOTIFICACIONES WHATSAPP =====
                if (window.notificarNuevaReserva) {
                    console.log('📤 Enviando notificaciones WhatsApp...');
                    window.notificarNuevaReserva(result.data);
                }
                
                // Llamar al onSubmit original
                onSubmit(result.data);
            }
        } catch (err) {
            console.error('Error:', err);
            setError("Ocurrió un error al guardar la reserva. Intentá nuevamente.");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // RENDER (SIN CAMBIOS - IGUAL QUE ANTES)
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
                    {/* Resumen del turno */}
                    <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-xl border border-pink-200 space-y-2">
                        <div className="flex items-center gap-3 text-pink-700">
                            <span className="text-2xl">
                                {service.nombre.toLowerCase().includes('corte') ? '✂️' : 
                                 service.nombre.toLowerCase().includes('uña') ? '💅' :
                                 service.nombre.toLowerCase().includes('peinado') ? '💇‍♀️' :
                                 service.nombre.toLowerCase().includes('maquillaje') ? '💄' : '✨'}
                            </span>
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