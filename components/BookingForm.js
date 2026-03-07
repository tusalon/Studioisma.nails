// components/BookingForm.js - VERSIÓN CORREGIDA

function BookingForm({ service, profesional, date, time, onSubmit, onCancel, cliente }) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    // ============================================
    // FUNCIÓN CORREGIDA PARA ARCHIVO .ICS
    // ============================================
    function generarArchivoCalendario(bookingData) {
        // Formato IDENTICO al que funcionó en la prueba manual
        const fecha = bookingData.fecha.replace(/-/g, '');
        const hora = bookingData.hora_inicio.replace(':', '');
        const fechaHora = fecha + 'T' + hora + '00';
        
        // Calcular hora fin (1 hora después)
        const horaInicio = parseInt(bookingData.hora_inicio.split(':')[0]);
        const minInicio = bookingData.hora_inicio.split(':')[1];
        const horaFin = horaInicio + 1;
        const horaFinStr = horaFin.toString().padStart(2, '0') + ':' + minInicio;
        const fechaHoraFin = fecha + 'T' + horaFinStr.replace(':', '') + '00';
        
        // Mismo formato exacto que funcionó
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Studioisma//ES
BEGIN:VEVENT
UID:${bookingData.id || Date.now()}@studioisma.com
DTSTART:${fechaHora}
DTEND:${fechaHoraFin}
SUMMARY:${bookingData.servicio}
DESCRIPTION:Turno en Studioisma con ${bookingData.profesional_nombre || 'profesional'}
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
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Verificar disponibilidad
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
                
                // ===== GENERAR ARCHIVO DE CALENDARIO =====
                try {
                    const icsContent = generarArchivoCalendario(result.data);
                    
                    const fechaSegura = result.data.fecha.replace(/-/g, '');
                    const horaSegura = result.data.hora_inicio.replace(':', '');
                    const nombreSeguro = result.data.cliente_nombre
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                    
                    const nombreArchivo = `turno-${fechaSegura}-${horaSegura}-${nombreSeguro}.ics`;
                    
                    descargarArchivoICS(icsContent, nombreArchivo);
                    
                    setTimeout(() => {
                        alert('📅 Se descargó un archivo de calendario. Ábrelo para agregar el turno a tu agenda.');
                    }, 500);
                    
                } catch (icsError) {
                    console.error('Error generando ICS:', icsError);
                }
                
                // Notificaciones existentes
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
    // RENDER (IGUAL QUE ANTES)
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