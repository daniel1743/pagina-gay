/**
 * 🔵 SERVICIO DE CHAT CON SUPABASE
 * 
 * Servicio para manejar mensajes usando Supabase
 * Equivalente a chatService.js pero con Supabase
 */

import { supabase } from '@/config/supabase';

/**
 * Enviar mensaje a una sala
 */
export const sendMessage = async (roomId, messageData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const message = {
      room_id: roomId,
      user_id: user?.id || null,
      username: messageData.username,
      content: messageData.content,
      type: messageData.type || 'text',
      timestamp: new Date().toISOString(),
      _unauthenticated: !user,
      sender_uid: user?.id || null,
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }

    return { message: data, error: null };
  } catch (error) {
    return { message: null, error };
  }
};

/**
 * Suscribirse a mensajes de una sala en tiempo real
 */
export const subscribeToRoomMessages = (roomId, callback) => {
  // Primero obtener mensajes iniciales
  supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('timestamp', { ascending: false })
    .limit(50)
    .then(({ data, error }) => {
      if (error) {
        console.error('Error obteniendo mensajes iniciales:', error);
        return;
      }

      // Convertir a formato compatible con Firebase
      const messages = data.map(msg => ({
        id: msg.id,
        ...msg,
        timestampMs: new Date(msg.timestamp).getTime(),
      })).reverse();

      callback(messages);
    });

  // Suscribirse a cambios en tiempo real
  const channel = supabase
    .channel(`room:${roomId}:messages`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const newMessage = {
        id: payload.new.id,
        ...payload.new,
        timestampMs: new Date(payload.new.timestamp).getTime(),
      };
      callback([newMessage], true); // true indica que es un nuevo mensaje
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${roomId}`,
    }, (payload) => {
      const updatedMessage = {
        id: payload.new.id,
        ...payload.new,
        timestampMs: new Date(payload.new.timestamp).getTime(),
      };
      callback([updatedMessage], false, true); // true indica que es una actualización
    })
    .subscribe();

  // Retornar función para desuscribirse
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Obtener mensajes de una sala (sin suscripción)
 */
export const getRoomMessages = async (roomId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error obteniendo mensajes:', error);
      throw error;
    }

    // Convertir a formato compatible
    const messages = data.map(msg => ({
      id: msg.id,
      ...msg,
      timestampMs: new Date(msg.timestamp).getTime(),
    })).reverse();

    return { messages, error: null };
  } catch (error) {
    return { messages: [], error };
  }
};

/**
 * Eliminar mensaje
 */
export const deleteMessage = async (messageId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id); // Solo el dueño puede eliminar

    if (error) {
      console.error('Error eliminando mensaje:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Actualizar mensaje
 */
export const updateMessage = async (messageId, updates) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .eq('user_id', user.id) // Solo el dueño puede actualizar
      .select()
      .single();

    if (error) {
      console.error('Error actualizando mensaje:', error);
      throw error;
    }

    return { message: data, error: null };
  } catch (error) {
    return { message: null, error };
  }
};

export default {
  sendMessage,
  subscribeToRoomMessages,
  getRoomMessages,
  deleteMessage,
  updateMessage,
};


