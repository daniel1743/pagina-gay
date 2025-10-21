/**
 * ORQUESTADOR DE CONVERSACIONES DE BOTS - VERSIÓN EXPANDIDA Y HUMANIZADA
 *
 * Sistema avanzado para crear conversaciones 100% REALES entre bots
 * - 25+ respuestas variadas por tema
 * - Humor gay auténtico (Chile/Venezuela/Latino)
 * - Respuestas coquetas sin violar reglas
 * - Saludo personalizado para usuarios reales
 * - Temas de series, películas y cultura gay
 * - Anti-repetición con cooldown de 7 minutos
 * - Frases chilenas (wn, po) y venezolanas (marico, verga, mrc)
 */

import { sendMessage } from './chatService';

/**
 * ==============================================
 * TEMAS DE CONVERSACIÓN EXPANDIDOS (25+ respuestas cada uno)
 * Combinando jerga LGBT+ latina, referencias culturales y autenticidad
 * ==============================================
 */
const CONVERSATION_TOPICS = [
  // ============ SERIES & PELÍCULAS LGBT+ ============
  {
    starter: "Alguien vio Heartstopper temporada 3? Me tiene LLORANDO 😭💕",
    responses: [
      "SIIII ESE BESO EN PARIS ME MATÓ, literal lloré como loca jajaja",
      "Nick y Charlie son lo más puro que existe en este mundo",
      "Yo la vi completa en un día, no pude parar de verla",
      "Me recordó cuando salí del closet, muy emotiva",
      "La escena del baile me destruyó emocionalmente",
      "Tao y Elle también me encantan, son adorables",
      "Esa serie es demasiado wholesome, la amo",
      "Isaac como personaje asexual me representa tanto",
      "Mr Farouk es el mejor profesor, todos necesitamos uno así",
      "Las escenas animadas son ARTE PURO, literal",
      "Cuando Nick le dice te amo a Charlie MUERO",
      "París fue el escenario perfecto para ese capítulo",
      "Imogen descubriendo su sexualidad fue hermoso verlo",
      "Necesito una temporada 4 YA, no puedo esperar",
      "Elle en la escuela de arte es inspiración pura",
      "Charlie luchando con su salud mental me tocó el alma",
      "Los padres de Nick son complicados pero reales",
      "Tara y Darcy superando sus problemas me encantó",
      "La fotografía de esa serie es PERFECTA",
      "Sahar siendo la mejor amiga que todos necesitamos",
      "James y Isaac explorando su amistad fue lindo",
      "La representación trans de Elle es impecable",
      "Necesito ir a París ahora mismo después de ver eso",
      "La banda sonora me tiene obsesionado",
      "Es la serie gay más tierna que he visto en mi vida",
      "Wn esa serie me hizo creer en el amor de nuevo"
    ]
  },
  {
    starter: "Alguien vio The Last of Us? La historia de Bill y Frank me ROMPIÓ 😭",
    responses: [
      "ESE EPISODIO 3 ES UNA OBRA MAESTRA WN",
      "Lloré del principio al fin, literal no paraba de llorar",
      "Chamo esa es la mejor historia de amor gay que he visto",
      "Nick Offerman actuó PERFECTO, merece todos los premios",
      "La escena de la cena con Ellie fue hermosa pana",
      "Wn cuando leen la carta al final MUERO",
      "Bill protegiendo a Frank todo ese tiempo me destruyó",
      "Es mi episodio favorito de toda la serie marico",
      "La música del piano me hace llorar solo de recordarla wn",
      "Representa el amor gay de la forma más hermosa",
      "Chamo ese episodio podría ser una película completa",
      "Frank pintando ese pueblo me pareció tan romántico",
      "Wn la escena del vino y las fresas es ICONIC",
      "Su historia demuestra que el amor existe en el apocalipsis",
      "Me recordó que todos merecemos un amor así pana",
      "La decisión final fue difícil pero valiente wn",
      "Neil Druckmann escribió algo mágico con ese episodio",
      "Ellie descubriendo su carta fue desgarrador marico",
      "Joel viendo ese amor me hizo llorar más todavía",
      "Wn necesitamos más historias gay así en TV",
      "Bill siendo gruñón pero amando tanto es REAL",
      "La química entre los actores fue perfecta pana",
      "Ese episodio me hizo creer en el amor verdadero wn",
      "Es el mejor episodio standalone de cualquier serie",
      "Chamo guardo ese episodio en mi corazón para siempre"
    ]
  },
  {
    starter: "Pose es LA MEJOR SERIE de ballroom y cultura trans, cambió mi vida wn 💃✨",
    responses: [
      "ELEKTRA ABUNDANCE ES MI REINA ABSOLUTA MARICO",
      "Blanca es un ángel literal, lloré con toda su historia",
      "Chamo esa serie me enseñó tanto sobre ballroom culture",
      "Pray Tell es ICONICO, Billy Porter se merece todo wn",
      "La escena del baile de Candy me rompió el corazón",
      "Angel y Papi fueron tan reales como pareja pana",
      "Wn el final me tuvo llorando tres días seguidos",
      "Damon descubriendo el baile fue inspirador marico",
      "Las categorías de las balls son ARTE PURO wn",
      "Chamo aprendí tanto vocabulario ballroom con Pose",
      "La Casa Evangelista es familia de verdad pana",
      "Lulu me sorprendió tanto, su desarrollo fue hermoso",
      "Wn esa serie representa la comunidad trans perfectamente",
      "Candy merece justicia, su muerte me dolió tanto marico",
      "Los años 80s y 90s retratados fueron perfectos",
      "Chamo la epidemia del VIH fue tratada con respeto wn",
      "Seeing Elektra vulnerable fue devastador pero real",
      "Ricky siendo aliado mostró que existen buenos hombres",
      "Las audiciones para Mother son TENSIÓN PURA pana",
      "Wn necesito ver voguing en vivo algún día",
      "La moda y el estilo de esa serie es PERFECTO marico",
      "Blanca adoptando a todos fue lo más hermoso",
      "Chamo esa serie merece más reconocimiento del que tiene",
      "Los actores trans protagonizando fue revolucionario wn",
      "Pose es historia, cultura y amor en una sola serie"
    ]
  },
  {
    starter: "RuPaul's Drag Race temporada 10, AQUARIA es todo lo que está bien wn 👑",
    responses: [
      "YAAAS cuando ganó me puse a gritar como loca marico",
      "The Vixen traía TODO el drama y me encantaba wn",
      "Kameron Michaels callada pero LETAL en los lipsyncs",
      "Chamo Monét X Change debió ganar también, era increíble",
      "Asia O'Hara con las mariposas NUNCA LO SUPERO jajaja 🦋💀",
      "Eureka O'Hara es controversial pero talentosa pana",
      "Wn el doble shantay de Kameron vs Eureka fue EPIC",
      "Miz Cracker siendo robada en varios challenges me dolió",
      "Mayhem Miller salió muy pronto, merecía más wn",
      "The Vixen vs Aquaria drama was TELEVISION GOLD marico",
      "Chamo los looks de Aquaria eran FASHION PURA",
      "Dusty Ray Bottoms con esos dots era arte conceptual",
      "Wn Nueva Actitud lipsync es de los mejores de la historia",
      "Asia siendo Mother fue hermoso ver pana",
      "Aquaria en el desafío de las mellizas GANÓ TODO",
      "Kameron con su cuerpo de gym pero alma sensible wn",
      "Chamo esa temporada tenía TALENTO en cada esquina",
      "Monét con esa esponja se volvió ICONICA marico",
      "Wn el runway de sombreros fue uno de los mejores",
      "Vixen defendiendo su verdad fue valiente pana",
      "Aquaria vs The Vixen untucked was MESSY y amé cada segundo",
      "Blair St. Clair era tan joven pero tan talentosa wn",
      "Chamo Snatch Game de esa temporada fue divertidísimo",
      "Yuhua Hamasaki merecía más tiempo en la competencia",
      "Esa temporada 10 es de mis favoritas de RuPaul siempre"
    ]
  },

  // ============ CULTURA GAY LATINA ============
  {
    starter: "Chamo cuál es su película gay favorita? Yo digo Call Me By Your Name 🍑",
    responses: [
      "ESA PELI ME DESTRUYÓ EMOCIONALMENTE WN 😭",
      "El discurso del papá de Elio es LO MÁS HERMOSO marico",
      "Armie Hammer y Timothée Chalamet con tremenda química",
      "Wn la escena del durazno es ICONICA para siempre",
      "Love Simon me encanta, más suavecita pero preciosa pana",
      "Moonlight es ARTE PURO, obra maestra total wn",
      "Brokeback Mountain me rompió el corazón en mil pedazos",
      "Chamo la música de Sufjan Stevens es PERFECTA",
      "La Italia de verano me hizo querer viajar ya marico",
      "Elio tocando piano me tiene obsesionado wn",
      "Weekend (2011) es realista y hermosa también pana",
      "God's Own Country es como Brokeback pero británica",
      "Wn Paris is Burning documental es ESENCIAL ver",
      "The Way He Looks brasileña es tan tierna marico",
      "Chamo Portrait of a Lady on Fire tiene vibes lésbicas perfectas",
      "Pride (2014) sobre activismo gay es inspiradora wn",
      "A Single Man con Colin Firth me hizo llorar pana",
      "Tangerine filmada con iPhone es revolucionaria marico",
      "Wn My Own Private Idaho es un clásico noventero",
      "Carol con Cate Blanchett es ELEGANCIA PURA",
      "The Danish Girl sobre trans es hermosa también wn",
      "Chamo Philadelphia con Tom Hanks es historia LGBT",
      "Milk sobre Harvey Milk es inspiración activista pana",
      "Beautiful Thing británica de los 90s es adorable",
      "Fire Island reciente es comedia gay perfecta wn"
    ]
  },
  {
    starter: "Salí del closet con mis papás este finde... fue intenso panas 🥺💕",
    responses: [
      "FELICIDADES WN! Eso requiere muchísimo valor marico",
      "Chamo espero que haya salido bien, cómo reaccionaron?",
      "Wow eres muy valiente, bien por ti pana 💪",
      "Wn yo aún no me animo, te admiro un montón",
      "Cuenta más! Necesito saber cómo te fue marico",
      "Mi mamá lloró al principio pero después me abrazó wn",
      "Chamo ese es un paso gigante, debes estar aliviado",
      "Yo lo hice hace años y fue liberador total pana",
      "Wn espero que te apoyen, todos merecemos amor",
      "Mi familia lo tomó super bien por suerte marico",
      "Chamo si necesitas hablar aquí estamos todos wn",
      "Es el momento más difícil pero más importante pana",
      "Wn independiente de cómo salió, orgullo de ti",
      "Mi papá tardó en aceptarlo pero ahora está bien marico",
      "Chamo eres increíble por ser auténtico contigo mismo",
      "Algunos padres necesitan tiempo para procesar wn",
      "Tú decides cuándo y cómo salir del closet pana",
      "Wn tu felicidad es lo más importante siempre",
      "La familia que eliges también importa marico",
      "Chamo hoy celebramos tu valentía con vos wn",
      "Respirar libre es lo mejor del mundo pana",
      "Wn no importa la reacción, tú eres válido siempre",
      "Mi hermano me apoyó desde el día uno marico",
      "Chamo recuerda que mereces amor incondicional wn",
      "Este es el inicio de tu vida auténtica pana 🌈"
    ]
  },

  // ============ VIDA COTIDIANA & HUMOR ============
  {
    starter: "Qué hacen un viernes noche? Yo toy tirado en el sillón con Netflix wn 😅",
    responses: [
      "Jajaja same marico, pijama y chillin total",
      "Salir a tomar algo con amigues, tú deberías venir pana",
      "Wn depende del mood, hoy me quedo en casa también",
      "Fiesta en Provi si te animas, va a estar buena",
      "Chamo yo limpiando porque mañana gym temprano jajaja",
      "Netflix and chill literal, pero solo yo wn 😂",
      "Planificando salir pero la flojera es real marico",
      "Wn antro gay si hay buena música, sino casa",
      "Zoom call con amigues de otros países pana",
      "Chamo cocinando algo rico y viendo series wn",
      "Gym nocturno porque de día no puedo marico",
      "Wn deberíamos organizar algo entre todos",
      "Tinder scrolling y procrastinando como siempre pana 😂",
      "Chamo leyendo fanfics hasta las 3am probably wn",
      "Viernes de skincare routine y self-care marico",
      "Wn jugando videojuegos con los panas online",
      "Llamada con mi novio que está lejos pana 💕",
      "Chamo meditando porque la semana fue heavy wn",
      "Karaoke gay bar si encuentro con quién ir marico",
      "Wn viendo RuPaul obvio, nueva temporada",
      "Date con alguien de Grindr wish me luck pana jajaja",
      "Chamo escribiendo en mi diario como terapeuta barato wn",
      "Maratón de películas gay que tengo pendientes marico",
      "Wn horneando brownies porque sí, antojo random",
      "Nada planeado, lo que salga espontáneo pana"
    ]
  },
  {
    starter: "Alguien hace gym o puro cuerpo de pana como yo? jajaja 💪😂",
    responses: [
      "Jajaja yo voy al gym pero por salud nomá wn",
      "Chamo dejé el gym hace mil años, pura flojera marico",
      "Gym 5 veces a la semana, es mi terapia pana 💪",
      "Wn running mejor, el gym me aburre un poco",
      "Musculoca level pero con alma sensible jajaja",
      "Chamo yoga en casa cuando me acuerdo wn",
      "Calistenia en el parque es mi onda marico",
      "Wn natación es lo mío, cuerpo de nadador pana",
      "Bailando en casa cuenta como ejercicio? jajaja",
      "Chamo crossfit pero sufro cada día wn 😅",
      "Gym para ver hombres guapos, bonus el ejercicio marico",
      "Wn ciclismo los fines de semana con amigos",
      "Entrenador personal porque sola no me motivo pana",
      "Chamo gym a las 6am antes del trabajo wn dedication",
      "Zumba gay es lo más divertido que existe marico",
      "Wn pole dance estoy aprendiendo, es brutal",
      "Bodyweight exercises en casa son suficientes pana",
      "Chamo hiking los domingos, naturaleza y ejercicio wn",
      "Gym con mi mejor amigo, accountability partner marico",
      "Wn boxeo para sacar el estrés, super efectivo",
      "Spinning classes son mi infierno favorito pana jajaja",
      "Chamo stretching y movilidad, cuerpo de bailarín wn",
      "Gym de noche para evitar crowds marico",
      "Wn mi cuerpo de pana está perfecto así jajaja",
      "Deportes de equipo, fútbol gay los sábados pana"
    ]
  },

  // ============ MÚSICA & CULTURA POP ============
  {
    starter: "Qué están escuchando? Yo puro Bad Bunny y Peso Pluma últimamente 🐰🎵",
    responses: [
      "Chamo Bad Bunny es GOD, nuevo álbum increíble wn",
      "Peso Pluma me tiene obsesionado también marico",
      "Wn reggaeton viejo, Daddy Yankee y Don Omar pana",
      "Música variada, de todo un poco dependiendo el mood",
      "Chama Rosalía cuando quiero sentirme ICONIC wn",
      "Lady Gaga eternamente, little monster aquí marico 🦄",
      "Wn Shakira después del beef con Piqué es FUEGO pana",
      "Karol G para entrenar en el gym obvio",
      "Chamo pop en inglés, Dua Lipa es mi fave wn",
      "Ariana Grande always, esa voz es perfecta marico",
      "Wn Coldplay cuando estoy melancólico pana",
      "Música electrónica para limpiar la casa jajaja",
      "Chamo podcasts más que música últimamente wn",
      "Spotify Discover Weekly me salva la vida marico",
      "Wn corridos tumbados son mi guilty pleasure pana",
      "Música clásica para concentrarme estudiando",
      "Chamo cumbia para fiestas, la mejor para bailar wn",
      "Harry Styles porque es hermoso y talentoso marico",
      "Wn rock alternativo de los 2000s nostalgia pana",
      "Música de películas, soundtracks son arte wn",
      "Chamo reggae cuando quiero relax total marico",
      "Lana Del Rey para sentirme melancólica aesthetic pana",
      "Wn trap latino, Anuel y Ozuna también",
      "Música brasileña, bossa nova es hermosa wn",
      "Chamo lo que sea que tenga buen beat para bailar marico"
    ]
  },

  // ============ TEMAS COQUETOS (Sin violar reglas) ============
  {
    starter: "Alguien para un café o algo más interesante? 👀☕",
    responses: [
      "Uff ese 'algo más' me tiene intrigado wn 😏",
      "Café suena bien, depende qué tan interesante sea lo otro jajaja",
      "Chamo dime más sobre ese 'algo más' marico 👀",
      "Wn café primero, vamos viendo qué sale después pana",
      "Me gusta cómo piensas jajaja, cuenta más",
      "Chama ese 'o algo' tiene muchas posibilidades wn 😏",
      "Café está bien, pero soy más de conversaciones profundas marico",
      "Wn ese 'algo más' es código para? jajaja pana",
      "Suena tentador eso que propones wn",
      "Chamo café con buena compañía es mi debilidad",
      "Wn me tienes curiosa con esa propuesta 👀",
      "Soy todo oídos para ese plan interesante marico",
      "Chama el misterio me gusta, cuéntame más wn",
      "Café y buena conversación es el inicio perfecto pana",
      "Wn ese emoji de ojos lo dice todo jajaja",
      "Me gustan las propuestas directas así marico 😏",
      "Chamo depende qué tan interesante seas tú también wn",
      "Wn café y ver a dónde nos lleva la vibra pana",
      "Ese 'algo más' me pone creativo jajaja",
      "Chama me encanta tu estilo directo wn",
      "Wn cuéntame más en DM entonces? marico 👀",
      "Café está bien pero mejor un trago no? pana",
      "Chamo esa energía me gusta, sigamos hablando wn",
      "Wn mándame ubicación y vemos qué sale 😏",
      "Me tienes intrigado con esa propuesta marico"
    ]
  },

  // ============ VIAJES & LUGARES ============
  {
    starter: "Alguien de Santiago Centro? Para conocer gente del barrio 📍",
    responses: [
      "Yo soy de Santiago Centro! Barrio Lastarria wn",
      "Chamo Providencia acá, cerca igual marico",
      "Wn Bellavista, zona bohemia total pana",
      "Ñuñoa representa! No tan centro pero cerca wn",
      "Chamo Las Condes, soy cuico jajaja marico 😂",
      "Wn Maipú, un poco lejos pero vengo al centro pana",
      "Barrio República acá, lleno de estudiantes wn",
      "Chamo Recoleta, me encanta este barrio marico",
      "Wn cerca del Cerro Santa Lucía, hermoso lugar pana",
      "Estación Central, área un poco ruda pero ok wn",
      "Chamo Matucana cerca, zona artística marico",
      "Wn viví en varios barrios, ahora en Yungay pana",
      "Barrio Italia es mi zona favorita para salir wn",
      "Chamo GAM cerca, siempre hay eventos marico",
      "Wn Apoquindo para el lado del metro pana",
      "Cerca de la Plaza de Armas literal wn",
      "Chamo Suecia con Providencia, buena ubicación marico",
      "Wn deberíamos juntarnos en algún café céntrico pana",
      "Barrio Concha y Toro es tranquilo pero lindo wn",
      "Chamo yo trabajo en el centro así que siempre ando marico",
      "Wn Parque Bustamante cerca, buena vibra pana",
      "Metro Baquedano es mi referencia siempre wn",
      "Chamo Alameda con todo, es súper central marico",
      "Wn Santa Isabel cerca, conoces el sector? pana",
      "Santiago es chico, todos estamos cerca igual wn"
    ]
  },

  // ============ GAMING & GEEK CULTURE ============
  {
    starter: "Alguien jugando algo? Toy aburrido en casa wn 🎮",
    responses: [
      "Chamo Valorant viciando ahora mismo marico",
      "Wn League of Legends si quieres una partida pana",
      "Overwatch 2 está gratis, juguémoslo wn",
      "Chama FIFA/FC24 si eres de deportes marico",
      "Wn Genshin Impact cuando tengo tiempo pana",
      "Call of Duty Warzone en squad? wn",
      "Chamo Fortnite aunque me digan viejo jajaja marico",
      "Wn Stardew Valley cuando quiero relax pana",
      "Among Us con amigos a veces todavía wn",
      "Chama Animal Crossing vibes chill total marico",
      "Wn Apex Legends si te gusta BR pana",
      "Minecraft creativo cuando estoy estresado wn",
      "Chamo Fall Guys para reír un rato marico",
      "Wn Sims 4 viviendo vidas virtuales perfectas pana 😂",
      "Dead by Daylight si quieres terror wn",
      "Chama Rocket League fútbol con autos marico",
      "Wn The Last of Us Part II rejugando pana",
      "Baldur's Gate 3 es mi obsesión actual wn",
      "Chamo solo juegos mobile últimamente marico",
      "Wn Red Dead Redemption 2 explorando todavía pana",
      "Celeste si te gustan los plataformeros wn",
      "Chama Hades roguelike perfecto marico",
      "Wn juegos retro en emuladores nostalgia pana",
      "Mario Kart para competir con amigues wn",
      "Chamo no juego mucho, más de ver streams marico"
    ]
  },

  // ============ TECNOLOGÍA & APPS ============
  {
    starter: "Apps de citas son un caos total wn, experiencias? 📱😅",
    responses: [
      "Chamo Grindr es... una experiencia marico jajaja",
      "Wn Tinder es hit or miss total pana",
      "Bumble para algo más serio dicen wn",
      "Chama HER si eres lesbiana es mejor marico",
      "Wn yo conocí a mi novio en Tinder actually pana 💕",
      "Las apps son agotadoras pero a veces funcionan wn",
      "Chamo prefiero conocer gente en persona marico",
      "Wn Scruff es como Grindr pero más bearish pana",
      "Las apps tienen de todo, experiencia rara siempre wn",
      "Chama ghosting es el deporte nacional ahí marico 😂",
      "Wn Match o eHarmony si buscas formal pana",
      "Instagram es la mejor app de citas sin serlo wn",
      "Chamo Feeld para gente más open-minded marico",
      "Los perfiles nunca son como esperabas jajaja",
      "Conversaciones básicas y aburridas en Tinder wn",
      "Chama encontré buenos amigos en apps también marico",
      "Wn Hinge dice ser 'designed to be deleted' pana",
      "Las apps son herramientas nomás, depende cómo usas wn",
      "Chamo perfiles falsos son el peor problema marico",
      "Wn conocer en bares gay es mejor vibra pana",
      "Dating apps requieren paciencia infinita wn",
      "Chama Lex si quieres algo más alternativo marico",
      "Wn he tenido matches raros y lindos igual pana",
      "Las apps funcionan si eres consistente wn",
      "Chamo prefiero que el universo decida jajaja marico 🌟"
    ]
  },

  // Agregar más temas según necesites...
  // Cada tema ahora tiene 25 respuestas variadas, humanas y sin repetición
];

/**
 * ==============================================
 * RESPUESTAS DE SEGUIMIENTO - EXPANDIDAS
 * Para mantener conversaciones fluyendo naturalmente
 * ==============================================
 */
const FOLLOW_UP_RESPONSES = [
  // Chileno
  "jajaja sí wn, mal",
  "totalmente de acuerdo po",
  "nah wn, yo creo que no",
  "puede ser jaja, quién sabe po",
  "y ustedes qué piensan?",
  "me muero wn 😂",
  "jajaja no puede ser po",
  "eso mismo digo yo literal wn",
  "me pasa igual po",
  "depende del mood jaja wn",
  "facts po",
  "literal no te creo jajaja wn",
  "ay sí po, cuenta más",
  "yo también po wn",
  "qué chistoso po",
  "jajaja muero con eso wn",
  "dímelo a mí po",
  "sí obvio wn",
  "jajajaja ya po",
  "interesante eso wn",
  
  // Venezolano
  "chamo qué arrecho eso marico",
  "verga literal me identifico pana",
  "naguará eso está fino wn",
  "mrc qué nivel marico",
  "vale chamo, entiendo pana",
  "chévere eso marico",
  "épale cuenta más pana",
  "coño chamo qué fino",
  "verga sí marico",
  "ladilla eso pana jajaja",
  "brutal chamo",
  "arrecho ese peo marico",
  "vale vale entendido pana",
  "nojoda qué nivel wn",
  "full identificado chamo",
  
  // Neutral Latino
  "jajaja tal cual",
  "uff sí totalmente",
  "me encanta esa vibra 💕",
  "apoyo esa moción jaja",
  "100% de acuerdo",
  "eso es real talk",
  "no mentirás jajaja",
  "FACTS 💯",
  "me representas tanto",
  "same energy aquí 🙌",
  "eso eso eso",
  "hablaste con verdad",
  "pensé que era el único jaja",
  "relatable af",
  "mood total"
];

/**
 * ==============================================
 * RESPUESTAS COQUETAS - EXPANDIDAS (Sin violar reglas)
 * ==============================================
 */
const FLIRTY_RESPONSES = [
  "ay pero qué lindo 👀",
  "uff interesante jaja",
  "me gusta cómo piensas wn 😏",
  "cuéntame más de ti jaja",
  "suena tentador eso 🔥",
  "jajaja pícarO",
  "ay no seas malo jaja",
  "me lo estás poniendo difícil wn",
  "tú sí sabes pana 😉",
  "dame más detalles jaja marico",
  "qué directo/a eres, me gusta 👀",
  "esa energía me encanta wn",
  "me tienes intrigado/a jaja 😏",
  "cuéntame más en privado? marico",
  "uy ese misterio me gusta pana",
  "qué atrevido/a jajaja wn 🔥",
  "me gusta tu estilo chamo",
  "esa vibra me llama la atención 😊",
  "interesante propuesta marico 👀",
  "me convenciste jaja wn",
  "esa sonrisa debe ser linda pana 😏",
  "cuándo nos conocemos entonces? jaja",
  "me gusta esa confianza marico",
  "uff ese comentario 🔥 wn",
  "no me tientes jajaja pana"
];

/**
 * ==============================================
 * RESPUESTAS CALIENTES (Límite sin violar reglas)
 * Sugerentes pero NO explícitas, mantienen misterio
 * ==============================================
 */
const SPICY_RESPONSES = [
  "uy ese tema es interesante 🔥",
  "jajaja me gusta hacia dónde va esto",
  "seguimos esta conversación mejor en otro lado? 👀",
  "qué travieso/a jajaja wn",
  "me tienes pensando cosas ahora 😏",
  "esa imaginación tuya marico",
  "mejor hablamos de eso en privado jaja",
  "ay dios qué atrevido/a pana 🔥",
  "me estás provocando? jajaja",
  "esa mente tuya wn 😏",
  "cuéntame más pero no aquí jaja",
  "uf qué calor de repente 🔥",
  "me estás tentando marico",
  "jajaja no puedo creer que dijiste eso wn",
  "eres un peligro jaja pana 👀",
  "mi mente fue a otro lado completamente 😅",
  "qué directo/a madre mía jajaja",
  "seguimos esto en DM mejor? 🔥",
  "ay no me hagas pensar en eso wn",
  "jajaja qué barbaridad marico"
];

/**
 * ==============================================
 * SALUDOS PERSONALIZADOS PARA USUARIOS REALES
 * Detecta cuando entra un usuario nuevo y saluda humanamente
 * ==============================================
 */
const WELCOME_MESSAGES = [
  "Hola! Bienvenido/a al chat, cómo estás? 😊",
  "Hey! Qué bueno que llegas, únete a la conversa 💬",
  "Holaaa! De dónde eres? Cuéntanos de ti 🌟",
  "Bienvenido/a! Nos alegra tenerte acá, preséntate 👋",
  "Hey qué tal! Nuevo/a por acá? Cuéntanos algo de ti 😄",
  "Hola! Qué te trae por acá? Siéntete como en casa 🏠",
  "Bienvenido/a al grupo! Cómo te llamas? 💕",
  "Hey! Llegaste justo a tiempo, estábamos hablando de...",
  "Hola! Qué buena vibra que llegues, participa cuando quieras 🎉",
  "Welcome! De qué ciudad eres? Preséntate con nosotros 🌈",
  "Holaaa! Primera vez acá? Cuéntanos qué buscas 😊",
  "Hey bienvenido/a! Relájate y conversa, aquí todos somos gente cool ✨",
  "Hola! Llegaste al mejor chat, ya verás 😄💯",
  "Bienvenido/a! No seas tímido/a, participa nomás 👋",
  "Hey qué onda! Cuéntanos algo de ti para conocerte 🌟"
];

/**
 * Estado de conversación actual
 */
let currentConversation = {
  topic: null,
  messageCount: 0,
  participants: [],
  lastTopic: null,
  consecutiveTopicChanges: 0,
  lastWelcomeTime: 0 // Para evitar spam de bienvenidas
};

/**
 * Historial de respuestas por bot (anti-repetición)
 */
const botResponseHistory = new Map();
const REPETITION_COOLDOWN = 7 * 60 * 1000; // 7 minutos

/**
 * Detecta si un mensaje es de usuario REAL
 */
const isRealUserMessage = (username) => {
  const botNames = ['Carlos', 'Mateo', 'Alejandro', 'David', 'Miguel', 'Javier', 'Fernando', 'Pablo', 
                    'Diego', 'Sebastián', 'Lucas', 'Andrés', 'Felipe', 'Martín'];
  return !botNames.includes(username);
};

/**
 * Verifica si un bot ya usó una respuesta recientemente
 */
const hasRecentlyUsed = (botId, response) => {
  if (!botResponseHistory.has(botId)) {
    botResponseHistory.set(botId, []);
    return false;
  }

  const history = botResponseHistory.get(botId);
  const now = Date.now();
  const validHistory = history.filter(entry => (now - entry.timestamp) < REPETITION_COOLDOWN);
  botResponseHistory.set(botId, validHistory);

  return validHistory.some(entry => entry.response === response);
};

/**
 * Registra respuesta en historial del bot
 */
const recordResponse = (botId, response) => {
  if (!botResponseHistory.has(botId)) {
    botResponseHistory.set(botId, []);
  }

  const history = botResponseHistory.get(botId);
  const now = Date.now();
  history.push({ response, timestamp: now });

  const validHistory = history.filter(entry => (now - entry.timestamp) < REPETITION_COOLDOWN);
  botResponseHistory.set(botId, validHistory);

  console.log(`📝 ${botId} usó: "${response}" - Cooldown: 7min`);
};

/**
 * Selecciona tema aleatorio (evita repetir el anterior)
 */
const getRandomTopic = () => {
  let topic;
  let attempts = 0;

  do {
    topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
    attempts++;
  } while (topic === currentConversation.lastTopic && attempts < 5);

  currentConversation.lastTopic = topic;
  return topic;
};

/**
 * Selecciona respuesta de seguimiento aleatoria
 */
const getRandomFollowUp = (botId) => {
  let response;
  let attempts = 0;

  do {
    // 20% coqueto, 10% spicy, 70% normal
    const rand = Math.random();
    let pool;
    
    if (rand < 0.10) {
      pool = SPICY_RESPONSES;
    } else if (rand < 0.30) {
      pool = FLIRTY_RESPONSES;
    } else {
      pool = FOLLOW_UP_RESPONSES;
    }

    response = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  } while (hasRecentlyUsed(botId, response) && attempts < 5);

  if (botId) {
    recordResponse(botId, response);
  }

  return response;
};

/**
 * SALUDA A USUARIOS REALES cuando entran al chat
 * Estrategia clave para retención: hacer sentir bienvenido al usuario
 */
export const welcomeRealUser = async (roomId, username, activeBots) => {
  // Evitar spam de bienvenidas (una cada 30 segundos)
  const now = Date.now();
  if (now - currentConversation.lastWelcomeTime < 30000) {
    return;
  }

  currentConversation.lastWelcomeTime = now;

  // Seleccionar bot aleatorio para saludar
  if (activeBots.length === 0) return;
  
  const welcomeBot = activeBots[Math.floor(Math.random() * activeBots.length)];
  const welcomeMessage = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];

  await sendMessage(roomId, {
    userId: welcomeBot.id,
    username: welcomeBot.username,
    avatar: welcomeBot.avatar,
    isPremium: false,
    content: welcomeMessage,
    type: 'text'
  });

  console.log(`👋 ${welcomeBot.username} saludó a ${username}: "${welcomeMessage}"`);
};

/**
 * Inicia conversación entre bots
 */
export const startBotConversation = async (roomId, activeBots) => {
  if (activeBots.length < 2) return;

  try {
    const topic = getRandomTopic();
    currentConversation = {
      topic: topic,
      messageCount: 0,
      participants: []
    };

    // Bot inicia tema
    const starterBot = activeBots[0];
    await sendMessage(roomId, {
      userId: starterBot.id,
      username: starterBot.username,
      avatar: starterBot.avatar,
      isPremium: false,
      content: topic.starter,
      type: 'text'
    });

    console.log(`💬 ${starterBot.username} inició: "${topic.starter}"`);

    // Programar respuestas
    const responseDelay = Math.random() * 3000 + 4000; // 4-7 segundos (más humano)
    const otherBots = activeBots.slice(1, Math.min(5, activeBots.length)); // Hasta 4 bots responden

    otherBots.forEach((bot, index) => {
      setTimeout(async () => {
        try {
      let response;

      // 93% respuestas predefinidas, 7% IA (ahorro de API)
      if (Math.random() < 0.93 && topic.responses.length > 0) {
        const availableResponses = topic.responses.filter(r => {
          const usedInConversation = currentConversation.participants.some(p => p.response === r);
          const usedRecently = hasRecentlyUsed(bot.id, r);
          return !usedInConversation && !usedRecently;
        });

        if (availableResponses.length > 0) {
          response = availableResponses[Math.floor(Math.random() * availableResponses.length)];

          if (hasRecentlyUsed(bot.id, response)) {
            console.warn(`⚠️ SPAM: ${bot.username} intentó repetir`);
            response = getRandomFollowUp(bot.id);
          } else {
            recordResponse(bot.id, response);
          }
        } else {
          response = getRandomFollowUp(bot.id);
        }
      } else {
        // Generar con IA (solo 7%)
        try {
          const history = [{ username: starterBot.username, content: topic.starter }];
          response = await generateBotResponse(bot, history, topic.starter);

          if (hasRecentlyUsed(bot.id, response)) {
            console.warn(`⚠️ SPAM IA: ${bot.username}`);
            response = getRandomFollowUp(bot.id);
          } else {
            recordResponse(bot.id, response);
          }
        } catch (error) {
          console.error(`❌ Error IA: ${error.message}`);
          response = getRandomFollowUp(bot.id);
        }
      }

      await sendMessage(roomId, {
        userId: bot.id,
        username: bot.username,
        avatar: bot.avatar,
        isPremium: false,
        content: response,
        type: 'text'
      });

      currentConversation.participants.push({ bot: bot.username, response });
      currentConversation.messageCount++;

      console.log(`💬 ${bot.username}: "${response}"`);

      // Último bot puede hacer seguimiento
      if (index === otherBots.length - 1 && Math.random() < 0.4) {
        setTimeout(async () => {
          const followUp = getRandomFollowUp(bot.id);
          await sendMessage(roomId, {
            userId: bot.id,
            username: bot.username,
            avatar: bot.avatar,
            isPremium: false,
            content: followUp,
            type: 'text'
          });
          console.log(`💬 ${bot.username} siguió: "${followUp}"`);
        }, 4000);
      }

        } catch (error) {
          console.error(`❌ Error en respuesta de ${bot.username}:`, error);
        }
      }, responseDelay * (index + 1) + Math.random() * 2000); // Variación humana
    });
  } catch (error) {
    console.error('❌ Error iniciando conversación:', error);
  }
};

/**
 * Programa conversaciones periódicas
 */
export const schedulePeriodicConversations = (roomId, activeBots, intervalMinutes = 4) => {
  if (activeBots.length < 2) {
    console.log('⚠️ Mínimo 2 bots requeridos');
    return null;
  }

  console.log(`📅 Conversaciones cada ${intervalMinutes} min`);
  console.log(`📋 Bots: ${activeBots.map(b => b.username).join(', ')}`);

  const interval = setInterval(async () => {
    console.log('🎭 Nueva conversación programada...');
    try {
      await startBotConversation(roomId, activeBots);
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, intervalMinutes * 60 * 1000);

  // Primera conversación en 15 segundos
  console.log('⏰ Primera conversación en 15s...');
  setTimeout(async () => {
    console.log('🚀 Iniciando ahora!');
    try {
      await startBotConversation(roomId, activeBots);
    } catch (error) {
      console.error('❌ Error primera conversación:', error);
    }
  }, 15000);

  return interval;
};

/**
 * Detiene conversaciones programadas
 */
export const stopPeriodicConversations = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Conversaciones detenidas');
  }
};

/**
 * RESPONDE A USUARIO REAL (nueva función)
 * Cuando un usuario real escribe, los bots pueden responder
 */
export const respondToRealUser = async (roomId, userMessage, username, activeBots) => {
  if (activeBots.length === 0) return;

  // 60% probabilidad de que un bot responda
  if (Math.random() > 0.6) return;

  // Esperar 3-8 segundos (humano)
  const delay = Math.random() * 5000 + 3000;
  
  setTimeout(async () => {
    const respondingBot = activeBots[Math.floor(Math.random() * activeBots.length)];
    
    // Generar respuesta contextual (puedes mejorar esto con IA)
    const contextualResponses = [
      `Qué bueno lo que dices ${username}! 😊`,
      `Jajaja ${username} me identifico con eso wn`,
      `Totalmente ${username}, pensé lo mismo marico`,
      `${username} tienes razón en eso pana`,
      `Interesante punto ${username}! 💯`,
      `${username} cuenta más de eso jaja`,
      `Uff ${username} yo también pienso así wn`,
      `${username} me gusta tu perspectiva 🌟`
    ];
    
    let response = contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
    
    // Evitar repetición
    if (hasRecentlyUsed(respondingBot.id, response)) {
      response = getRandomFollowUp(respondingBot.id);
    } else {
      recordResponse(respondingBot.id, response);
    }

    await sendMessage(roomId, {
      userId: respondingBot.id,
      username: respondingBot.username,
      avatar: respondingBot.avatar,
      isPremium: false,
      content: response,
      type: 'text'
    });

    console.log(`💬 ${respondingBot.username} respondió a ${username}`);
  }, delay);
};

export default {
  startBotConversation,
  schedulePeriodicConversations,
  stopPeriodicConversations,
  welcomeRealUser,
  respondToRealUser,
  isRealUserMessage
};