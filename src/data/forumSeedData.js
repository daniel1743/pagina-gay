/**
 * Datos iniciales del foro - 50 threads realistas con lenguaje natural
 * Incluye errores de ortografía, coloquialismos y lenguaje casual
 */

const categories = ['Apoyo Emocional', 'Recursos', 'Experiencias', 'Preguntas', 'Logros'];

// Respuestas realistas con lenguaje natural, errores y coloquialismos
const replyTemplates = {
  apoyo: [
    "te entiendo perfecto, yo pasé por lo mismo y lo que me sirvió fue hablar con alguien de confianza",
    "no estas solo en esto, muchos hemos sentido esa ansiedad. mi consejo es que te tomes tu tiempo",
    "tranqui, no hay apuro. lo importante es que te sientas comodo con tu decision",
    "mi experiencia fue distinta pero puedo contarte que...",
    "animo! es dificil pero vale la pena. cuando estes listo...",
    "yo tambien tuve miedo al principio. lo que hice fue empezar poco a poco",
    "recuerda que tu bienestar es lo mas importante. si necesitas hablar estoy aqui",
    "pucha, entiendo como te sientes. a mi me ayudo mucho...",
    "no te presiones, cada uno tiene su tiempo. yo tarde como 2 años en aceptarme",
    "es normal sentirse asi, no eres el unico. muchos pasamos por eso",
    "te mando un abrazo virtual <3",
    "si necesitas hablar, aqui estamos para apoyarte",
  ],
  recursos: [
    "conozco un lugar en providencia que es bueno, te paso el dato si quieres",
    "yo fui a un psicologo en las condes y me fue bien, si quieres te paso el contacto",
    "hay un grupo en facebook que se llama [nombre], ahi comparten recursos",
    "en el cesfam de mi comuna tienen atencion, los horarios son...",
    "te recomiendo buscar en google, ahi encontre info util",
    "hay una fundacion en santiago que ofrece servicios gratis",
    "no se si te sirva pero yo fui a...",
    "busca en instagram, hay varios perfiles que comparten recursos",
    "en mi u hay un centro de apoyo lgbt, quizas en la tuya tambien",
    "pregunta en el consultorio, a veces tienen psicologos",
  ],
  experiencias: [
    "que lindo que compartas esto! me alegra saber que...",
    "tu experiencia me da esperanza. gracias por compartirla",
    "pase por algo similar y es reconfortante saber que no estoy solo",
    "me encanto leer tu historia. me identifico mucho",
    "gracias por ser tan abierto. esto ayuda a muchos",
    "que bueno que te haya ido bien!",
    "me emociono leer tu experiencia",
    "ojala yo tambien pueda vivir algo asi",
    "felicidades! me alegra mucho por ti",
    "que genial, gracias por compartir",
  ],
  preguntas: [
    "buena pregunta. en mi caso, lo que hice fue...",
    "depende de cada uno, pero yo te recomendaria...",
    "no estoy seguro, pero creo que...",
    "alguien mas puede saber mas, pero desde mi experiencia...",
    "esa es una duda comun. lo que yo se es que...",
    "no se mucho del tema pero...",
    "yo creo que...",
    "a mi me funciono...",
    "no tengo idea pero espero que alguien mas te pueda ayudar",
    "pucha, no se que decirte pero espero que encuentres la respuesta",
  ],
  logros: [
    "felicidades! ese es un gran logro. me alegra mucho",
    "que increible! gracias por compartir tu alegria",
    "eres un ejemplo para muchos. sigue asi!",
    "me emocione leyendo tu logro. felicidades!",
    "eso es motivo de celebracion. disfruta este momento!",
    "que genial! me alegra mucho por ti",
    "felicidades! te lo mereces",
    "que bueno! me da mucha alegria leer esto",
    "increible! sigue asi",
    "que lindo! felicidades de corazon",
  ],
};

// Función para agregar errores naturales y coloquialismos
const makeNatural = (text) => {
  // A veces agregar errores comunes
  if (Math.random() < 0.3) {
    text = text.replace(/que/g, 'qe');
    text = text.replace(/porque/g, 'por que');
    text = text.replace(/también/g, 'tambien');
    text = text.replace(/más/g, 'mas');
  }
  
  // A veces agregar diminutivos
  if (Math.random() < 0.4) {
    text = text.replace(/amigo/g, 'amiguito');
    text = text.replace(/tiempo/g, 'tiempito');
    text = text.replace(/ayuda/g, 'ayudita');
  }
  
  // A veces agregar expresiones coloquiales
  if (Math.random() < 0.3) {
    const coloquialisms = ['pucha', 'oye', 'weon', 'hermano', 'amigo'];
    const random = coloquialisms[Math.floor(Math.random() * coloquialisms.length)];
    if (Math.random() < 0.5) {
      text = `${random}, ${text}`;
    }
  }
  
  // A veces no capitalizar la primera letra
  if (Math.random() < 0.4) {
    text = text.charAt(0).toLowerCase() + text.slice(1);
  }
  
  return text;
};

// Generar respuestas naturales para un thread
const generateReplies = (category, count) => {
  const templates = replyTemplates[category.toLowerCase().replace(' ', '')] || replyTemplates.apoyo;
  const replies = [];
  
  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const naturalText = makeNatural(template);
    const anonId = Math.floor(Math.random() * 10000);
    replies.push({
      id: `reply_${i}_${Date.now()}`,
      content: naturalText,
      authorId: `anon_${anonId}`,
      authorDisplay: `Usuario Anónimo #${anonId}`,
      likes: Math.floor(Math.random() * 15), // 0-15 likes más variados
      timestamp: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
    });
  }
  
  return replies;
};

// Generar 50 threads realistas con lenguaje natural
export const generateForumSeedData = () => {
  const threads = [];

  // Apoyo Emocional (12 threads)
  const apoyoThreads = [
    { title: 'como manejar el estres del coming out?', content: 'estoy pensando en salir del closet con mi familia pero me siento muy ansioso. alguien tiene consejos? no se como prepararme emocionalmente' },
    { title: 'ansiedad social en espacios lgbt+', content: 'me da mucha ansiedad ir a eventos o lugares lgbt+. como puedo superar esto? siempre me siento fuera de lugar' },
    { title: 'sentirse solo siendo gay', content: 'a veces me siento muy solo, especialmente cuando veo parejas heterosexuales. alguien mas se siente asi? es normal?' },
    { title: 'como lidiar con comentarios homofobicos', content: 'en mi trabajo escucho comentarios homofobicos y no se como reaccionar. que hago? me da rabia pero no quiero problemas' },
    { title: 'depresion y ser gay', content: 'he estado luchando con depresion y siento que ser gay hace todo mas dificil. hay alguien que haya pasado por esto?' },
    { title: 'miedo al rechazo familiar', content: 'tengo miedo de que mi familia me rechace si les digo que soy gay. como puedo prepararme? algun consejo?' },
    { title: 'autoaceptacion', content: 'todavia tengo problemas para aceptarme a mi mismo. como puedo trabajar en esto? me cuesta mucho' },
    { title: 'relaciones toxicas en la comunidad', content: 'he tenido malas experiencias en relaciones con otros hombres. como puedo evitar esto? siempre termino mal' },
    { title: 'presion social y estereotipos', content: 'siento mucha presion por no encajar en los estereotipos gay. alguien mas se siente asi? no soy tan "femenino" como esperan' },
    { title: 'como superar el bullying', content: 'sufri bullying en el colegio por ser gay y todavia me afecta. como puedo sanar? a veces tengo pesadillas' },
    { title: 'dificultades para hacer amigos gays', content: 'me cuesta mucho hacer amigos en la comunidad. donde puedo conocer gente? no se donde empezar' },
    { title: 'problemas de autoestima', content: 'mi autoestima esta por los suelos. alguien tiene consejos para mejorarla? me siento horrible' },
  ];

  // Recursos (10 threads)
  const recursosThreads = [
    { title: 'recursos de salud mental lgbt+ en santiago', content: 'alguien conoce psicologos o terapeutas que trabajen con temas lgbt+ en santiago? necesito ayuda pero no se donde buscar' },
    { title: 'grupos de apoyo en valparaiso', content: 'busco grupos de apoyo lgbt+ en valparaiso. donde puedo encontrarlos? alguien sabe?' },
    { title: 'clinicas amigables con lgbt+', content: 'conocen clinicas o centros de salud que sean amigables con la comunidad lgbt+? tengo miedo de ir y que me discriminen' },
    { title: 'recursos para jovenes lgbt+', content: 'soy menor de 25 y busco recursos especificos para jovenes. donde puedo encontrar ayuda? no tengo plata para pagar' },
    { title: 'centros de testeo vih gratuitos', content: 'donde puedo hacerme un test de vih de forma gratuita y confidencial? tengo miedo pero quiero saber' },
    { title: 'organizaciones lgbt+ en chile', content: 'que organizaciones lgbt+ existen en chile y que servicios ofrecen? quiero participar pero no se donde' },
    { title: 'recursos para personas trans', content: 'busco recursos especificos para personas trans. donde puedo encontrar informacion? necesito ayuda' },
    { title: 'grupos de apoyo para parejas', content: 'existen grupos de apoyo para parejas del mismo sexo? mi pareja y yo estamos pasando por un momento dificil' },
    { title: 'servicios de salud sexual', content: 'donde puedo acceder a servicios de salud sexual amigables con lgbt+? tengo dudas y necesito ayuda' },
    { title: 'recursos online en español', content: 'conocen recursos online en español para la comunidad lgbt+? prefiero leer en español' },
  ];

  // Experiencias (10 threads)
  const experienciasThreads = [
    { title: 'mi experiencia saliendo del closet', content: 'queria compartir mi experiencia positiva saliendo del closet con mi familia. fue dificil pero valio la pena. si alguien necesita apoyo, aqui estoy' },
    { title: 'mi primera relacion seria', content: 'acabo de tener mi primera relacion seria y queria compartir lo feliz que me siento. nunca pense que podria ser tan feliz' },
    { title: 'encontre mi tribu', content: 'finalmente encontre un grupo de amigos donde me siento completamente aceptado. es increible, nunca habia sentido eso antes' },
    { title: 'mi experiencia en terapia', content: 'empece terapia hace 6 meses y ha cambiado mi vida. queria compartir mi experiencia por si alguien esta pensando en ir' },
    { title: 'mi primer pride', content: 'fui a mi primer marcha del orgullo y fue una experiencia increible. alguien mas fue? fue emocionante ver tanta gente' },
    { title: 'supere mi ansiedad social', content: 'despues de años de lucha, finalmente supere mi ansiedad social. queria compartir como lo hice por si le sirve a alguien' },
    { title: 'mi experiencia siendo abierto en el trabajo', content: 'decidi ser abierto sobre mi orientacion en el trabajo y la experiencia fue mejor de lo esperado. mis compañeros me apoyaron' },
    { title: 'encontre el amor', content: 'despues de mucho tiempo, finalmente encontre a alguien especial. queria compartir mi felicidad con ustedes' },
    { title: 'mi viaje de autoaceptacion', content: 'ha sido un largo viaje pero finalmente me acepto completamente. queria compartir mi historia' },
    { title: 'supere el bullying', content: 'sufri mucho bullying pero finalmente lo supere. queria compartir mi historia para dar esperanza a otros' },
  ];

  // Preguntas (10 threads)
  const preguntasThreads = [
    { title: 'como conocer gente fuera de apps?', content: 'estoy cansado de las apps. como puedo conocer gente de forma mas natural? no me gusta el ambiente de las apps' },
    { title: 'es normal sentirse asi?', content: 'tengo muchas dudas sobre si lo que siento es normal. alguien puede ayudarme? me siento confundido' },
    { title: 'como saber si alguien es gay?', content: 'hay alguien que me gusta pero no se si es gay. como puedo saberlo? no quiero hacer el ridiculo' },
    { title: 'que hacer en una primera cita?', content: 'tengo mi primera cita con un chico y estoy muy nervioso. que deberia hacer? no quiero cagarla' },
    { title: 'como manejar el rechazo?', content: 'me rechazaron y me siento muy mal. como puedo superarlo? duele mucho' },
    { title: 'es seguro salir del closet?', content: 'quiero salir del closet pero tengo miedo. es seguro hacerlo? no se si mi familia me va a aceptar' },
    { title: 'como hacer amigos gays?', content: 'me cuesta mucho hacer amigos en la comunidad. donde puedo conocer gente? no se donde empezar' },
    { title: 'que significa ser versatil?', content: 'he escuchado el termino pero no estoy seguro de que significa exactamente. alguien me puede explicar?' },
    { title: 'como lidiar con la presion social?', content: 'siento mucha presion social por ser gay. como puedo lidiar con esto? a veces es agobiante' },
    { title: 'es normal tener dudas?', content: 'todavia tengo dudas sobre mi orientacion. es normal? a veces no estoy seguro' },
  ];

  // Logros (8 threads)
  const logrosThreads = [
    { title: 'finalmente sali del closet!', content: 'despues de mucho tiempo, finalmente sali del closet con mi familia y todo salio bien. estoy muy feliz! queria compartirlo con ustedes' },
    { title: 'encontre el amor', content: 'despues de mucho buscar, finalmente encontre a alguien especial. estoy muy feliz! nunca pense que pasaria' },
    { title: 'supere mi ansiedad', content: 'despues de años de lucha, finalmente supere mi ansiedad. estoy muy orgulloso de mi mismo! fue dificil pero lo logre' },
    { title: 'me acepte completamente', content: 'finalmente me acepto completamente como soy. es un gran logro para mi. queria compartirlo' },
    { title: 'encontre mi tribu', content: 'finalmente encontre un grupo de amigos donde me siento completamente aceptado. es increible! nunca habia sentido eso' },
    { title: 'supere el bullying', content: 'sufri mucho bullying pero finalmente lo supere. estoy muy orgulloso! queria compartirlo para dar esperanza' },
    { title: 'me gradue siendo abierto', content: 'me gradue de la universidad siendo completamente abierto sobre mi orientacion. estoy muy feliz! fue un gran paso' },
    { title: 'encontre mi pasion', content: 'encontre mi pasion en el activismo lgbt+ y estoy muy feliz con mi vida ahora. queria compartirlo' },
  ];

  // Combinar todos los threads (50 total)
  const allThreads = [
    ...apoyoThreads.map(t => ({ ...t, category: 'Apoyo Emocional' })),
    ...recursosThreads.map(t => ({ ...t, category: 'Recursos' })),
    ...experienciasThreads.map(t => ({ ...t, category: 'Experiencias' })),
    ...preguntasThreads.map(t => ({ ...t, category: 'Preguntas' })),
    ...logrosThreads.map(t => ({ ...t, category: 'Logros' })),
  ];

  // Generar datos completos con respuestas y votos variados
  allThreads.forEach((thread, index) => {
    const anonId = Math.floor(Math.random() * 10000);
    // Respuestas más variadas: 2-12 respuestas
    const repliesCount = Math.floor(Math.random() * 11) + 2;
    // Likes más variados: 0-30 (algunos threads pueden tener pocos likes)
    const likesCount = Math.floor(Math.random() * 31);
    
    // Determinar categoría para respuestas
    const categoryKey = thread.category.toLowerCase().replace(' ', '');
    
    threads.push({
      id: `thread_${index + 1}`,
      title: makeNatural(thread.title), // Aplicar lenguaje natural al título
      content: makeNatural(thread.content), // Aplicar lenguaje natural al contenido
      category: thread.category,
      authorId: `anon_${anonId}`,
      authorDisplay: `Usuario Anónimo #${anonId}`,
      replies: repliesCount,
      likes: likesCount,
      views: Math.floor(Math.random() * 150) + 20, // 20-170 vistas
      timestamp: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      repliesData: generateReplies(categoryKey, repliesCount), // Respuestas generadas
    });
  });

  return threads;
};

// Exportar datos generados
export const forumSeedData = generateForumSeedData();
