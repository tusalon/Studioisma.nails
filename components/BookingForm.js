// components/BookingForm.js - VERSIÓN CORREGIDA (fechas funcionando)

function BookingForm({ service, profesional, date, time, onSubmit, onCancel, cliente }) {
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);

    // ============================================
    // GENERAR UUID
    // ============================================
    function generarUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ============================================
    // FORMATEAR FECHA SETMORE (CORREGIDO)
    // ============================================
    function formatearFechaSetmore(fechaStr, horaStr) {
        // Si no hay hora, usar una hora por defecto
        if (!horaStr) horaStr = '12:00';
        
        const [year, month, day] = fechaStr.split('-');
        const [hour, minute] = horaStr.split(':');
        
        const fecha = new Date(Date.UTC(
            parseInt(year), 
            parseInt(month) - 1, 
            parseInt(day), 
            parseInt(hour), 
            parseInt(minute), 
            0
        ));
        
        // Verificar que la fecha es válida
        if (isNaN(fecha.getTime())) {
            console.error('Fecha inválida:', fechaStr, horaStr);
            return '20260101T120000Z'; // Fecha por defecto
        }
        
        const yearStr = fecha.getUTCFullYear();
        const monthStr = String(fecha.getUTCMonth() + 1).padStart(2, '0');
        const dayStr = String(fecha.getUTCDate()).padStart(2, '0');
        const hourStr2 = String(fecha.getUTCHours()).padStart(2, '0');
        const minuteStr = String(fecha.getUTCMinutes()).padStart(2, '0');
        
        return `${yearStr}${monthStr}${dayStr}T${hourStr2}${minuteStr}00Z`;
    }

    // ============================================
    // CALCULAR HORA FIN (CORREGIDO)
    // ============================================
    function calcularHoraFin(horaInicio, duracionMinutos) {
        const [hour, minute] = horaInicio.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(hour, minute, 0);
        fecha.setMinutes(fecha.getMinutes() + duracionMinutos);
        
        const hourFin = String(fecha.getHours()).padStart(2, '0');
        const minuteFin = String(fecha.getMinutes()).padStart(2, '0');
        return `${hourFin}:${minuteFin}`;
    }

    // ============================================
    // FECHA LEGIBLE SIN ACENTOS
    // ============================================
    function formatearFechaLegible(fechaStr, horaStr) {
        const fecha = new Date(fechaStr + 'T' + horaStr + ':00');
        
        if (isNaN(fecha.getTime())) {
            return 'Invalid Date';
        }
        
        const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dias = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const diaSemana = dias[fecha.getDay()];
        const dia = fecha.getDate();
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();
        
        let horas = fecha.getHours();
        const minutos = fecha.getMinutes().toString().padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        horas = horas % 12;
        horas = horas ? horas : 12;
        
        return `${dia} ${mes} ${año} ${horas}:${minutos} ${ampm}`;
    }

    // ============================================
    // GENERAR ARCHIVO .ICS (CORREGIDO)
    // ============================================
    function generarArchivoCalendario(bookingData) {
        const uid = generarUUID();
        const dtstart = formatearFechaSetmore(bookingData.fecha, bookingData.hora_inicio);
        
        // Calcular hora fin si no existe
        let horaFin = bookingData.hora_fin;
        if (!horaFin) {
            horaFin = calcularHoraFin(bookingData.hora_inicio, bookingData.duracion || 60);
        }
        
        const dtend = formatearFechaSetmore(bookingData.fecha, horaFin);
        
        // DTSTAMP
        const ahora = new Date();
        const stampYear = ahora.getUTCFullYear();
        const stampMonth = String(ahora.getUTCMonth() + 1).padStart(2, '0');
        const stampDay = String(ahora.getUTCDate()).padStart(2, '0');
        const stampHour = String(ahora.getUTCHours()).padStart(2, '0');
        const stampMin = String(ahora.getUTCMinutes()).padStart(2, '0');
        const dtstamp = `${stampYear}${stampMonth}${stampDay}T${stampHour}${stampMin}00`;
        
        // Fechas legibles
        const fechaLegible = formatearFechaLegible(bookingData.fecha, bookingData.hora_inicio);
        const fechaFinLegible = formatearFechaLegible(bookingData.fecha, horaFin);
        
        const descripcion = `Appointment Details\nWhen: ${fechaLegible} - ${fechaFinLegible}\nService: ${bookingData.servicio}\nProvider Name: ${bookingData.profesional_nombre}\nClient: ${bookingData.cliente_nombre}\nWhatsApp: +53 ${bookingData.cliente_whatsapp}\n\nStudioisma.nails`;
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Studioisma//Setmore//EN
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
SUMMARY:${bookingData.servicio} with ${bookingData.profesional_nombre}
TRANSP:OPAQUE
LOCATION:Studioisma.nails
DESCRIPTION:${descripcion}
ORGANIZER;CN="Studioisma.nails":mailto:studioisma@gmail.com
ATTENDEE;ROLE=CHAIR;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="Studioisma.nails":MAILTO:studioisma@gmail.com
ATTENDEE;ROLE=REQ-PARTICIPANT;CUTYPE=INDIVIDUAL;RSVP=FALSE;CN="${bookingData.cliente_nombre}":MAILTO:cliente@email.com
STATUS:CONFIRMED
CLASS:PUBLIC
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: Your appointment is TOMORROW
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: Your appointment is in 1 HOUR
END:VALARM
END:VEVENT
END:VCALENDAR`;
    }

    // ============================================
    // DESCARGAR ARCHIVO
    // ============================================
    function descargarArchivoICS(contenido, nombreArchivo) {
        try {
            const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = nombreArchivo;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Archivo descargado');
            return true;
        } catch (error) {
            console.error('Error:', error);
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

            console.log('Booking data:', bookingData);

            const result = await createBooking(bookingData);
            
            if (result.success && result.data) {
                console.log('✅ Reserva creada');
                
                // Usar los datos de la reserva (incluyendo hora_fin)
                const icsContent = generarArchivoCalendario(result.data);
                
                const fechaSegura = result.data.fecha.replace(/-/g, '');
                const horaSegura = result.data.hora_inicio.replace(':', '');
                const nombreSeguro = result.data.cliente_nombre
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                const nombreArchivo = `turno-${fechaSegura}-${horaSegura}-${nombreSeguro}.ics`;
                
                descargarArchivoICS(icsContent, nombreArchivo);
                
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