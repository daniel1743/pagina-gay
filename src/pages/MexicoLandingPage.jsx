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

const MexicoLandingPage = () => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [age, setAge] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState(AVATAR_OPTIONS[0]);
  const [acceptRules, setAcceptRules] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  useCanonical('https://chactivo.com/modal-mx');

  React.useEffect(() => {
    document.documentElement.lang = 'es-MX';
    document.title = 'Chat Gay México 🏳️‍🌈 Gratis - CDMX, Zona Rosa, Guadalajara | Chactivo';

    const metaDescription = document.querySelector('meta[name="description"]');
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.content = 'Chat gay México 100% gratis. Conoce chavos de CDMX, Zona Rosa, Guadalajara, Monterrey y todo México. Sin pedos, wey. Entra ya!';

    const ogTags = [
      { property: 'og:title', content: 'Chat Gay México 🏳️‍🌈 Gratis - CDMX, Guadalajara | Chactivo' },
      { property: 'og:description', content: 'Chat gay México 100% gratis. Conoce chavos de CDMX, Zona Rosa, Guadalajara y todo México. Sin pedos, wey.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://chactivo.com/modal-mx' },
      { property: 'og:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { property: 'og:locale', content: 'es_MX' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Chat Gay México 🏳️‍🌈 Gratis' },
      { name: 'twitter:description', content: 'Conoce chavos de CDMX, Zona Rosa, Guadalajara. 100% gratis y anónimo.' },
      { name: 'twitter:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { name: 'keywords', content: 'chat gay méxico, chat gay cdmx, chat gay guadalajara, chat gay monterrey, chat lgbt méxico, gays méxico, chat gay zona rosa, conocer gays méxico' }
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
      "name": "Chat Gay México - Chactivo",
      "description": "Chat gay México 100% gratis. Conoce chavos de CDMX, Zona Rosa, Guadalajara, Monterrey y todo México.",
      "url": "https://chactivo.com/modal-mx",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "MXN"
      },
      "areaServed": {
        "@type": "Country",
        "name": "México"
      },
      "inLanguage": "es-MX"
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

    if (!nickname.trim()) { setError('Ingresa tu nickname'); return; }
    if (nickname.trim().length < 3) { setError('El nickname debe tener al menos 3 caracteres'); return; }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge)) { setError('Ingresa tu edad en números'); return; }
    if (parsedAge < 18) { setError('Debes ser mayor de 18 años'); return; }

    if (!acceptRules) { setError('Debes aceptar las reglas del chat'); return; }

    console.log('🇲🇽 [MÉXICO] Intentando entrar con:', { nickname: nickname.trim(), age: parsedAge, avatar: selectedAvatar.url });
    setIsLoading(true);

    try {
      sessionStorage.setItem(`age_verified_${nickname.trim()}`, 'true');
      sessionStorage.setItem(`rules_accepted_${nickname.trim()}`, 'true');
      await signInAsGuest(nickname.trim(), selectedAvatar.url);
      console.log('🇲🇽 [MÉXICO] Autenticación exitosa, navegando a /chat/principal');
      navigate('/chat/principal', { replace: true });
    } catch (error) {
      console.error('🇲🇽 [MÉXICO] Error al entrar:', error);
      setError('Error al entrar. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ⚠️ TELEGRAM BANNER ELIMINADO */}
      <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', fontFamily: 'Arial, sans-serif', padding: '20px', paddingTop: '50px', boxSizing: 'border-box' }}>
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '20px', 
          padding: '40px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
          textAlign: 'center', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
        className="[&::-webkit-scrollbar]:hidden" // Chrome, Safari, Edge
      >
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#f5576c', marginBottom: '10px' }}>Chat Gay México</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>Completa estos datos para empezar a chatear</p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Tu Nickname *</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ej: Miguel23" maxLength={20} required autoFocus style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #f5576c', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: '#333' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Tu Edad *</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ej: 24" min="18" required style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #f5576c', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white', color: '#333' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>Elige tu Avatar *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {AVATAR_OPTIONS.map((avatar) => (
                <button key={avatar.id} type="button" onClick={() => setSelectedAvatar(avatar)} style={{ position: 'relative', padding: '10px', borderRadius: '10px', border: selectedAvatar.id === avatar.id ? '3px solid #f5576c' : '2px solid #ddd', backgroundColor: selectedAvatar.id === avatar.id ? '#fff0f3' : 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  {selectedAvatar.id === avatar.id && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: '#f5576c', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <input type="checkbox" checked={acceptRules} onChange={(e) => setAcceptRules(e.target.checked)} required style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#f5576c' }} />
              <span>Acepto las reglas del chat. Tengo +18 años y entiendo que debo respetar a los demás usuarios.</span>
            </label>
          </div>

          {error && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33', fontSize: '14px' }}>{error}</div>
          )}

          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', color: 'white', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none', borderRadius: '10px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? '0.7' : '1', boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)' }}>
            {isLoading ? 'Entrando...' : 'Entrar a Chatear'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: '#999', marginTop: '20px', lineHeight: '1.5' }}>✨ Sin registro • 100% Gratis • Anónimo</p>

        {/* 🚀 SECCIÓN SEO - Contenido optimizado para Google México */}
        <div style={{ marginTop: '40px', textAlign: 'left', lineHeight: '1.7', borderTop: '1px solid #e0e0e0', paddingTop: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f5576c', marginBottom: '15px', lineHeight: '1.3' }}>
            El Chat Gay Más Grande de México
          </h2>
          <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.7' }}>
            Chactivo es la <strong>comunidad LGBT+ más activa de México</strong>, conectando miles de chavos gays, bisexuales y trans de todo el país. Desde CDMX y Zona Rosa hasta Guadalajara, Monterrey, Puebla y cientos de ciudades más. <strong>100% gratis, sin registro obligatorio</strong>, y completamente anónimo. Sin pedos, wey.
          </p>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f093fb', marginBottom: '12px', marginTop: '25px' }}>
            ¿Por qué Chactivo es el mejor chat gay de México?
          </h3>
          <ul style={{ fontSize: '14px', color: '#555', marginBottom: '20px', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Miles de usuarios activos</strong> cada día en todos los estados</li>
            <li><strong>Totalmente gratis</strong> - No pedimos tarjeta ni pagos ocultos</li>
            <li><strong>Anónimo y seguro</strong> - Tu privacidad es nuestra prioridad</li>
            <li><strong>Sin descargas</strong> - Funciona directo en tu navegador</li>
            <li><strong>Comunidad respetuosa</strong> - Moderación activa 24/7</li>
          </ul>

          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f093fb', marginBottom: '12px' }}>
            Ciudades con más actividad en Chactivo México
          </h3>
          <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.9', marginBottom: '20px' }}>
            <strong>CDMX</strong> • <strong>Zona Rosa</strong> • <strong>Guadalajara</strong> • <strong>Monterrey</strong> • <strong>Puebla</strong> • <strong>Tijuana</strong> • León • Juárez • Zapopan • Mérida • San Luis Potosí • Aguascalientes • Querétaro • Morelia • Saltillo • Toluca • Cancún • Chihuahua • Culiacán • Hermosillo • Mexicali • Acapulco • Veracruz • Tlalnepantla • Cuernavaca • Durango • Torreón • Tuxtla • Pachuca • Reynosa • Oaxaca • Tlaxcala • Mazatlán • Xalapa • Puerto Vallarta • Celaya • Tampico • Irapuato • Playa del Carmen • Ensenada
          </p>

          <p style={{ fontSize: '12px', color: '#999', marginTop: '25px', fontStyle: 'italic', lineHeight: '1.6' }}>
            Chactivo es una plataforma inclusiva para la comunidad LGBT+ de México. Respetamos la diversidad y promovemos un espacio seguro para que gays, lesbianas, bisexuales y personas trans puedan conocerse, chatear y crear amistades. Todos los usuarios deben ser mayores de 18 años.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default MexicoLandingPage;
