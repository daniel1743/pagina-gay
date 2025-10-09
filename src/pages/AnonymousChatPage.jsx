
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Home, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const AnonymousChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [anonymousUser, setAnonymousUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Assign a persistent anonymous identity for the session
    const anonymousId = sessionStorage.getItem('anonymousId');
    if (anonymousId) {
      setAnonymousUser(JSON.parse(anonymousId));
    } else {
      const newAnonymousId = `Anónimo-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAnonymousUser = { id: Date.now(), username: newAnonymousId };
      setAnonymousUser(newAnonymousUser);
      sessionStorage.setItem('anonymousId', JSON.stringify(newAnonymousUser));
    }
  }, []);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('chactivo_anonymous_chat') || '[]');
    const welcomeMessage = {
      id: 'welcome_anon',
      userId: 'system',
      username: 'Moderador',
      content: '🔒 Bienvenido/a a la Sala de Apoyo Confidencial. Este es un espacio seguro protegido: solo usuarios registrados pueden escribir para garantizar la privacidad y seguridad de todos. Puedes leer libremente, pero necesitas registrarte para participar. Recuerda ser respetuoso y empático.',
      timestamp: new Date().toISOString(),
    };
    setMessages(storedMessages.length > 0 ? storedMessages : [welcomeMessage]);
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();

    // IMPORTANTE: Solo usuarios autenticados pueden escribir (no anónimos de Firebase)
    if (user && user.isAnonymous) {
      alert('⚠️ Por privacidad y seguridad, debes registrarte para escribir en la Sala de Apoyo.\n\n' +
            'Esta sala es un espacio confidencial donde solo usuarios verificados pueden participar.');
      return;
    }

    if (!user || user.isGuest) {
      alert('⚠️ Debes iniciar sesión para escribir en la Sala de Apoyo.');
      navigate('/');
      return;
    }

    if (newMessage.trim() === '') return;

    const message = {
      id: Date.now(),
      userId: user.id,
      username: user.username,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem('chactivo_anonymous_chat', JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  if (!anonymousUser) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Sala de Apoyo Anónima - Chactivo</title>
        <meta name="description" content="Un espacio seguro y anónimo para hablar." />
      </Helmet>
      <div className="h-screen flex flex-col bg-[#2C2A4A] text-white">
        <header className="bg-[#22203a] border-b border-[#413e62] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h2 className="font-bold text-gray-100 text-lg">Sala de Apoyo Anónima</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-cyan-400"
          >
            <Home className="w-5 h-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, index) => {
            const isOwn = msg.userId === anonymousUser.id;
            const isSystem = msg.userId === 'system';
            
            if (isSystem) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center text-sm text-gray-400 bg-[#22203a] px-4 py-2 rounded-full mx-auto max-w-md"
                >
                  {msg.content}
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar className="w-10 h-10 cursor-default">
                  <AvatarFallback className={`bg-gray-600 border-2 ${isOwn ? 'border-cyan-400' : 'border-gray-500'}`}>
                    <Shield className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <span className={`text-xs font-semibold ${isOwn ? 'text-cyan-400' : 'text-gray-300'}`}>
                    {msg.username}
                  </span>
                  <div className={`chat-bubble ${isOwn ? 'cyan-gradient text-black' : 'bg-[#413e62]'}`}>
                    <p>{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
           <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="bg-[#22203a] border-t border-[#413e62] p-4 shrink-0">
          <div className="flex items-center gap-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={user && !user.isAnonymous && !user.isGuest ? "Escribe tu mensaje..." : "🔒 Regístrate para escribir en esta sala protegida"}
              disabled={!user || user.isAnonymous || user.isGuest}
              className="flex-1 bg-[#2C2A4A] border-2 border-[#413e62] rounded-lg px-4 py-2 text-white placeholder:text-gray-400 focus:border-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="cyan-gradient text-black font-bold"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AnonymousChatPage;