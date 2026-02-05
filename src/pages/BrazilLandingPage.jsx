import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import { Check } from 'lucide-react';
import TelegramBanner from '@/components/ui/TelegramBanner';

// 4 avatares predefinidos
const AVATAR_OPTIONS = [
  {
    id: 'avataaars',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
    name: 'Clássico'
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

const BrazilLandingPage = () => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = React.useState('');
  const [age, setAge] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState(AVATAR_OPTIONS[0]);
  const [acceptRules, setAcceptRules] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  useCanonical('https://chactivo.com/modal-br');

  React.useEffect(() => {
    document.documentElement.lang = 'pt-BR';
    document.title = 'Chat Gay Brasil 🏳️‍🌈 Grátis - São Paulo, Rio, BH | Chactivo';

    const metaDescription = document.querySelector('meta[name="description"]');
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }
    ensuredMeta.content = 'Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio de Janeiro, Belo Horizonte, Brasília e todo Brasil. Sem enrolação, mano. Entre já!';

    const ogTags = [
      { property: 'og:title', content: 'Chat Gay Brasil 🏳️‍🌈 Grátis - São Paulo, Rio | Chactivo' },
      { property: 'og:description', content: 'Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio, BH e todo Brasil. Sem enrolação, mano.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://chactivo.com/modal-br' },
      { property: 'og:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { property: 'og:locale', content: 'pt_BR' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Chat Gay Brasil 🏳️‍🌈 Grátis' },
      { name: 'twitter:description', content: 'Conhece caras de São Paulo, Rio, BH. 100% grátis e anônimo.' },
      { name: 'twitter:image', content: 'https://chactivo.com/LOGO_CHACTIVO.png' },
      { name: 'keywords', content: 'chat gay brasil, chat gay são paulo, chat gay rio, chat gay bh, chat lgbt brasil, gays brasil, chat gay sp, conhecer gays brasil' }
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
      "name": "Chat Gay Brasil - Chactivo",
      "description": "Chat gay Brasil 100% grátis. Conhece caras de São Paulo, Rio de Janeiro, Belo Horizonte e todo Brasil.",
      "url": "https://chactivo.com/modal-br",
      "applicationCategory": "SocialNetworkingApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Brasil"
      },
      "inLanguage": "pt-BR"
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

    // Validar nickname
    if (!nickname.trim()) {
      setError('Digite seu apelido');
      return;
    }
    if (nickname.trim().length < 3) {
      setError('O apelido deve ter pelo menos 3 caracteres');
      return;
    }

    // Validar idade
    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge)) {
      setError('Digite sua idade em números');
      return;
    }
    if (parsedAge < 18) {
      setError('Você deve ter mais de 18 anos');
      return;
    }

    // Validar regras
    if (!acceptRules) {
      setError('Você deve aceitar as regras do chat');
      return;
    }

    console.log('🇧🇷 [BRASIL] Tentando entrar com:', { nickname: nickname.trim(), age: parsedAge, avatar: selectedAvatar.url });
    setIsLoading(true);

    try {
      sessionStorage.setItem(`age_verified_${nickname.trim()}`, 'true');
      sessionStorage.setItem(`rules_accepted_${nickname.trim()}`, 'true');

      await signInAsGuest(nickname.trim(), selectedAvatar.url);
      console.log('🇧🇷 [BRASIL] Autenticação bem-sucedida, navegando para /chat/principal');

      navigate('/chat/principal', { replace: true });
    } catch (error) {
      console.error('🇧🇷 [BRASIL] Erro ao entrar:', error);
      setError('Erro ao entrar. Tente novamente.');
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
      {/* ⚠️ TELEGRAM BANNER ELIMINADO */}
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        paddingTop: '50px',
        boxSizing: 'border-box'
      }}>
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
          color: '#11998e',
          marginBottom: '10px'
        }}>
          Chat Gay Brasil
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '30px'
        }}>
          Complete estes dados para começar a conversar
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Seu Apelido *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: João23"
              maxLength={20}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #11998e',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#333'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Sua Idade *
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ex: 24"
              min="18"
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #11998e',
                borderRadius: '10px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#333'
              }}
            />
              </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
              Escolha seu Avatar *
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
                    border: selectedAvatar.id === avatar.id ? '3px solid #11998e' : '2px solid #ddd',
                    backgroundColor: selectedAvatar.id === avatar.id ? '#e8fff8' : 'white',
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
                      backgroundColor: '#11998e',
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
                  accentColor: '#11998e'
                }}
              />
              <span>
                Aceito as regras do chat. Tenho +18 anos e entendo que devo respeitar os outros usuários.
              </span>
            </label>
          </div>

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

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? '0.7' : '1',
              boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)'
            }}
          >
            {isLoading ? 'Entrando...' : 'Entrar no Chat'}
          </button>
        </form>

        <p style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '20px',
          lineHeight: '1.5'
        }}>
          ✨ Sem registro • 100% Grátis • Anônimo
        </p>

        {/* 🚀 SECCIÓN SEO - Contenido optimizado para Google Brasil */}
        <div style={{
          marginTop: '40px',
          textAlign: 'left',
          lineHeight: '1.7',
          borderTop: '1px solid #e0e0e0',
          paddingTop: '30px'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#11998e',
            marginBottom: '15px',
            lineHeight: '1.3'
          }}>
            O Maior Chat Gay do Brasil
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#555',
            marginBottom: '20px',
            lineHeight: '1.7'
          }}>
            Chactivo é a <strong>maior comunidade LGBT+ do Brasil</strong>, conectando milhares de caras gays, bissexuais e trans de todo o país. De São Paulo ao Rio, Belo Horizonte, Brasília e centenas de cidades. <strong>100% grátis, sem cadastro obrigatório</strong>, e completamente anônimo. Sem enrolação, mano.
          </p>

          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#38ef7d',
            marginBottom: '12px',
            marginTop: '25px'
          }}>
            Por que o Chactivo é o melhor chat gay do Brasil?
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#555',
            marginBottom: '20px',
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li><strong>Milhares de usuários ativos</strong> todos os dias em todos os estados</li>
            <li><strong>Totalmente grátis</strong> - Não pedimos cartão nem pagamentos ocultos</li>
            <li><strong>Anônimo e seguro</strong> - Sua privacidade é nossa prioridade</li>
            <li><strong>Sem downloads</strong> - Funciona direto no seu navegador</li>
            <li><strong>Comunidade respeitosa</strong> - Moderação ativa 24/7</li>
          </ul>

          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#38ef7d',
            marginBottom: '12px'
          }}>
            Cidades com mais atividade no Chactivo Brasil
          </h3>
          <p style={{
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.9',
            marginBottom: '20px'
          }}>
            <strong>São Paulo</strong> • <strong>Rio de Janeiro</strong> • <strong>Belo Horizonte</strong> • <strong>Brasília</strong> • <strong>Curitiba</strong> • <strong>Salvador</strong> • Fortaleza • Porto Alegre • Recife • Manaus • Goiânia • Belém • Guarulhos • Campinas • São Luís • São Gonçalo • Maceió • Duque de Caxias • Natal • Teresina • Campo Grande • Nova Iguaçu • João Pessoa • Santo André • Osasco • São Bernardo • Jaboatão • Ribeirão Preto • Uberlândia • Sorocaba • Contagem • Aracaju • Feira de Santana • Juiz de Fora • Londrina • Aparecida • Joinville • Niterói • Ananindeua • Florianópolis • Santos
          </p>

          <p style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '25px',
            fontStyle: 'italic',
            lineHeight: '1.6'
          }}>
            Chactivo é uma plataforma inclusiva para a comunidade LGBT+ do Brasil. Respeitamos a diversidade e promovemos um espaço seguro para que gays, lésbicas, bissexuais e pessoas trans possam se conhecer, conversar e criar amizades. Todos os usuários devem ter mais de 18 anos.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default BrazilLandingPage;
