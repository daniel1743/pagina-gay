/**
 * Datos iniciales del foro - 100 threads realistas
 * Cada thread tiene respuestas y votos para hacer el foro más activo
 */

const categories = ['Apoyo Emocional', 'Recursos', 'Experiencias', 'Preguntas', 'Logros'];

// Respuestas realistas para diferentes tipos de threads
const replyTemplates = {
  apoyo: [
    "Te entiendo perfectamente. Yo pasé por algo similar y lo que me ayudó fue...",
    "No estás solo en esto. Muchos hemos sentido esa ansiedad. Mi consejo es que...",
    "Tómate tu tiempo, no hay prisa. Lo importante es que te sientas cómodo.",
    "Mi experiencia fue diferente pero puedo compartirte que...",
    "¡Ánimo! Es un proceso difícil pero vale la pena. Cuando estés listo...",
    "Yo también tuve miedo al principio. Lo que hice fue...",
    "Recuerda que tu bienestar es lo más importante. Si necesitas hablar...",
  ],
  recursos: [
    "Conozco un lugar en [zona] que es muy bueno. Te paso el contacto...",
    "Yo fui a [lugar] y la experiencia fue excelente. Te recomiendo...",
    "Hay un grupo en Facebook que se llama [nombre], ahí comparten recursos.",
    "En [institución] tienen atención especializada. Los horarios son...",
    "Te recomiendo buscar en [sitio web], ahí encontré información útil.",
    "Hay una fundación en [ciudad] que ofrece servicios gratuitos.",
  ],
  experiencias: [
    "¡Qué lindo que compartas esto! Me alegra saber que...",
    "Tu experiencia me da esperanza. Gracias por compartirla.",
    "Pasé por algo similar y es reconfortante saber que no estoy solo.",
    "Me encantó leer tu historia. Me identifico mucho con...",
    "Gracias por ser tan abierto. Esto ayuda a muchos de nosotros.",
    "Tu experiencia me inspira a...",
  ],
  preguntas: [
    "Buena pregunta. En mi caso, lo que hice fue...",
    "Depende de cada persona, pero yo te recomendaría...",
    "No estoy seguro, pero creo que...",
    "Alguien más puede tener mejor información, pero desde mi experiencia...",
    "Esa es una duda común. Lo que yo sé es que...",
  ],
  logros: [
    "¡Felicidades! Ese es un gran logro. Me alegra mucho por ti.",
    "¡Qué increíble! Gracias por compartir tu alegría con nosotros.",
    "Eres un ejemplo para muchos. ¡Sigue así!",
    "Me emocioné leyendo tu logro. ¡Felicidades!",
    "Eso es motivo de celebración. ¡Disfruta este momento!",
  ],
};

// Generar respuestas aleatorias para un thread
const generateReplies = (category, count) => {
  const templates = replyTemplates[category.toLowerCase().replace(' ', '')] || replyTemplates.apoyo;
  const replies = [];
  
  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const anonId = Math.floor(Math.random() * 10000);
    replies.push({
      id: `reply_${i}_${Date.now()}`,
      content: template,
      authorId: `anon_${anonId}`,
      authorDisplay: `Usuario Anónimo #${anonId}`,
      likes: Math.floor(Math.random() * 10),
      timestamp: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
    });
  }
  
  return replies;
};

// Generar 100 threads realistas
export const generateForumSeedData = () => {
  const threads = [];

  // Apoyo Emocional (25 threads)
  const apoyoThreads = [
    { title: '¿Cómo manejar el estrés del coming out?', content: 'Estoy pensando en salir del clóset con mi familia pero me siento muy ansioso. ¿Alguien tiene consejos sobre cómo prepararme emocionalmente?' },
    { title: 'Ansiedad social en espacios LGBT+', content: 'Me da mucha ansiedad ir a eventos o lugares LGBT+. ¿Cómo puedo superar esto?' },
    { title: 'Sentirse solo siendo gay', content: 'A veces me siento muy solo, especialmente cuando veo a parejas heterosexuales. ¿Alguien más se siente así?' },
    { title: 'Cómo lidiar con comentarios homofóbicos', content: 'En mi trabajo escucho comentarios homofóbicos y no sé cómo reaccionar. ¿Qué hago?' },
    { title: 'Depresión y ser gay', content: 'He estado luchando con depresión y siento que ser gay hace todo más difícil. ¿Hay alguien que haya pasado por esto?' },
    { title: 'Miedo al rechazo familiar', content: 'Tengo miedo de que mi familia me rechace si les digo que soy gay. ¿Cómo puedo prepararme?' },
    { title: 'Autoaceptación', content: 'Todavía tengo problemas para aceptarme a mí mismo. ¿Cómo puedo trabajar en esto?' },
    { title: 'Relaciones tóxicas en la comunidad', content: 'He tenido malas experiencias en relaciones con otros hombres. ¿Cómo puedo evitar esto?' },
    { title: 'Presión social y estereotipos', content: 'Siento mucha presión por no encajar en los estereotipos gay. ¿Alguien más se siente así?' },
    { title: 'Cómo superar el bullying', content: 'Sufrí bullying en el colegio por ser gay y todavía me afecta. ¿Cómo puedo sanar?' },
    { title: 'Dificultades para hacer amigos gays', content: 'Me cuesta mucho hacer amigos en la comunidad. ¿Dónde puedo conocer gente?' },
    { title: 'Estrés por discriminación laboral', content: 'Tengo miedo de ser discriminado en mi trabajo por ser gay. ¿Qué puedo hacer?' },
    { title: 'Cómo manejar el rechazo en apps', content: 'Me siento muy mal cuando me rechazan en apps de citas. ¿Cómo puedo lidiar con esto?' },
    { title: 'Problemas de autoestima', content: 'Mi autoestima está por los suelos. ¿Alguien tiene consejos para mejorarla?' },
    { title: 'Sentirse invisible en la comunidad', content: 'A veces siento que no encajo en ningún lado de la comunidad gay. ¿Alguien más?' },
    { title: 'Cómo hablar con mis padres', content: 'Quiero hablar con mis padres sobre mi orientación pero no sé cómo empezar.' },
    { title: 'Ansiedad por salir del clóset', content: 'Tengo mucha ansiedad pensando en salir del clóset. ¿Cómo puedo calmarme?' },
    { title: 'Sentirse diferente', content: 'Siempre me he sentido diferente a los demás. ¿Es normal sentirse así?' },
    { title: 'Cómo lidiar con la soledad', content: 'Me siento muy solo, especialmente los fines de semana. ¿Qué puedo hacer?' },
    { title: 'Problemas de confianza', content: 'He tenido malas experiencias y ahora me cuesta confiar en la gente. ¿Cómo puedo trabajar en esto?' },
    { title: 'Cómo manejar el estrés diario', content: 'El estrés del día a día me está afectando mucho. ¿Alguien tiene técnicas que funcionen?' },
    { title: 'Sentirse juzgado', content: 'Siento que todo el mundo me juzga por ser gay. ¿Cómo puedo dejar de pensar así?' },
    { title: 'Problemas para dormir', content: 'Tengo problemas para dormir por la ansiedad. ¿Alguien tiene consejos?' },
    { title: 'Cómo encontrar apoyo', content: 'Necesito encontrar apoyo emocional pero no sé dónde buscar. ¿Alguien puede ayudarme?' },
    { title: 'Superar traumas pasados', content: 'He tenido experiencias traumáticas relacionadas con ser gay. ¿Cómo puedo superarlas?' },
  ];

  // Recursos (20 threads)
  const recursosThreads = [
    { title: 'Recursos de salud mental LGBT+ en Santiago', content: '¿Alguien conoce psicólogos o terapeutas que trabajen con temas LGBT+ en Santiago?' },
    { title: 'Grupos de apoyo en Valparaíso', content: 'Busco grupos de apoyo LGBT+ en Valparaíso. ¿Dónde puedo encontrarlos?' },
    { title: 'Clínicas amigables con LGBT+', content: '¿Conocen clínicas o centros de salud que sean amigables con la comunidad LGBT+?' },
    { title: 'Recursos para jóvenes LGBT+', content: 'Soy menor de 25 y busco recursos específicos para jóvenes. ¿Dónde puedo encontrar ayuda?' },
    { title: 'Abogados especializados en derechos LGBT+', content: 'Necesito un abogado que entienda temas LGBT+. ¿Alguien tiene recomendaciones?' },
    { title: 'Centros de testeo VIH gratuitos', content: '¿Dónde puedo hacerme un test de VIH de forma gratuita y confidencial?' },
    { title: 'Organizaciones LGBT+ en Chile', content: '¿Qué organizaciones LGBT+ existen en Chile y qué servicios ofrecen?' },
    { title: 'Recursos para personas trans', content: 'Busco recursos específicos para personas trans. ¿Dónde puedo encontrar información?' },
    { title: 'Grupos de apoyo para parejas', content: '¿Existen grupos de apoyo para parejas del mismo sexo?' },
    { title: 'Recursos educativos LGBT+', content: '¿Dónde puedo encontrar material educativo sobre temas LGBT+?' },
    { title: 'Centros comunitarios LGBT+', content: '¿Hay centros comunitarios LGBT+ donde pueda participar?' },
    { title: 'Recursos para padres de hijos LGBT+', content: 'Soy padre de un hijo gay y busco recursos para entenderlo mejor.' },
    { title: 'Servicios de salud sexual', content: '¿Dónde puedo acceder a servicios de salud sexual amigables con LGBT+?' },
    { title: 'Recursos para adultos mayores LGBT+', content: 'Busco recursos específicos para adultos mayores de la comunidad.' },
    { title: 'Organizaciones de apoyo emocional', content: '¿Qué organizaciones ofrecen apoyo emocional gratuito?' },
    { title: 'Recursos para estudiantes LGBT+', content: 'Soy estudiante y busco recursos en mi universidad. ¿Dónde puedo buscar?' },
    { title: 'Centros de crisis LGBT+', content: '¿Existen líneas de crisis o centros de emergencia para la comunidad?' },
    { title: 'Recursos para inmigrantes LGBT+', content: 'Soy inmigrante y busco recursos específicos para la comunidad LGBT+.' },
    { title: 'Bibliotecas con material LGBT+', content: '¿Dónde puedo encontrar libros y material sobre temas LGBT+?' },
    { title: 'Recursos online en español', content: '¿Conocen recursos online en español para la comunidad LGBT+?' },
  ];

  // Experiencias (20 threads)
  const experienciasThreads = [
    { title: 'Mi experiencia saliendo del clóset', content: 'Quería compartir mi experiencia positiva saliendo del clóset con mi familia. Fue difícil pero valió la pena.' },
    { title: 'Mi primera relación seria', content: 'Acabo de tener mi primera relación seria y quería compartir lo feliz que me siento.' },
    { title: 'Encontré mi tribu', content: 'Finalmente encontré un grupo de amigos donde me siento completamente aceptado. Es increíble.' },
    { title: 'Mi experiencia en terapia', content: 'Empecé terapia hace 6 meses y ha cambiado mi vida. Quería compartir mi experiencia.' },
    { title: 'Mi primer Pride', content: 'Fui a mi primer Marcha del Orgullo y fue una experiencia increíble. ¿Alguien más fue?' },
    { title: 'Superé mi ansiedad social', content: 'Después de años de lucha, finalmente superé mi ansiedad social. Quería compartir cómo lo hice.' },
    { title: 'Mi experiencia siendo abierto en el trabajo', content: 'Decidí ser abierto sobre mi orientación en el trabajo y la experiencia fue mejor de lo esperado.' },
    { title: 'Encontré el amor', content: 'Después de mucho tiempo, finalmente encontré a alguien especial. Quería compartir mi felicidad.' },
    { title: 'Mi viaje de autoaceptación', content: 'Ha sido un largo viaje pero finalmente me acepto completamente. Quería compartir mi historia.' },
    { title: 'Mi experiencia como voluntario', content: 'Empecé a ser voluntario en una organización LGBT+ y ha sido una experiencia increíble.' },
    { title: 'Superé el bullying', content: 'Sufrí mucho bullying pero finalmente lo superé. Quería compartir mi historia para dar esperanza.' },
    { title: 'Mi experiencia con apps de citas', content: 'Tuve una experiencia positiva en apps de citas y quería compartirla.' },
    { title: 'Encontré mi pasión', content: 'Encontré mi pasión en el activismo LGBT+ y quería compartir cómo cambió mi vida.' },
    { title: 'Mi experiencia siendo mentor', content: 'Empecé a ser mentor de jóvenes LGBT+ y es una experiencia muy gratificante.' },
    { title: 'Superé mi depresión', content: 'Luché con depresión durante años pero finalmente la superé. Quería compartir mi historia.' },
    { title: 'Mi experiencia en grupos de apoyo', content: 'Unirme a un grupo de apoyo cambió mi vida. Quería compartir mi experiencia.' },
    { title: 'Encontré mi voz', content: 'Finalmente encontré mi voz y puedo defender mis derechos. Es liberador.' },
    { title: 'Mi experiencia siendo visible', content: 'Decidí ser más visible en la comunidad y ha sido una experiencia positiva.' },
    { title: 'Superé mis miedos', content: 'Superé muchos miedos relacionados con ser gay. Quería compartir cómo lo hice.' },
    { title: 'Mi experiencia ayudando a otros', content: 'Empecé a ayudar a otros en la comunidad y es muy gratificante.' },
  ];

  // Preguntas (20 threads)
  const preguntasThreads = [
    { title: '¿Cómo conocer gente fuera de apps?', content: 'Estoy cansado de las apps. ¿Cómo puedo conocer gente de forma más natural?' },
    { title: '¿Es normal sentirse así?', content: 'Tengo muchas dudas sobre si lo que siento es normal. ¿Alguien puede ayudarme?' },
    { title: '¿Cómo saber si alguien es gay?', content: 'Hay alguien que me gusta pero no sé si es gay. ¿Cómo puedo saberlo?' },
    { title: '¿Qué hacer en una primera cita?', content: 'Tengo mi primera cita con un chico y estoy muy nervioso. ¿Qué debería hacer?' },
    { title: '¿Cómo manejar el rechazo?', content: 'Me rechazaron y me siento muy mal. ¿Cómo puedo superarlo?' },
    { title: '¿Es seguro salir del clóset?', content: 'Quiero salir del clóset pero tengo miedo. ¿Es seguro hacerlo?' },
    { title: '¿Cómo hacer amigos gays?', content: 'Me cuesta mucho hacer amigos en la comunidad. ¿Dónde puedo conocer gente?' },
    { title: '¿Qué significa ser versátil?', content: 'He escuchado el término pero no estoy seguro de qué significa exactamente.' },
    { title: '¿Cómo lidiar con la presión social?', content: 'Siento mucha presión social por ser gay. ¿Cómo puedo lidiar con esto?' },
    { title: '¿Es normal tener dudas?', content: 'Todavía tengo dudas sobre mi orientación. ¿Es normal?' },
    { title: '¿Cómo saber si estoy listo para una relación?', content: 'Quiero tener una relación pero no sé si estoy listo. ¿Cómo puedo saberlo?' },
    { title: '¿Qué hacer si mi familia no acepta?', content: 'Mi familia no acepta que soy gay. ¿Qué puedo hacer?' },
    { title: '¿Cómo manejar comentarios ofensivos?', content: 'Escucho comentarios ofensivos y no sé cómo reaccionar. ¿Qué hago?' },
    { title: '¿Es seguro usar apps de citas?', content: 'Quiero usar apps de citas pero tengo miedo. ¿Es seguro?' },
    { title: '¿Cómo encontrar pareja?', content: 'He estado buscando pareja pero no encuentro a nadie. ¿Qué puedo hacer?' },
    { title: '¿Qué significa ser activo/pasivo?', content: 'He escuchado estos términos pero no entiendo bien qué significan.' },
    { title: '¿Cómo manejar la ansiedad?', content: 'Tengo mucha ansiedad relacionada con ser gay. ¿Cómo puedo manejarla?' },
    { title: '¿Es normal sentirse solo?', content: 'Me siento muy solo siendo gay. ¿Es normal sentirse así?' },
    { title: '¿Cómo saber si alguien me gusta?', content: 'Hay alguien que me llama la atención pero no sé si me gusta. ¿Cómo puedo saberlo?' },
    { title: '¿Qué hacer si me discriminan?', content: 'Fui discriminado y no sé qué hacer. ¿Alguien puede ayudarme?' },
  ];

  // Logros (15 threads)
  const logrosThreads = [
    { title: '¡Finalmente salí del clóset!', content: 'Después de mucho tiempo, finalmente salí del clóset con mi familia y todo salió bien. ¡Estoy muy feliz!' },
    { title: 'Encontré el amor', content: 'Después de mucho buscar, finalmente encontré a alguien especial. ¡Estoy muy feliz!' },
    { title: 'Superé mi ansiedad', content: 'Después de años de lucha, finalmente superé mi ansiedad. ¡Estoy muy orgulloso de mí mismo!' },
    { title: 'Me acepté completamente', content: 'Finalmente me acepto completamente como soy. Es un gran logro para mí.' },
    { title: 'Encontré mi tribu', content: 'Finalmente encontré un grupo de amigos donde me siento completamente aceptado. ¡Es increíble!' },
    { title: 'Superé el bullying', content: 'Sufrí mucho bullying pero finalmente lo superé. ¡Estoy muy orgulloso!' },
    { title: 'Me gradué siendo abierto', content: 'Me gradué de la universidad siendo completamente abierto sobre mi orientación. ¡Estoy muy feliz!' },
    { title: 'Encontré mi pasión', content: 'Encontré mi pasión en el activismo LGBT+ y estoy muy feliz con mi vida ahora.' },
    { title: 'Superé mi depresión', content: 'Luché con depresión durante años pero finalmente la superé. ¡Estoy muy orgulloso!' },
    { title: 'Me casé', content: 'Finalmente me casé con el amor de mi vida. ¡Estoy muy feliz!' },
    { title: 'Encontré trabajo siendo abierto', content: 'Encontré un trabajo donde puedo ser completamente abierto. ¡Es increíble!' },
    { title: 'Ayudé a otros', content: 'Empecé a ayudar a otros en la comunidad y es muy gratificante. ¡Estoy muy feliz!' },
    { title: 'Superé mis miedos', content: 'Superé muchos miedos relacionados con ser gay. ¡Estoy muy orgulloso de mí mismo!' },
    { title: 'Encontré mi voz', content: 'Finalmente encontré mi voz y puedo defender mis derechos. ¡Es liberador!' },
    { title: 'Me convertí en mentor', content: 'Me convertí en mentor de jóvenes LGBT+ y es una experiencia increíble.' },
  ];

  // Combinar todos los threads
  const allThreads = [
    ...apoyoThreads.map(t => ({ ...t, category: 'Apoyo Emocional' })),
    ...recursosThreads.map(t => ({ ...t, category: 'Recursos' })),
    ...experienciasThreads.map(t => ({ ...t, category: 'Experiencias' })),
    ...preguntasThreads.map(t => ({ ...t, category: 'Preguntas' })),
    ...logrosThreads.map(t => ({ ...t, category: 'Logros' })),
  ];

  // Generar datos completos con respuestas y votos
  allThreads.forEach((thread, index) => {
    const anonId = Math.floor(Math.random() * 10000);
    const repliesCount = Math.floor(Math.random() * 15) + 3; // 3-18 respuestas
    const likesCount = Math.floor(Math.random() * 50) + 5; // 5-55 votos
    
    // Determinar categoría para respuestas
    const categoryKey = thread.category.toLowerCase().replace(' ', '');
    
    threads.push({
      id: `thread_${index + 1}`,
      title: thread.title,
      content: thread.content,
      category: thread.category,
      authorId: `anon_${anonId}`,
      authorDisplay: `Usuario Anónimo #${anonId}`,
      replies: repliesCount,
      likes: likesCount,
      views: Math.floor(Math.random() * 200) + 50, // 50-250 vistas
      timestamp: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      repliesData: generateReplies(categoryKey, repliesCount), // Respuestas generadas
    });
  });

  return threads;
};

// Exportar datos generados
export const forumSeedData = generateForumSeedData();

