// components/Confirmation.js - Versión con notificaciones dinámicas

function Confirmation({ booking, onReset }) {
    const [telefonoDuenno, setTelefonoDuenno] = React.useState('53357234');
    const [nombreNegocio, setNombreNegocio] = React.useState('');
    const [ntfyTopic, setNtfyTopic] = React.useState('reservas');
    const [cargando, setCargando] = React.useState(true);

    React.useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                console.log('📱 Confirmation - Cargando datos para notificaciones...');
                const tel = await window.getTelefonoDuenno();
                const nombre = await window.getNombreNegocio();
                const topic = await window.getNtfyTopic();
                
                console.log('📱 Datos cargados:', { tel, nombre, topic });
                
                setTelefonoDuenno(tel);
                setNombreNegocio(nombre);
                setNtfyTopic(topic);
            } catch (error) {
                console.error('Error cargando datos de notificación:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    if (!booking) {
        console.error('❌ booking no definido');
        return null;
    }

    const enviarWhatsAppDuenno = () => {
        try {
            const fechaConDia = window.formatFechaCompleta ? 
                window.formatFechaCompleta(booking.fecha) : 
                booking.fecha;
            
            const horaFormateada = formatTo12Hour(booking.hora_inicio);
            const profesional = booking.profesional_nombre || booking.trabajador_nombre || 'No asignada';
            
            const mensaje = 
`🆕 *NUEVA RESERVA - ${nombreNegocio}*

👤 *Cliente:* ${booking.cliente_nombre}
📱 *WhatsApp:* ${booking.cliente_whatsapp}
💅 *Servicio:* ${booking.servicio} (${booking.duracion} min)
📅 *Fecha:* ${fechaConDia}
⏰ *Hora:* ${horaFormateada}
👩‍🎨 *Profesional:* ${profesional}

✅ Reserva confirmada automáticamente. 💖`;

            const telefonoLimpio = telefonoDuenno.replace(/\D/g, '');
            const encodedText = encodeURIComponent(mensaje);
            
            console.log('📤 Enviando WhatsApp a:', telefonoLimpio);
            
            const link = document.createElement('a');
            link.href = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodedText}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
            }, 200);
            
            console.log('✅ WhatsApp enviado a la administradora');
        } catch (error) {
            console.error('Error enviando WhatsApp:', error);
        }
    };

    const enviarPushDuenno = () => {
        try {
            const fechaConDia = window.formatFechaCompleta ? 
                window.formatFechaCompleta(booking.fecha) : 
                booking.fecha;
            
            const horaFormateada = formatTo12Hour(booking.hora_inicio);
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

            const tituloPush = `Nueva reserva - ${nombreNegocio}`;

            console.log('📤 Enviando push a ntfy:', ntfyTopic);
            
            fetch(`https://ntfy.sh/${ntfyTopic}`, {
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
                    console.log('✅ Notificación push enviada a ntfy:', ntfyTopic);
                } else {
                    console.error('❌ Error en respuesta ntfy:', response.status);
                }
            })
            .catch(error => {
                console.error('❌ Error enviando notificación push:', error);
            });
            
        } catch (error) {
            console.error('Error enviando Push:', error);
        }
    };

    React.useEffect(() => {
        if (cargando) return;
        
        const timer = setTimeout(() => {
            console.log('📤 Enviando notificaciones a:', telefonoDuenno);
            enviarWhatsAppDuenno();
            enviarPushDuenno();
            console.log('✅ Ambas notificaciones enviadas');
        }, 1500);
        
        return () => clearTimeout(timer);
    }, [telefonoDuenno, nombreNegocio, ntfyTopic, cargando]);

    const fechaConDia = window.formatFechaCompleta ? 
        window.formatFechaCompleta(booking.fecha) : 
        booking.fecha;

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in bg-gradient-to-b from-pink-50 to-pink-100">
            <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ring-pink-300">
                <span className="text-4xl text-white">✅</span>
            </div>
            
            <h2 className="text-2xl font-bold text-pink-800 mb-2">✨ ¡Turno Reservado! ✨</h2>
            <p className="text-pink-600 mb-6 max-w-xs mx-auto">Tu cita ha sido agendada correctamente</p>

            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-pink-300 w-full max-w-sm mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-500"></div>
                <div className="space-y-4 text-left">
                    <div>
                        <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">Cliente</div>
                        <div className="font-medium text-pink-700 text-lg">{booking.cliente_nombre}</div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">WhatsApp</div>
                        <div className="font-medium text-pink-700">{booking.cliente_whatsapp}</div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">Servicio</div>
                        <div className="font-medium text-pink-700">{booking.servicio}</div>
                        <div className="text-sm text-pink-500">{booking.duracion} min</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">Fecha</div>
                            <div className="font-medium text-pink-700 text-sm">{fechaConDia}</div>
                        </div>
                        <div>
                            <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">Hora</div>
                            <div className="font-medium text-pink-700">{formatTo12Hour(booking.hora_inicio)}</div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-pink-400 uppercase tracking-wider font-semibold mb-1">Profesional</div>
                        <div className="font-medium text-pink-700">{booking.profesional_nombre || booking.trabajador_nombre || 'No asignada'}</div>
                    </div>
                </div>
            </div>

            <div className="bg-pink-100 border border-pink-300 rounded-lg p-4 mb-6 max-w-sm w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white text-xl">
                        📱
                    </div>
                    <div className="text-left">
                        <p className="font-medium text-pink-800">Administradora notificada</p>
                        <p className="text-xs text-pink-600">✅ WhatsApp + Notificación enviados</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                    onClick={onReset}
                    className="w-full bg-pink-500 text-white py-4 rounded-xl font-bold hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-lg shadow-md"
                >
                    <span>✨</span>
                    Reservar otro turno
                    <span>💅</span>
                </button>
                
                <div className="text-sm text-pink-600 bg-white/80 backdrop-blur-sm p-4 rounded-lg flex items-center justify-center gap-2 border border-pink-300">
                   <span className="text-pink-500 text-xl">📱</span>
                   <span>Contacto: +{telefonoDuenno}</span>
                </div>
            </div>
        </div>
    );
}