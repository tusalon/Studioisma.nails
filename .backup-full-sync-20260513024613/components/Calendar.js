// components/Calendar.js - VERSIÓN CORREGIDA
// Los días que el profesional NO trabaja se muestran como NO DISPONIBLES desde el principio

function Calendar({ onDateSelect, selectedDate, profesional }) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [diasLaborales, setDiasLaborales] = React.useState([]);
    const [diasCerrados, setDiasCerrados] = React.useState([]);
    const [cargandoHorarios, setCargandoHorarios] = React.useState(true);
    const [errorCargando, setErrorCargando] = React.useState(null);

    React.useEffect(() => {
        if (!profesional) {
            setCargandoHorarios(false);
            return;
        }
        
        const cargarDisponibilidad = async () => {
            setCargandoHorarios(true);
            setErrorCargando(null);
            try {
                console.log(`📅 Cargando días laborales de ${profesional.nombre}...`);
                const horarios = await window.salonConfig.getHorariosProfesional(profesional.id);
                console.log(`✅ Días laborales de ${profesional.nombre}:`, horarios.dias);
                setDiasLaborales(horarios.dias || []);
                
                // Cargar días cerrados globales
                const diasCerradosList = await window.getDiasCerrados();
                setDiasCerrados(diasCerradosList.map(d => d.fecha));
                
            } catch (error) {
                console.error('Error cargando disponibilidad:', error);
                setErrorCargando('Error al cargar la disponibilidad del profesional');
                setDiasLaborales([]);
                setDiasCerrados([]);
            } finally {
                setCargandoHorarios(false);
            }
        };
        
        cargarDisponibilidad();
        
        // Escuchar cambios en días cerrados
        const handleActualizacion = () => cargarDisponibilidad();
        window.addEventListener('diasCerradosActualizados', handleActualizacion);
        
        return () => {
            window.removeEventListener('diasCerradosActualizados', handleActualizacion);
        };
        
    }, [profesional]);

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getTodayLocalString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // 🔥 FUNCIÓN CORREGIDA: Verifica si el profesional trabaja este día
    const profesionalTrabajaEsteDia = (date) => {
        if (!profesional) return true;
        
        // Si no hay días laborales configurados, asumir que trabaja todos los días
        if (!diasLaborales || diasLaborales.length === 0) {
            console.log(`⚠️ ${profesional.nombre} - Sin configuración de días, asumiendo que trabaja`);
            return true;
        }
        
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaSemana = diasSemana[date.getDay()];
        const trabaja = diasLaborales.includes(diaSemana);
        
        console.log(`📅 ${profesional.nombre} - ${diaSemana}: ${trabaja ? 'TRABAJA ✅' : 'NO TRABAJA ❌'}`);
        
        return trabaja;
    };

    const esDiaCerrado = (date) => {
        const fechaStr = formatDate(date);
        return diasCerrados.includes(fechaStr);
    };

    const nextMonth = () => {
        const next = new Date(currentDate);
        next.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(next);
    };

    const prevMonth = () => {
        const prev = new Date(currentDate);
        prev.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(prev);
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        
        // Días del mes anterior para completar la primera semana
        const firstDayOfWeek = firstDay.getDay(); // 0 = domingo
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // Días del mes actual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        
        return days;
    };

    const days = getDaysInMonth();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Mostrar loading mientras se cargan los horarios
    if (cargandoHorarios) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    3. Seleccioná una fecha
                    {profesional && (
                        <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full ml-2">
                            con {profesional.nombre}
                        </span>
                    )}
                </h2>
                <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-b-2 border-pink-500 rounded-full mx-auto"></div>
                    <p className="text-pink-400 mt-4">Cargando días disponibles...</p>
                </div>
            </div>
        );
    }

    if (errorCargando) {
        return (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    3. Seleccioná una fecha
                </h2>
                <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-red-600">{errorCargando}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-3 text-sm text-pink-600 underline"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                3. Seleccioná una fecha
                {profesional && (
                    <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full ml-2">
                        con {profesional.nombre}
                    </span>
                )}
                {selectedDate && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full ml-2">
                        ✓ Fecha seleccionada
                    </span>
                )}
            </h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-pink-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-pink-100 border-b border-pink-200">
                    <button 
                        onClick={prevMonth} 
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-pink-600"
                        title="Mes anterior"
                    >
                        ◀
                    </button>
                    <span className="font-bold text-pink-800 text-lg capitalize">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button 
                        onClick={nextMonth} 
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-pink-600"
                        title="Mes siguiente"
                    >
                        ▶
                    </button>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                            <div key={i} className={`text-xs font-medium py-1 ${d === 'D' ? 'text-pink-400' : 'text-pink-600'}`}>
                                {d}
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, idx) => {
                            if (!date) return <div key={idx} className="h-10" />;

                            const dateStr = formatDate(date);
                            const past = isPastDate(date);
                            const selected = selectedDate === dateStr;
                            
                            // 🔥 VERIFICACIONES CORREGIDAS
                            const profesionalTrabaja = profesionalTrabajaEsteDia(date);
                            const cerrado = esDiaCerrado(date);
                            
                            // Un día está disponible SOLO si:
                            // 1. No es pasado
                            // 2. El profesional trabaja ese día
                            // 3. No es un día cerrado global
                            const available = !past && profesionalTrabaja && !cerrado;
                            
                            let className = "h-10 w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all relative";
                            
                            if (selected) {
                                className += " bg-pink-500 text-white shadow-md scale-105 ring-2 ring-pink-300";
                            } else if (!available) {
                                className += " text-pink-300 cursor-not-allowed bg-pink-50/50";
                            } else {
                                className += " text-pink-700 hover:bg-pink-100 hover:text-pink-600 hover:scale-105 cursor-pointer";
                            }
                            
                            // 🔥 MENSAJES EXPLICATIVOS PARA CADA TIPO DE DÍA NO DISPONIBLE
                            let title = "";
                            if (cerrado) {
                                title = "🚫 Día cerrado (feriado/vacaciones)";
                            } else if (past) {
                                title = "📅 Fecha pasada";
                            } else if (!profesionalTrabaja && profesional) {
                                const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
                                const diaSemana = diasSemana[date.getDay()];
                                const diaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                                title = `${profesional.nombre} no trabaja los ${diaCapitalizado}s`;
                            } else {
                                title = "✅ Disponible";
                            }
                            
                            return (
                                <button
                                    key={idx}
                                    onClick={() => available && onDateSelect(dateStr)}
                                    disabled={!available}
                                    className={className}
                                    title={title}
                                >
                                    {date.getDate()}
                                    {cerrado && (
                                        <span className="absolute top-0 right-0 text-[10px] text-red-500">🚫</span>
                                    )}
                                    {!profesionalTrabaja && !cerrado && !past && profesional && (
                                        <span className="absolute top-0 right-0 text-[10px] text-pink-300">⛔</span>
                                    )}
                                    {available && !selected && !cerrado && (
                                        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 🔥 LEYENDA EXPLICATIVA */}
            {profesional && (
                <div className="text-xs text-pink-600 bg-pink-50 p-3 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-pink-400 text-sm">📅</span>
                        <span className="font-medium">Días que trabaja {profesional.nombre}:</span>
                    </div>
                    <div className="mb-2">
                        {diasLaborales.length > 0 
                            ? diasLaborales.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                            : '⚠️ Todos los días (sin configuración específica - contactá a la administradora)'}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-pink-200">
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                            <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-pink-200 rounded-full"></span>
                            <span>No disponible</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-300 rounded-full"></span>
                            <span>Día cerrado</span>
                        </div>
                        {diasLaborales.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-pink-400 text-xs">⛔</span>
                                <span>No trabaja ese día</span>
                            </div>
                        )}
                    </div>
                    {diasCerrados.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-red-400 text-sm">🚫</span>
                            <span>
                                <strong>Días cerrados:</strong> {diasCerrados.length} día(s) no disponible(s)
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}