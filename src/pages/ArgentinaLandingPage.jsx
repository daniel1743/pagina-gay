import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import { Check } from 'lucide-react';
import TelegramBanner from '@/components/ui/TelegramBanner';

const AVATAR_OPTIONS = [
  { id: 'avataaars', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1', name: 'Clásico' },
  { id: 'bottts', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar2', name: 'Robot' },
  { id: 'pixel-art', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar3', name: 'Retro' },
  { id: 'identicon', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar4', name: 'Geométrico' }
];

const ArgentinaLandingPage = () => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [age, setAge] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState(AVATAR_OPTIONS[0]);
  const [acceptRules, setAcceptRules] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  useCanonical('https://chactivo.com/modal-arg');

  React.useEffect(() => {
    document.documentElement.lang = 'es-AR';
    document.title = 'Chat Gay Argentina 🏳️‍🌈 Gratis - Buenos Aires, Palermo, Córdoba | Chactivo';

    const metaDescription = document.querySelector('meta[name="description"]');
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.content = 'Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo, Córdoba, Rosario y toda Argentina. Sin vueltas, che. Entra ya!';

    const ogTags = [
      { property: 'og:title', content: 'Chat Gay Argentina 🏳️‍🌈 Gratis - Buenos Aires, Palermo | Chactivo' },
      { property: 'og:description', content: 'Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo, Córdoba y toda Argentina. Sin vueltas, che.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://chactivo.com/modal-arg' },
      { property: 'og:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { property: 'og:locale', content: 'es_AR' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Chat Gay Argentina 🏳️‍🌈 Gratis' },
      { name: 'twitter:description', content: 'Conoce pibes de Buenos Aires, Palermo, Córdoba. 100% gratis y anónimo.' },
      { name: 'twitter:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { name: 'keywords', content: 'chat gay argentina, chat gay buenos aires, chat gay palermo, chat gay córdoba, chat lgbt argentina, gays argentina, conocer gays argentina' }
    ];

    ogTags.forEach(tag => {
      const prop = tag.property || tag.name;
      const attr = tag.property ? 'property' : 'name';
      let metaTag = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attr, prop);
        document.head.appendChild(metaTag);
      }
      metaTag.content = tag.content;
    });

    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Chat Gay Argentina - Chactivo",
      "description": "Chat gay Argentina 100% gratis. Conoce pibes de Buenos Aires, Palermo, Córdoba, Rosario y toda Argentina.",
      "url": "https://chactivo.com/modal-arg",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "ARS"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Argentina"
      },
      "inLanguage": "es-AR"
    });
    document.head.appendChild(schemaScript);

    return () => {
      if (schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('🇦🇷 [ARGENTINA] 📋 Formulario enviado');

    if (!nickname.trim()) {
      console.log('🇦🇷 [ARGENTINA] ❌ Validación: nickname vacío');
      setError('Ingresa tu nickname');
      return;
    }
    if (nickname.trim().length < 3) {
      console.log('🇦🇷 [ARGENTINA] ❌ Validación: nickname muy corto');
      setError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge)) {
      console.log('🇦🇷 [ARGENTINA] ❌ Validación: edad no es número');
      setError('Ingresa tu edad en números');
      return;
    }
    if (parsedAge < 18) {
      console.log('🇦🇷 [ARGENTINA] ❌ Validación: menor de 18');
      setError('Debes ser mayor de 18 años');
      return;
    }

    if (!acceptRules) {
      console.log('🇦🇷 [ARGENTINA] ❌ Validación: reglas no aceptadas');
      setError('Debes aceptar las reglas del chat');
      return;
    }

    console.log('🇦🇷 [ARGENTINA] ✅ Todas las validaciones pasaron');
    console.log('🇦🇷 [ARGENTINA] 🔐 Intentando entrar con:', {
      nickname: nickname.trim(),
      age: parsedAge,
      avatar: selectedAvatar.url,
      hasAvatar: !!selectedAvatar.url
    });
    setIsLoading(true);

    try {
      console.log('🇦🇷 [ARGENTINA] 💾 Guardando flags en sessionStorage...');
      sessionStorage.setItem(`age_verified_${nickname.trim()}`, 'true');
      sessionStorage.setItem(`rules_accepted_${nickname.trim()}`, 'true');
      console.log('🇦🇷 [ARGENTINA] ✅ Flags guardadas');

      console.log('🇦🇷 [ARGENTINA] 🔑 Llamando a signInAsGuest...');
      await signInAsGuest(nickname.trim(), selectedAvatar.url);
      console.log('🇦🇷 [ARGENTINA] ✅ signInAsGuest exitoso');

      console.log('🇦🇷 [ARGENTINA] 🚀 Navegando a /chat/principal...');
      navigate('/chat/principal', { replace: true });
      console.log('🇦🇷 [ARGENTINA] ✅ navigate() ejecutado');
    } catch (error) {
      console.error('🇦🇷 [ARGENTINA] ❌ Error completo:', error);
      console.error('🇦🇷 [ARGENTINA] ❌ Error.message:', error.message);
      console.error('🇦🇷 [ARGENTINA] ❌ Error.code:', error.code);
      setError(`Error al entrar: ${error.message || 'Intenta de nuevo.'}`);
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .modal-scroll::-webkit-scrollbar {
          display: none;
        }
        .modal-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* 📢 Banner Telegram - Fijo en la parte superior */}
      <TelegramBanner className="fixed top-0 left-0 right-0 z-50" />
      <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', fontFamily: 'Arial, sans-serif', padding: '20px', paddingTop: '50px', boxSizing: 'border-box' }}>
        <div 
          className="modal-scroll"
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '20px', 
            padding: '40px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
            textAlign: 'center', 
            maxHeight: '90vh', 
            overflowY: 'auto'
          }}
        >
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#4facfe', marginBottom: '10px' }}>Chat Gay Argentina</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>Completa estos datos para empezar a chatear</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Tu Nickname *</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ej: Martín23" maxLength={20} required autoFocus style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #4facfe', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: '#333' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Tu Edad *</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ej: 24" min="18" required style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #4facfe', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: '#333' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>Elige tu Avatar *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {AVATAR_OPTIONS.map((avatar) => (
                <button key={avatar.id} type="button" onClick={() => setSelectedAvatar(avatar)} style={{ position: 'relative', padding: '10px', borderRadius: '10px', border: selectedAvatar.id === avatar.id ? '3px solid #4facfe' : '2px solid #ddd', backgroundColor: selectedAvatar.id === avatar.id ? '#e8f8ff' : 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  {selectedAvatar.id === avatar.id && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#4facfe', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                    </div>
                  )}
                  <img src={avatar.url} alt={avatar.name} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f5f5f5' }} />
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
              <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} required style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#4facfe' }} />
              <span>Acepto las reglas del chat. Tengo +18 años y entiendo que debo respetar a los demás usuarios.</span>
            </label>
          </div>

          {error && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33', fontSize: '14px' }}>{error}</div>
          )}

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '15px 20px', fontSize: '16px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', border: 'none', borderRadius: '10px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? '0.7' : '1', boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isLoading ? 'Entrando...' : 'Entrar a Chatear'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: '#999', marginTop: '20px', lineHeight: '1.5' }}>✨ Sin registro • 100% Gratis • Anónimo</p>

        {/* 🚀 SECCIÓN SEO - Contenido optimizado para Google Argentina */}
        <div style={{ marginTop: '40px', textAlign: 'left', lineHeight: '1.7', borderTop: '1px solid #e0e0e0', paddingTop: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#4facfe', marginBottom: '15px', lineHeight: '1.3' }}>
            El Chat Gay Más Grande de Argentina
          </h2>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.7' }}>
            Chactivo es la <strong>comunidad LGBT+ más activa de Argentina</strong>, conectando miles de pibes gays, bisexuales y trans de todo el país. Desde Buenos Aires y Palermo hasta Córdoba, Rosario, Mendoza y cientos de ciudades más. <strong>100% gratis, sin registro obligatorio</strong>, y completamente anónimo. Sin vueltas, che.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00f2fe', marginBottom: '12px', marginTop: '25px' }}>
            ¿Por qué Chactivo es el mejor chat gay de Argentina?
          </h3>
          <ul style={{ fontSize: '14px', color: '#555', marginBottom: '20px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Miles de usuarios activos</strong> cada día en todas las provincias</li>
            <li><strong>Totalmente gratis</strong> - No pedimos tarjeta ni pagos ocultos</li>
            <li><strong>Anónimo y seguro</strong> - Tu privacidad es nuestra prioridad</li>
            <li><strong>Sin descargas</strong> - Funciona directo en tu navegador</li>
            <li><strong>Comunidad respetuosa</strong> - Moderación activa 24/7</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#00f2fe', marginBottom: '12px' }}>
            Ciudades con más actividad en Chactivo Argentina
          </h3>
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.9', marginBottom: '20px' }}>
            <strong>Buenos Aires</strong> • <strong>Palermo</strong> • <strong>Córdoba</strong> • <strong>Rosario</strong> • <strong>Mendoza</strong> • <strong>La Plata</strong> • Mar del Plata • Salta • San Miguel de Tucumán • Santa Fe • San Juan • Resistencia • Santiago del Estero • Corrientes • Posadas • San Salvador de Jujuy • Bahía Blanca • Paraná • Neuquén • Formosa • San Luis • La Rioja • Catamarca • San Fernando del Valle • Villa Mercedes • Comodoro Rivadavia • San Carlos de Bariloche • Río Cuarto • Quilmes • Lanús • San Isidro • Vicente López • Lomas de Zamora • Banfield • Morón • San Martín • Avellaneda • Ramos Mejía • Castelar • Villa Ballester
          </p>

          <p style={{ fontSize: '12px', color: '#999', marginTop: '25px', fontStyle: 'italic', lineHeight: '1.6' }}>
            Chactivo es una plataforma inclusiva para la comunidad LGBT+ de Argentina. Respetamos la diversidad y promovemos un espacio seguro para que gays, lesbianas, bisexuales y personas trans puedan conocerse, chatear y crear amistades. Todos los usuarios deben ser mayores de 18 años.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default ArgentinaLandingPage;
