import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import { Check } from 'lucide-react';

// 4 avatares predefinidos
const AVATAR_OPTIONS = [
  {
    id: 'avataaars',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
    name: 'Clásico'
  },
  {
    id: 'bottts',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar2',
    name: 'Robot'
  },
  {
    id: 'pixel-art',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar3',
    name: 'Retro'
  },
  {
    id: 'identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar4',
    name: 'Geométrico'
  }
];

const SpainLandingPage = () => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [age, setAge] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState(AVATAR_OPTIONS[0]);
  const [acceptRules, setAcceptRules] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  useCanonical('/modal-es');

  React.useEffect(() => {
    document.title = 'Chat Gay España 🏳️‍🌈 Gratis - Madrid, Barcelona, Valencia | Chactivo';

    const metaDescription = document.querySelector('meta[name="description"]');
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.content = 'Chat gay España 100% gratis. Conoce tíos de Madrid, Barcelona, Valencia y toda España. Sin rollos, tío. Entra ya y chatea con gays españoles.';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar nickname
    if (!nickname.trim()) {
      setError('Ingresa tu nickname');
      return;
    }
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    // Validar edad
    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge)) {
      setError('Ingresa tu edad en números');
      return;
    }
    if (parsedAge < 18) {
      setError('Debes ser mayor de 18 años');
      return;
    }

    // Validar reglas
    if (!acceptRules) {
      setError('Debes aceptar las reglas del chat');
      return;
    }

    console.log('🇪🇸 [ESPAÑA] Intentando entrar con:', { nickname: nickname.trim(), age: parsedAge, avatar: selectedAvatar.url });
    setIsLoading(true);

    try {
      // Guardar edad en sessionStorage para evitar que ChatPage vuelva a preguntar
      sessionStorage.setItem(`age_verified_${nickname.trim()}`, 'true');
      sessionStorage.setItem(`rules_accepted_${nickname.trim()}`, 'true');

      await signInAsGuest(nickname.trim(), selectedAvatar.url);
      console.log('🇪🇸 [ESPAÑA] Autenticación exitosa, navegando a /chat/principal');

      navigate('/chat/principal', { replace: true });
    } catch (error) {
      console.error('🇪🇸 [ESPAÑA] Error al entrar:', error);
      setError('Error al entrar. Intenta de nuevo.');
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
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        {/* Modal */}
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
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#667eea',
          marginBottom: '10px'
        }}>
          Chat Gay España
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '30px'
        }}>
          Completa estos datos para empezar a chatear
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Nickname */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Tu Nickname *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej: Carlos23"
              maxLength={20}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #667eea',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#333'
              }}
            />
          </div>

          {/* Edad */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Tu Edad *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ej: 24"
              min="18"
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #667eea',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#333'
              }}
            />
          </div>

          {/* Avatar */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
              Elige tu Avatar *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{
                    position: 'relative',
                    padding: '10px',
                    borderRadius: '10px',
                    border: selectedAvatar.id === avatar.id ? '3px solid #667eea' : '2px solid #ddd',
                    backgroundColor: selectedAvatar.id === avatar.id ? '#f0f0ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {selectedAvatar.id === avatar.id && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      backgroundColor: '#667eea',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                    </div>
                  )}
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>
                    {avatar.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox Reglas */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#333'
            }}>
              <input
                type="checkbox"
                checked={acceptRules}
                onChange={(e) => setAcceptRules(e.target.checked)}
                required
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#667eea'
                }}
              />
              <span>
                Acepto las reglas del chat. Tengo +18 años y entiendo que debo respetar a los demás usuarios.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? '0.7' : '1',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar a Chatear'}
          </button>
        </form>

        <p style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '20px',
          lineHeight: '1.5'
        }}>
          ✨ Sin registro • 100% Gratis • Anónimo
        </p>
      </div>
    </div>
    </>
  );
};

export default SpainLandingPage;
