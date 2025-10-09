import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Crown, Palette, Type, Smile, Music, MessageCircle, Star, Sparkles, Send, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

const colorPalettes = [
  { name: 'Default', colors: '--background: 260 19% 19%; --foreground: 0 0% 100%; --accent: 323 100% 45%;' },
  { name: 'Ocean', colors: '--background: 210 40% 15%; --foreground: 0 0% 100%; --accent: 180 100% 40%;' },
  { name: 'Forest', colors: '--background: 120 25% 15%; --foreground: 0 0% 100%; --accent: 90 60% 50%;' },
  { name: 'Sunset', colors: '--background: 25 30% 18%; --foreground: 0 0% 100%; --accent: 30 100% 50%;' },
];

const fonts = [
  { name: 'Nunito Sans', value: "'Nunito Sans', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
];

const avatars = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/big-ears/svg?seed=Leo',
  'https://api.dicebear.com/7x/fun-emoji/svg?seed=Nina',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Rob',
];

const PremiumFeature = ({ icon, title, children }) => (
    <div className="bg-[#2C2A4A]/60 p-4 rounded-lg">
        <h4 className="font-bold text-white flex items-center gap-2 mb-3"><div className="text-cyan-400">{icon}</div>{title}</h4>
        {children}
    </div>
);


const AjustesModal = ({ isOpen, onClose }) => {
    const { user, updateThemeSetting, updateProfile, addQuickPhrase, removeQuickPhrase } = useAuth();
    const navigate = useNavigate();
    const [newPhrase, setNewPhrase] = useState('');

    const handleGoPremium = () => {
        onClose();
        navigate('/premium');
    };

    const handleAddPhrase = (e) => {
        e.preventDefault();
        if (newPhrase.trim()) {
            addQuickPhrase(newPhrase.trim());
            setNewPhrase('');
            toast({ title: "Frase rápida añadida", description: "Ahora puedes usarla en el chat." });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-3xl rounded-2xl p-0">
                <DialogHeader className="p-6">
                    <DialogTitle className="text-3xl font-extrabold flex items-center gap-2">
                        <Crown className="text-yellow-400" />
                        Tienda y Ajustes Premium
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                        Personaliza tu experiencia en Chactivo al máximo.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-6">
                    {!user || !user.isPremium ? (
                        <div className="text-center p-8 bg-[#2C2A4A]/50 rounded-xl">
                            <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2 text-white">Desbloquea la Personalización Total</h3>
                            <p className="text-gray-300 mb-6">
                                Estas opciones son exclusivas para miembros Premium. ¡Actualiza tu cuenta para disfrutar de una experiencia única!
                            </p>
                            <Button onClick={handleGoPremium} className="gold-gradient text-purple-950 font-bold text-lg">
                                Hazte Premium Ahora
                            </Button>
                        </div>
                    ) : (
                        <Tabs defaultValue="apariencia" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-[#2C2A4A]">
                                <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
                                <TabsTrigger value="chat">Chat</TabsTrigger>
                                <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
                            </TabsList>
                            <TabsContent value="apariencia" className="mt-6 space-y-4">
                                <PremiumFeature icon={<Palette size={24} />} title="Paletas de Colores">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {colorPalettes.map(p => <Button key={p.name} variant="outline" onClick={() => updateThemeSetting('colors', p.colors)}>{p.name}</Button>)}
                                    </div>
                                </PremiumFeature>
                                <PremiumFeature icon={<Type size={24} />} title="Fuentes de Texto">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {fonts.map(f => <Button key={f.name} variant="outline" onClick={() => updateThemeSetting('font', f.value)}>{f.name}</Button>)}
                                    </div>
                                </PremiumFeature>
                                 <PremiumFeature icon={<Star size={24} />} title="Anillos de Avatar">
                                    <div className="text-gray-300">¡Tu anillo de avatar ya está activo por ser Premium!</div>
                                </PremiumFeature>
                            </TabsContent>
                            <TabsContent value="chat" className="mt-6 space-y-4">
                               <PremiumFeature icon={<MessageCircle size={24} />} title="Estilos de Burbuja y Sonidos">
                                    <div className="text-gray-300">Próximamente podrás elegir entre 10 diseños y sonidos únicos.</div>
                                </PremiumFeature>
                               <PremiumFeature icon={<Smile size={24} />} title="Set de Emojis Premium">
                                    <div className="text-gray-300">¡Ya tienes acceso a emojis exclusivos en el selector de emojis del chat!</div>
                                </PremiumFeature>
                                 <PremiumFeature icon={<MessageCircle size={24} />} title="Frases Rápidas">
                                    <form onSubmit={handleAddPhrase} className="flex gap-2 mb-3">
                                        <Input value={newPhrase} onChange={e => setNewPhrase(e.target.value)} placeholder="Añadir nueva frase..."/>
                                        <Button type="submit" size="icon" className="magenta-gradient"><Send size={18}/></Button>
                                    </form>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {(user.quickPhrases || []).map((phrase, i) => (
                                            <div key={i} className="flex justify-between items-center bg-secondary p-2 rounded">
                                                <p className="text-sm">{phrase}</p>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeQuickPhrase(phrase)}><Trash2 size={16} className="text-red-400"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                </PremiumFeature>
                            </TabsContent>
                            <TabsContent value="cuenta" className="mt-6 space-y-4">
                                <PremiumFeature icon={<Sparkles size={24} />} title="Biblioteca de Avatares">
                                    <div className="grid grid-cols-4 gap-4">
                                        {avatars.map(av => <Avatar key={av} className="w-16 h-16 cursor-pointer hover:ring-2 ring-cyan-400" onClick={() => updateProfile({ avatar: av })}><AvatarImage src={av} /></Avatar>)}
                                    </div>
                                </PremiumFeature>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>

                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default AjustesModal;