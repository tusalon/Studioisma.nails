// components/InstallButton.js - Botón de instalación PWA

function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);
    const [isInstallable, setIsInstallable] = React.useState(false);
    const [isInstalled, setIsInstalled] = React.useState(false);
    const [platform, setPlatform] = React.useState('');

    React.useEffect(() => {
        // Detectar plataforma
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) {
            setPlatform('android');
        } else if (/iphone|ipad|ipod/i.test(ua)) {
            setPlatform('ios');
        } else {
            setPlatform('desktop');
        }

        // Detectar si ya está instalada (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            setIsInstalled(true);
        }

        // Capturar el evento beforeinstallprompt (solo Android/Desktop)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('✅ beforeinstallprompt capturado');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detectar cuando se instaló
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('✅ App instalada correctamente');
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (platform === 'ios') {
            // iOS no soporta beforeinstallprompt, mostrar instrucciones
            alert('📱 Para instalar en iPhone:\n\n1. Tocá el botón Compartir (📤)\n2. Seleccioná "Agregar a pantalla de inicio"\n3. Confirmá');
            return;
        }

        if (!deferredPrompt) return;

        // Mostrar el prompt de instalación
        deferredPrompt.prompt();

        // Esperar la respuesta del usuario
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`✅ Resultado de la instalación: ${outcome}`);

        // Limpiar el prompt guardado
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    // No mostrar el botón si ya está instalada
    if (isInstalled) return null;

    // En iOS, mostrar un botón con instrucciones
    if (platform === 'ios') {
        return (
            <button
                onClick={handleInstallClick}
                className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-110 flex items-center gap-3 border-2 border-pink-300"
                title="Instalar aplicación"
            >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">📱</span>
                </div>
                <div className="text-left">
                    <div className="font-bold text-sm">Instalar App</div>
                    <div className="text-xs text-pink-200">iPhone: Compartir → Pantalla inicio</div>
                </div>
            </button>
        );
    }

    // En Android/Desktop, mostrar botón de instalación solo si es instalable
    if (!isInstallable) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-110 flex items-center gap-3 border-2 border-pink-300"
            title="Instalar aplicación"
        >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">📲</span>
            </div>
            <div className="text-left">
                <div className="font-bold text-sm">Instalar App</div>
                <div className="text-xs text-pink-200">Acceso directo</div>
            </div>
        </button>
    );
}