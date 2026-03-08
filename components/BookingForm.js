// components/BookingForm.js - VERSIÓN CON DATA URI (funciona en todos lados)

function BookingForm({ service, profesional, date, time, onSubmit, onCancel, cliente }) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [downloadLink, setDownloadLink] = React.useState(null);
    const [showDownload, setShowDownload] = React.useState(false);

    // ============================================
    // FUNCIÓN PARA ARCHIVO .ICS (BASADA EN SETMORE)
    // ============================================
    function generarArchivoCalendario(bookingData) {
        // Generar UUID único
        const uuid = crypto.randomUUID ? 
            crypto.randomUUID() : 
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Fechas en formato UTC (con Z)
        const fechaTurno = new Date(bookingData.fecha + 'T' + bookingData.hora_inicio + ':00');
        const fechaFin = new Date(fechaTurno.getTime() + (bookingData.duracion || 60) * 60000);
        
        const formatUTC = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        const dtstart = formatUTC(fechaTurno);
        const dtend = formatUTC(fechaFin);
        const dtstamp = formatUTC(new Date());
        
        // Datos
        const servicio = bookingData.servicio || 'Turno';
        const profesional = bookingData.profesional_nombre || 'Profesional';
        const clienteNombre = bookingData.cliente_nombre || 'Cliente';
        const telefono = bookingData.cliente_whatsapp || '';

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Studioisma//Recordatorios//ES
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
UID:${uuid}
SEQUENCE:0
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${servicio} con ${profesional}
TRANSP:OPAQUE
LOCATION:Studioisma.nails
DESCRIPTION:Appointment Details\\nWhen: ${new Date(fechaTurno).toLocaleString()}\\nService: ${servicio}\\nProvider: ${profesional}\\nClient: ${clienteNombre}\\nWhatsApp: +${telefono}
ORGANIZER;CN="Studioisma.nails":mailto:studioisma@gmail.com
ATTENDEE;ROLE=CHAIR;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="Studioisma.nails":MAILTO:studioisma@gmail.com
ATTENDEE;ROLE=REQ-PARTICIPANT;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="${clienteNombre}":MAILTO:cliente@email.com
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
    // FUNCIÓN PARA CREAR DATA URI (UNIVERSAL)
    // ============================================
    function crearDataURI(contenido) {
        // Codificar el contenido para URL
        const encoded = encodeURIComponent(contenido);
        return `data:text/calendar;charset=utf-8,${encoded}`;
    }

    // ============================================
    // HANDLE SUBMIT
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setShowDownload(false);

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
                
                // ===== GENERAR ENLACE DE DESCARGA =====
                try {
                    const icsContent = generarArchivoCalendario(result.data);
                    const dataUri = crearDataURI(icsContent);
                    
                    const fechaSegura = result.data.fecha.replace(/-/g, '');
                    const horaSegura = result.data.hora_inicio.replace(':', '');
                    const nombreSeguro = result.data.cliente_nombre
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                    
                    const nombreArchivo = `turno-${fechaSegura}-${horaSegura}-${nombreSeguro}.ics`;
                    
                    setDownloadLink({ uri: dataUri, filename: nombreArchivo });
                    setShowDownload(true);
                    
                } catch (icsError) {
                    console.error('Error generando ICS:', icsError);
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

                    {/* ===== ENLACE DE DESCARGA UNIVERSAL ===== */}
                    {showDownload && downloadLink && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300 animate-pulse">
                            <p className="text-sm text-green-700 mb-3 font-bold text-center">
                                📅 ¡Turno confirmado!
                            </p>
                            <p className="text-sm text-green-600 mb-3 text-center">
                                Toca el botón para guardar el recordatorio en tu calendario:
                            </p>
                            <a
                                href={downloadLink.uri}
                                download={downloadLink.filename}
                                className="block w-full bg-green-600 text-white text-center py-4 px-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
                                onClick={() => {
                                    setTimeout(() => {
                                        setShowDownload(false);
                                    }, 5000);
                                }}
                            >
                                📥 DESCARGAR RECORDATORIO
                            </a>
                            <p className="text-xs text-green-600 mt-3 text-center">
                                (Al tocar, se descargará un archivo .ics. Ábrelo para agregar a tu calendario con recordatorios 24h y 1h antes)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}