import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const TestModalPage = () => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    console.log('🧪 [TEST MODAL] Componente montado en:', window.location.pathname);
    document.title = 'Test Modal - Chat';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    console.log('🧪 [TEST MODAL] Intentando entrar con nickname:', nickname.trim());
    setIsLoading(true);
    try {
      await signInAsGuest(nickname.trim());
      console.log('🧪 [TEST MODAL] Autenticación exitosa, navegando a /chat/principal');
      navigate('/chat/principal');
    } catch (error) {
      console.error('🧪 [TEST MODAL] Error al entrar:', error);
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      {/* Modal Simple */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#667eea',
          marginBottom: '10px'
        }}>
          🧪 Test Modal
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '30px'
        }}>
          Ingresa tu nombre para chatear
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Tu nickname (Ej: Test123)"
            maxLength={20}
            required
            autoFocus
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              border: '2px solid #667eea',
              borderRadius: '10px',
              marginBottom: '20px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={!nickname.trim() || isLoading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: nickname.trim() && !isLoading ? 'pointer' : 'not-allowed',
              opacity: nickname.trim() && !isLoading ? '1' : '0.5',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar a Chatear'}
          </button>
        </form>

        <p style={{
          fontSize: '12px',
          color: '#999',
          marginTop: '20px'
        }}>
          ✨ Sin registro • 100% Gratis • Anónimo
        </p>

        <p style={{
          fontSize: '10px',
          color: '#bbb',
          marginTop: '10px'
        }}>
          Ruta: {window.location.pathname}
        </p>
      </div>
    </div>
  );
};

export default TestModalPage;

