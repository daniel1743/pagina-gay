/**
 * ORQUESTADOR DE CONVERSACIONES DE BOTS - VERSIÓN EXPANDIDA Y HUMANIZADA
 *
 * Sistema avanzado para crear conversaciones 100% REALES entre bots
 * - 100+ respuestas variadas por tema
 * - Humor gay auténtico (Chile/Venezuela/Latino)
 * - Respuestas coquetas sin violar reglas
 * - Saludo personalizado para usuarios reales
 * - Temas de series, películas y cultura gay
 * - Anti-repetición con cooldown de 7 minutos
 * - Frases chilenas, venezolanas y latinas variadas
 */

import { sendMessage } from './chatService';

/**
 * ==============================================
 * SISTEMA DE RISAS NATURALES VARIADAS
 * ==============================================
 */
const LAUGH_VARIANTS = [
  'jajaja', 'jajaja', 'jajaja', // Más común
  'kajaja', 'kajaja',
  'jajaj', 'jajaj',
  'kajajaja',
  'jajjaja',
  'kajjaja',
  'ajajaja',
  'jsjsjs',
  'jsjs',
  'kakaka',
  'jkajaja',
  'jakaja'
];

/**
 * Diccionario de traducciones inglés -> español
 */
const TRANSLATIONS = {
  'finding': 'encontrando',
  'because': 'porque',
  'indoor': 'interior',
  'outdoor': 'exterior',
  'outdoors': 'al aire libre',
  'lessons': 'clases',
  'badly': 'mal',
  'which': 'que',
  'against all odds': 'contra todo pronóstico',
  'close': 'cercana',
  'deeper': 'más profundas',
  'stronger': 'más fuertes',
  'birth charts': 'cartas natales',
  'scary': 'da miedo',
  'want to be': 'quiero ser',
  'bougie': 'elegante',
  'underrated': 'infravalorado',
  'medieval fantasy': 'fantasía medieval',
  'falling off': 'cayéndome de',
  'harder than': 'más difícil de lo que',
  'looks': 'parece',
  'want to feel': 'quiero sentirme',
  'fancy': 'elegante',
  'childhood regression': 'regresión infantil',
  'efficient': 'eficiente',
  'constant motion': 'movimiento constante',
  'twin energy': 'energía gemela',
  'Spanish rap': 'rap español',
  'evolution': 'evolución'
};

/**
 * Traduce palabras clave de inglés a español
 */
const translateToSpanish = (text) => {
  let translated = text;
  Object.entries(TRANSLATIONS).forEach(([eng, esp]) => {
    const regex = new RegExp(eng, 'gi');
    translated = translated.replace(regex, esp);
  });
  return translated;
};

/**
 * Reemplaza risas genéricas con variantes naturales
 */
const addNaturalLaughs = (text) => {
  const randomLaugh = LAUGH_VARIANTS[Math.floor(Math.random() * LAUGH_VARIANTS.length)];
  return text
    .replace(/jajaja/gi, randomLaugh)
    .replace(/kajaja/gi, randomLaugh)
    .replace(/ajajaja/gi, randomLaugh);
};

/**
 * ==============================================
 * TEMAS DE CONVERSACIÓN EXPANDIDOS (100+ respuestas cada uno)
 * Combinando jerga LGBT+ latina, referencias culturales y autenticidad
 * CADA TEMA TIENE 12 VARIACIONES DE STARTER
 * ==============================================
 */
const CONVERSATION_TOPICS = [
  // ============ SERIES & PELÍCULAS LGBT+ ============
  {
    starters: [
      "Alguien vio Heartstopper temporada 3? Me tiene LLORANDO 😭💕",
      "Chicos terminé Heartstopper T3 y no puedo parar de llorar 😭",
      "Heartstopper temporada 3 alguien??? Estoy destrozado emocionalmente",
      "Acabo de ver el final de Heartstopper 3... QUÉ COSA MÁS HERMOSA 💕",
      "Necesito hablar de Heartstopper T3 con alguien, me tiene mal",
      "Ya vieron la nueva temporada de Heartstopper? PERFECCIÓN ABSOLUTA",
      "Heartstopper 3 me dejó llorando como bebé toda la noche jajaja",
      "Alguien más obsesionado con Heartstopper temporada 3? 🥺",
      "Terminé de maratonear Heartstopper T3 y WOW solo WOW",
      "Heartstopper nueva temporada... mis emociones no pueden más 😭💕",
      "La temporada 3 de Heartstopper superó mis expectativas totales",
      "Quién más está muerto por Heartstopper T3? Necesito apoyo grupal"
    ],
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
      "Esa serie me hizo creer en el amor de nuevo ",
      "Vi todos los eps en una noche kajajaja sin dormir",
      "Los dibujos de Nick en el cuaderno me mataron de amor",
      "Cuando Charlie toca la batería 😍 qué talentoso",
      "La mamá de Charlie es un amor total, la adoro",
      "Ese uniforme del colegio me trae nostalgia jajja",
      "La escena de las hojas cayendo es CINEMA puro",
      "Necesito amigues como los de Heartstopper ya mismo",
      "Ver su relación crecer es lo más hermoso del mundo",
      "Los colores pasteles de la serie me relajan",
      "Charlie corriendo hacia Nick en Paris ajajaja icónico",
      "Las conversaciones por mensaje son tan reales mrc",
      "Cuando se toman de la mano por primera vez 🥺",
      "La playlist de Heartstopper vive en mi Spotify",
      "Ese episodio de la playa fue perfección absoluta",
      "Ver diversidad en pantalla me llena el corazón 💕",
      "Los padres de Charlie aprendiendo es esperanzador",
      "La ansiedad de Charlie está súper bien retratada",
      "Necesito más series así de wholesome y reales",
      "Alice Oseman es una genia creando esto ",
      "Los actores tienen la edad perfecta, se nota natural",
      "Cada episodio me deja con sonrisa tonta kajjaja",
      "La representación de salud mental es impecable",
      "Cuando Charlie dice 'I love you too' EXPLOTO 💥",
      "Las escenas del parque son mi lugar seguro",
      "Ver su primer beso fue como revivir el mío",
      "Los sweaters de Nick son goals absolutos",
      "Charlie tocando el piano me da paz interior",
      "La diversidad del cast es lo que necesitábamos",
      "Cada personaje tiene su momento para brillar",
      "Las transiciones entre escenas son arte visual",
      "Ver amor sano representado es revolucionario mrc",
      "Tao siendo el mejor amigo protector me mata jajja",
      "Elle descubriendo el arte es inspiración total",
      "Necesito un Nick Nelson en mi vida ahora mismo",
      "La serie me hizo llorar en cada temporada ",
      "Los outfits son perfectos para cada personaje",
      "Ver aceptación familiar me da esperanza kajaja",
      "Charlie bailando libre es libertad pura",
      "Los momentos tiernos superan cualquier drama",
      "La química de los protagonistas es natural",
      "Cada episodio me recuerda por qué amo ser gay",
      "Las ubicaciones son perfectas para cada historia",
      "Ver vulnerabilidad masculina normalizada es todo",
      "Los diálogos suenan como conversaciones reales mrc",
      "Charlie superando sus miedos me inspira mucho ",
      "Nick navegando su sexualidad es súper real",
      "Las escenas de grupo son dinámicas perfectas",
      "Ver amor adolescente sano es refrescante kajaja",
      "Los conflictos se resuelven con comunicación",
      "Cada temporada mejora la anterior, increíble",
      "La paleta de colores cuenta historias por sí sola",
      "Ver personajes LGBT+ siendo felices es sanador",
      "Los momentos familiares me tocan el alma profundo",
      "Charlie encontrando su voz es empoderamiento puro",
      "La serie abraza la imperfección humana perfectamente",
      "Ver diversidad corporal también representada ",
      "Los momentos de silencio hablan más que palabras",
      "Charlie y Nick envejeciendo juntos es mi sueño",
      "La serie me enseñó sobre amor propio también",
      "Ver masculinidad sana es revolucionario en pantalla",
      "Los personajes secundarios tienen profundidad real mrc",
      "Cada detalle está pensado con amor y respeto",
      "Ver coming out positivos me da esperanza kajaja",
      "La serie es un abrazo visual de 8 horas",
      "Charlie siendo vulnerable pero fuerte es todo",
      "Los padres aprendiendo sobre LGBT+ es hermoso",
      "Necesito que esta serie dure para siempre ",
      "Ver amor gay normalizado es lo que necesitábamos",
      "Cada episodio me recuerda por qué vale la pena vivir",
      "La serie es mi lugar seguro cuando estoy triste",
      "Charlie y Nick son la pareja goals definitiva",
      "Ver autenticidad LGBT+ en pantalla es sanador profundo",
      "La serie me hizo más orgulloso de quien soy",
      "Heartstopper es la serie que necesitaba de adolescente",
      "Ver amor tierno sin toxicidad es revolucionario mrc",
      "Cada personaje representa parte de nuestra comunidad",
      "La serie me devolvió la fe en las historias LGBT+",
      "Charlie siendo amado completamente me hace llorar de felicidad",
      "Nick aprendiendo sobre sí mismo es súper relatable kajaja",
      "Ver familias apoyando diversidad me llena de esperanza "
    ]
  },

  {
    starter: "Alguien vio The Last of Us? La historia de Bill y Frank me ROMPIÓ 😭",
    responses: [
      "ESE EPISODIO 3 ES UNA OBRA MAESTRA ",
      "Lloré del principio al fin, literal no paraba de llorar",
      "Esa es la mejor historia de amor gay que he visto mrc",
      "Nick Offerman actuó PERFECTO, merece todos los premios",
      "La escena de la cena con Ellie fue hermosa",
      "Cuando leen la carta al final MUERO",
      "Bill protegiendo a Frank todo ese tiempo me destruyó",
      "Es mi episodio favorito de toda la serie",
      "La música del piano me hace llorar solo de recordarla",
      "Representa el amor gay de la forma más hermosa",
      "Ese episodio podría ser una película completa ",
      "Frank pintando ese pueblo me pareció tan romántico",
      "La escena del vino y las fresas es ICONIC",
      "Su historia demuestra que el amor existe en el apocalipsis",
      "Me recordó que todos merecemos un amor así",
      "La decisión final fue difícil pero valiente",
      "Neil Druckmann escribió algo mágico con ese episodio",
      "Ellie descubriendo su carta fue desgarrador mrc",
      "Joel viendo ese amor me hizo llorar más todavía",
      "Necesitamos más historias gay así en TV ",
      "Bill siendo gruñón pero amando tanto es REAL",
      "La química entre los actores fue perfecta",
      "Ese episodio me hizo creer en el amor verdadero",
      "Es el mejor episodio standalone de cualquier serie",
      "Guardo ese episodio en mi corazón para siempre kajaja",
      "La casa llena de trampas pero llena de amor también",
      "Ver a Bill cocinar para Frank me dio ternura",
      "Los 20 años que vivieron juntos en 60 minutos",
      "Frank muriendo en los brazos de Bill ajajaja devastador",
      "La carta de suicidio más romántica de la historia",
      "Murray Bartlett como Frank fue actuación perfecta mrc",
      "Cuando Frank encuentra las pastillas y entiende todo",
      "Bill enseñándole a disparar con tanto amor ",
      "Ver masculinidad vulnerable en Bill es hermoso",
      "Frank decorando la casa con tanto cariño kajaja",
      "La escena del shower juntos es intimidad pura",
      "Bill aprendiendo a vivir no solo sobrevivir",
      "Frank trayendo color a la vida gris de Bill",
      "Los infected no pudieron destruir su amor mrc",
      "Cuando Bill dice 'I was never afraid' me quebré",
      "Frank siendo la luz en la oscuridad de Bill",
      "El jardín que crearon juntos es metáfora perfecta",
      "Ver amor maduro representado es tan necesario ",
      "Bill superando su desconfianza por amor a Frank",
      "La escena del piano es arte audiovisual puro",
      "Frank enfermo pero aún amando es desgarrador kajaja",
      "Bill eligiendo morir con Frank en lugar de solo",
      "Amor hasta la muerte literal, goals eternos",
      "La representación gay sin fetichización es perfecta mrc",
      "Dos hombres mayores siendo románticos es hermoso",
      "Bill encontrando amor cuando ya no esperaba nada",
      "Frank viendo belleza donde Bill solo veía supervivencia",
      "El episodio redefine lo que significa 'final feliz'",
      "Ver amor sin drama innecesario es refrescante ",
      "Bill cocinando rabbit stew con tanto amor kajaja",
      "Frank painting the town literally and figuratively",
      "La última cena juntos me destroza cada vez",
      "Bill diciendo 'I'm satisfied' es paz absoluta",
      "Frank muriendo tranquilo porque vivió amado mrc",
      "La casa vacía al final habla del amor que hubo",
      "Ellie leyendo la carta en voz alta me mata",
      "Joel entendiendo que el amor sobrevive todo ",
      "Bill dejando provisiones porque amaba a Frank",
      "Frank transformando survival en living kajaja",
      "La escena del fence repair es domesticidad goals",
      "Bill letting his guard down solo con Frank",
      "Ver intimidad emocional masculina sin shame mrc",
      "Frank siendo patient con las walls de Bill",
      "Bill aprendiendo que vulnerability es fortaleza",
      "La comida compartida como lenguaje de amor ",
      "Frank encontrando esperanza en el mundo más desesperanzado",
      "Bill protegiendo su happiness por primera vez kajaja",
      "Ver aging together en el apocalipsis es poético",
      "Frank bringing culture a la supervivencia básica",
      "Bill choosing love over fear por primera vez",
      "La música clásica sonando en casa llena de armas mrc",
      "Frank painting flowers donde Bill ve solo muerte",
      "Bill learning to live no solo exist ",
      "Ver emotional intimacy sin toxic masculinity",
      "Frank siendo brave enough to love un hombre cerrado",
      "Bill opening up después de años de soledad kajaja",
      "La ironía de encontrar amor en el fin del mundo",
      "Frank muriendo peaceful porque fue completamente amado",
      "Bill eligiendo shared death sobre lonely survival mrc",
      "La casa como símbolo de home que construyeron",
      "Ver commitment hasta la muerte literal ",
      "Frank transformando existence en beautiful life kajaja",
      "Bill discovering que había más que survival",
      "Ver love story madura sin youth obsession",
      "Frank bringing joy a la paranoia constante de Bill",
      "Bill learning trust después de años de betrayal mrc",
      "La garden como metaphor de amor que cultivaron",
      "Ver domestic bliss en el setting más hostil ",
      "Frank dying surrounded por todo el amor de Bill",
      "Bill realizing que vivir valió la pena por Frank kajaja",
      "La carta final como love letter al mundo",
      "Ver sacrifice por amor no por obligation mrc",
      "Bill and Frank proving que love conquers apocalypse",
      "El episodio me enseñó sobre different types de courage",
      "Frank muriendo happy porque truly lived ",
      "Bill finding peace en su choice de morir together",
      "Ver soulmates finding each other against all odds kajaja",
      "La house empty pero full of memories de amor",
      "Bill and Frank eternally together en esa carta final mrc"
    ]
  },

  {
    starter: "Pose es LA MEJOR SERIE de ballroom y cultura trans, cambió mi vida 💃✨",
    responses: [
      "ELEKTRA ABUNDANCE ES MI REINA ABSOLUTA mrc",
      "Blanca es un ángel literal, lloré con toda su historia",
      "Esa serie me enseñó tanto sobre ballroom culture ",
      "Pray Tell es ICONICO, Billy Porter se merece todo",
      "La escena del baile de Candy me rompió el corazón",
      "Angel y Papi fueron tan reales como pareja",
      "El final me tuvo llorando tres días seguidos kajaja",
      "Damon descubriendo el baile fue inspirador",
      "Las categorías de las balls son ARTE PURO",
      "Aprendí tanto vocabulario ballroom con Pose mrc",
      "La Casa Evangelista es familia de verdad",
      "Lulu me sorprendió tanto, su desarrollo fue hermoso",
      "Esa serie representa la comunidad trans perfectamente ",
      "Candy merece justicia, su muerte me dolió tanto",
      "Los años 80s y 90s retratados fueron perfectos kajaja",
      "La epidemia del VIH fue tratada con respeto",
      "Seeing Elektra vulnerable fue devastador pero real mrc",
      "Ricky siendo aliado mostró que existen buenos hombres",
      "Las audiciones para Mother son TENSIÓN PURA",
      "Necesito ver voguing en vivo algún día ",
      "La moda y el estilo de esa serie es PERFECTO",
      "Blanca adoptando a todos fue lo más hermoso kajaja",
      "Esa serie merece más reconocimiento del que tiene",
      "Los actores trans protagonizando fue revolucionario",
      "Pose es historia, cultura y amor en una sola serie mrc",
      "Cuando Blanca gana Mother of the Year me morí",
      "El voguing de Damon en la primera ball ICÓNICO",
      "Elektra's wigs son una religión aparte ",
      "Ver chosen family representada me sanó kajaja",
      "Pray Tell narrating las balls me daba escalofríos",
      "Angel trabajando como modelo fue inspiracional",
      "Las peleas entre houses eran DRAMA puro mrc",
      "Blanca luchando contra el VIH me partió el alma",
      "Lil Papi siendo aliado real es todo lo que necesito",
      "Los outfits de las balls son alta costura literal ",
      "Candy siendo funny pero vulnerable me destrozó kajaja",
      "Elektra evolucionando como mother fue hermoso",
      "Ver sex work sin juicio moral es revolucionario",
      "Damon encontrando su place en ballroom culture mrc",
      "Las walking categories me hipnotizan completamente",
      "Blanca teaching sobre self-worth a sus children",
      "Angel y Papi superando classism juntos ",
      "Los judges de las balls son ICONOS puros kajaja",
      "Ver masculinidad femme celebrated es sanador",
      "Elektra's one-liners son legendary para siempre mrc",
      "Pray Tell dealing con loss fue actuación perfecta",
      "Las balls como escapismo de discrimination real",
      "Blanca siendo mother sin biological children ",
      "Ver transgender joy representation es necesario kajaja",
      "Elektra learning humility through pain me tocó",
      "Los romantic storylines fueron escritos con respeto mrc",
      "Damon bailando profesionalmente fue goals absolutos",
      "Las friendships entre mujeres trans son hermosas",
      "Ver aging LGBT+ characters es representación crucial ",
      "Candy's funeral episode me destruyó emocionalmente kajaja",
      "Elektra protecting her children como fierce mother",
      "Los costumes department merece todos los Emmy mrc",
      "Blanca teaching self-love through example",
      "Ver economic struggle sin glamorizing poverty ",
      "Angel modeling success siendo trans es inspirational kajaja",
      "Las ball categories celebrating all body types",
      "Elektra's vulnerability behind the fierceness mrc",
      "Pray Tell como elder teaching younger generation",
      "Ver police brutality acknowledged sin explotar trauma ",
      "Blanca's unconditional love salvando lives literal kajaja",
      "Las dance sequences son choreography perfection",
      "Elektra learning que love isn't weakness mrc",
      "Ver chosen names being respected completamente",
      "Damon finding confidence through ballroom culture ",
      "Las mother-child relationships tan beautifully portrayed kajaja",
      "Angel navigating straight relationship siendo trans",
      "Ver community support durante crisis es esperanzador mrc",
      "Blanca aging with dignity y grace absoluta",
      "Las ball commentaries son comedy gold puro ",
      "Elektra's redemption arc being earned not given kajaja",
      "Ver intersectionality acknowledged en cada storyline",
      "Pray Tell's love stories fueron escritas con ternura mrc",
      "Las voguing battles son athletic art form",
      "Blanca teaching children sobre safe sex ",
      "Ver trans women supporting each other es beautiful kajaja",
      "Elektra learning forgiveness para sí misma",
      "Las period details transport you to that era mrc",
      "Damon becoming confident performer fue inspiring",
      "Ver family rejection y chosen family healing ",
      "Candy being remembered como full person kajaja",
      "Angel's relationship challenges siendo relatable",
      "Las ball prizes meaning everything a los participants mrc",
      "Elektra protecting reputation pero learning love",
      "Ver economic mobility through community support ",
      "Blanca's wisdom coming from lived experience kajaja",
      "Las makeup tutorials I need en real life",
      "Pray Tell being voice of reason y emotion mrc",
      "Ver aging gracefully en marginalized community",
      "Damon teaching younger dancers paying it forward ",
      "Elektra's final evolution siendo complete person kajaja",
      "Las series finale me left sobbing happy tears",
      "Angel achieving dreams against all odds mrc",
      "Ver legacy building through chosen family",
      "Blanca's impact lasting beyond her death ",
      "Las ball culture preserving history through performance kajaja",
      "Elektra finding peace en her final moments",
      "Ver transgender elders represented con respect mrc",
      "Pose teaching me sobre resilience y community strength",
      "Las characters living fully despite systemic oppression ",
      "Serie completa es love letter a LGBT+ resilience kajaja"
    ]
  },

  {
    starter: "RuPaul's Drag Race temporada 10, AQUARIA es todo lo que está bien 👑",
    responses: [
      "YAAAS cuando ganó me puse a gritar como loca mrc",
      "The Vixen traía TODO el drama y me encantaba",
      "Kameron Michaels callada pero LETAL en los lipsyncs ",
      "Monét X Change debió ganar también, era increíble",
      "Asia O'Hara con las mariposas NUNCA LO SUPERO jajja 🦋💀",
      "Eureka O'Hara es controversial pero talentosa kajaja",
      "El doble shantay de Kameron vs Eureka fue EPIC",
      "Miz Cracker siendo robada en varios challenges me dolió mrc",
      "Mayhem Miller salió muy pronto, merecía más",
      "The Vixen vs Aquaria drama was TELEVISION GOLD ",
      "Los looks de Aquaria eran FASHION PURA kajaja",
      "Dusty Ray Bottoms con esos dots era arte conceptual",
      "Nueva Actitud lipsync es de los mejores de la historia mrc",
      "Asia siendo Mother fue hermoso ver",
      "Aquaria en el desafío de las mellizas GANÓ TODO ",
      "Kameron con su cuerpo de gym pero alma sensible",
      "Esa temporada tenía TALENTO en cada esquina kajaja",
      "Monét con esa esponja se volvió ICONICA",
      "El runway de sombreros fue uno de los mejores mrc",
      "Vixen defendiendo su verdad fue valiente",
      "Aquaria vs The Vixen untucked was MESSY y amé cada segundo ",
      "Blair St. Clair era tan joven pero tan talentosa",
      "Snatch Game de esa temporada fue divertidísimo kajaja",
      "Yuhua Hamasaki merecía más tiempo en la competencia",
      "Esa temporada 10 es de mis favoritas de RuPaul siempre mrc",
      "Aquaria serving LEWKS cada semana sin fail",
      "The Vixen calling out racism en reality TV ",
      "Kameron siendo quiet pero deadly en competencia kajaja",
      "Asia's ball look with the butterflies haunts me",
      "Eureka's personality fue polarizing pero entertaining mrc",
      "Cracker's comedy timing era perfecta siempre",
      "Mayhem deserved better, she was polished AF ",
      "Aquaria's finale look fue STUNNING absolute kajaja",
      "The Vixen being unapologetically herself era iconic",
      "Kameron lip syncing para su life tres veces mrc",
      "Dusty's unique aesthetic merecia más recognition",
      "Monét being consistently funny en todas las challenges ",
      "Blair looking like literal teenager pero slaying kajaja",
      "Yuhua's kimono look fue cultural appreciation done right",
      "Vanessa being first out was SHOCKING mrc",
      "Aquaria's mermaid look still gives me chills",
      "The Vixen vs everyone else fue reality TV gold ",
      "Kameron's quiet confidence fue understated pero powerful kajaja",
      "Asia organizing that finale stunt era TV history",
      "Eureka's vulnerability moments were genuinely touching mrc",
      "Cracker not making finale fue one of biggest robberies",
      "Mayhem's entrance look set expectations HIGH ",
      "Aquaria proving young queens can win too kajaja",
      "The Vixen's political awareness era ahead of time",
      "Kameron muscle queen representation fue everything mrc",
      "Dusty's dot makeup signature look era memorable",
      "Monét's sponge dress becoming meme legend ",
      "Blair's DUI storyline fue handled respectfully kajaja",
      "Yuhua being robbed en acting challenge still hurts",
      "Vanessa going home first era tragedy pure mrc",
      "Aquaria's social media savvy helping her win",
      "The Vixen speaking truth to power consistently ",
      "Kameron defying expectations week after week kajaja",
      "Asia's experience showing en most challenges",
      "Eureka's polarizing edit fue fascinating to watch mrc",
      "Cracker's stand-up being criminally underrated",
      "Mayhem representing old school drag perfectly ",
      "Aquaria's fashion evolution throughout season kajaja",
      "The Vixen being authentically herself always",
      "Kameron's lip sync assassin era UNEXPECTED mrc",
      "Dusty bringing avant-garde to mainstream platform",
      "Monét's charisma carrying her through challenges ",
      "Blair's growth from young queen to polished performer kajaja",
      "Yuhua's cultural commentary being educational",
      "Vanessa deserved more screen time mrc",
      "Aquaria winning deservedly pero competencia fue tight",
      "The Vixen's impact beyond show being substantial ",
      "Kameron representing introverted queens successfully kajaja",
      "Asia's mother energy guiding younger contestants",
      "Eureka's disability representation being important mrc",
      "Cracker's Jewish drag perspective adding diversity",
      "Mayhem being drag excellence desde day one ",
      "Aquaria's winners circle spot being well-earned kajaja",
      "The Vixen changing conversation about race en reality TV",
      "Kameron proving quiet doesn't mean weak mrc",
      "Dusty's artistic vision being ahead of its time",
      "Monét's eventual All Stars win proving her talent ",
      "Blair's redemption arc en later seasons kajaja",
      "Yuhua becoming fan favorite after show",
      "Vanessa's brief time still making impact mrc",
      "Season 10 reunion being one of most intense",
      "Aquaria's reign being short but memorable ",
      "The Vixen's legacy inspiring future contestants kajaja",
      "Kameron opening doors para muscle queens",
      "Asia's continued relevance en drag community mrc",
      "Eureka's controversial moments sparking important conversations",
      "Cracker's humor style influencing comedy challenges ",
      "Mayhem representing drag history respectfully kajaja",
      "Season 10 cast chemistry being unmatched",
      "Aquaria proving social media queens can slay TV mrc",
      "The Vixen being quotable machine entire season",
      "Kameron's underdog story resonating con audiences ",
      "Dusty's makeup artistry inspiring beauty community kajaja",
      "Monét's wit keeping entertainment value high",
      "Blair's youth bringing fresh perspective mrc",
      "Yuhua's cultural education being valuable contribution",
      "Season 10 being turning point para Drag Race ",
      "Aquaria's winner's edit being satisfying to watch kajaja",
      "Cast diversity representing drag community authentically",
      "Season 10 proving reality TV can be art mrc"
    ]
  },

  // ============ CULTURA GAY LATINA ============
  {
    starter: "Cuál es su película gay favorita? Yo digo Call Me By Your Name 🍑",
    responses: [
      "Elio's parents being supportive goals absolute kajaja",
"Los padres de Elio siendo tan comprensivos son metas absolutas KQKAJSKA 😭🤣",
"Italian summer aesthetic permanently in my brain",
"La estética del verano italiano permanentemente en mi cerebro",
"Ver desire y confusion retratados tan real ",
"Ver el deseo y la confusión retratados tan reales 💔",
"Oliver leaving fue heartbreak I wasn't ready for mrc",
"La partida de Oliver fue un desamor para el que no estaba listo mrc 😭😭😭",
"Elio masturbating with peach being THAT scene kajaja",
"Elio masturbándose con el durazno siendo ESA escena JAKSJKAKKA 🍑🍑🍑",
"Ver Jewish-Italian family dynamics fascinating",
"Ver la dinámica familiar judío-italiana es fascinante ✨",
"La archaeological dig metaphor para self-discovery ",
"La metáfora de la excavación arqueológica para el autodescubrimiento ",
"Oliver's confidence teaching Elio about himself mrc",
"La confianza de Oliver enseñándole a Elio sobre sí mismo mrc 😌",
"Ver age gap relationship treated with nuance kajaja",
"Ver la relación con diferencia de edad tratada con matices KAKKAJAJAAJAJJ 💖",
"La book being even more explicit than movie",
"El libro es incluso más explícito que la película 🔥",
"Elio crying by fireplace destroyed my soul ",
"Elio llorando junto a la chimenea destrozó mi alma 🕯️😭🕯️",
"Italian language making everything sound romantic mrc",
"El idioma italiano haciendo que todo suene romántico mrc 🇮🇹",
"Ver sexual awakening portrayed so beautifully kajaja",
"Ver el despertar sexual retratado tan bellamente LAJSKAAK ❤️‍🔥",
"Oliver y Elio's intellectual connection first",
"La conexión intelectual de Oliver y Elio primero 🤓",
"La movie teaching me about desire vs love ",
"La película enseñándome sobre el deseo vs. el amor ",
"Sufjan Stevens soundtrack elevating every scene mrc",
"El soundtrack de Sufjan Stevens elevando cada escena mrc 🎶🎶",
"Ver privilege allowing this love story to exist kajaja",
"Ver el privilegio permitiendo que esta historia de amor exista JJJ KQKAKAK 🤑",
"Elio's parents knowing but not judging",
"Los padres de Elio sabiendo pero sin juzgar 🙏",
"La summer fling having lifelong impact ",
"La aventura de verano teniendo un impacto de por vida 🗺️",
"Oliver being older but not predatory mrc",
"Oliver siendo mayor pero no depredador mrc 😩",
"Ver Mediterranean setting as character itself kajaja",
"Ver el escenario mediterráneo como un personaje en sí mismo LAJSKAAK☀️🌊",
"Elio learning about his own sexuality naturally",
"Elio aprendiendo sobre su propia sexualidad de forma natural",
"La movie making me want to learn Italian ",
"La película haciéndome querer aprender italiano 😭🇮🇹😭",
"Oliver teaching Elio sobre confidence mrc",
"Oliver enseñándole a Elio sobre la confianza mrc 🤌",
"Ver first love intensity captured perfectly kajaja",
"Ver la intensidad del primer amor capturada perfectamente KQKAKAK ❤️",
"Elio's vulnerability being strength not weakness",
"La vulnerabilidad de Elio siendo una fortaleza, no una debilidad",
"La nosebleed scene as sexual awakening metaphor ",
"La escena del sangrado nasal como metáfora del despertar sexual 🩸",
"Oliver leaving for America breaking my heart mrc",
"Oliver yéndose a Estados Unidos rompiéndome el corazón mrc 🗽💔",
"Ver class differences not being huge obstacle kajaja",
"Ver las diferencias de clase no siendo un gran obstáculo JAKSJKAKKA 💸",
"Elio growing up durante esos few months",
"Elio creciendo durante esos pocos meses 🌱",
"La movie avoiding gay tragedy tropes ",
"La película evitando los tropos de tragedia gay ",
"Oliver being gentle with Elio's inexperience mrc",
"Oliver siendo gentil con la inexperiencia de Elio mrc 🥺",
"Ver sexual tension building slowly perfectly kajaja",
"Ver la tensión sexual creciendo lentamente a la perfección KAKKAJAJAAJAJJ 🥵",
"Elio's dad speech about love being revolutionary",
"El discurso del padre de Elio sobre el amor es revolucionario 🗣️",
"La Italian villa becoming dream vacation spot ",
"La villa italiana convirtiéndose en un lugar de vacaciones soñado 🏖️",
"Oliver calling Italy home briefly mrc",
"Oliver llamando a Italia su hogar brevemente mrc ",
"Ver friendship becoming love organically kajaja",
"Ver la amistad convirtiéndose en amor orgánicamente JJJ 🤝💖",
"Elio learning he deserves to be desired",
"Elio aprendiendo que merece ser deseado 😌",
"La movie making peaches sexy forever ",
"La película haciendo que los duraznos sean sexis para siempre LAJSKAAK 🍑🍑",
"Oliver being patient teacher y lover mrc",
"Oliver siendo un profesor y amante paciente mrc ",
"Ver academic environment fostering connection kajaja",
"Ver el entorno académico fomentando la conexión KQKAKAK 🧠",
"Elio discovering his power as sexual being",
"Elio descubriendo su poder como ser sexual",
"La ending credits scene destroying me emotionally ",
"La escena de los créditos finales destruyéndome emocionalmente 😭😭😭",
"Oliver remembering their summer years later mrc",
"Oliver recordando su verano años después mrc ",
"Ver first gay love story sin shame kajaja",
"Ver la primera historia de amor gay sin vergüenza JAKSJKAKKA 🏳️‍🌈"]},

  {
    starter: "Salí del closet con mis papás este finde... fue intenso 🥺💕",
    responses: [
      "FELICIDADES ! Eso requiere muchísimo valor mrc",
      "Espero que haya salido bien, cómo reaccionaron? kajaja",
      "Wow eres muy valiente, bien por ti 💪",
      "Yo aún no me animo, te admiro un montón",
      "Cuenta más! Necesito saber cómo te fue ",
      "Mi mamá lloró al principio pero después me abrazó",
      "Ese es un paso gigante, debes estar aliviado mrc",
      "Yo lo hice hace años y fue liberador total kajaja",
      "Espero que te apoyen, todos merecemos amor",
      "Mi familia lo tomó super bien por suerte ",
      "Si necesitas hablar aquí estamos todos mrc",
      "Es el momento más difícil pero más importante kajaja",
      "Independiente de cómo salió, orgullo de ti",
      "Mi papá tardó en aceptarlo pero ahora está bien ",
      "Eres increíble por ser auténtico contigo mismo mrc",
      "Algunos padres necesitan tiempo para procesar kajaja",
      "Tú decides cuándo y cómo salir del closet",
      "Tu felicidad es lo más importante siempre ",
      "La familia que eliges también importa mrc",
      "Hoy celebramos tu valentía contigo kajaja",
      "Respirar libre es lo mejor del mundo",
      "No importa la reacción, tú eres válido siempre ",
      "Mi hermano me apoyó desde el día uno mrc",
      "Recuerda que mereces amor incondicional kajaja",
      "Este es el inicio de tu vida auténtica 🌈",
      "Coming out nunca es fácil pero siempre vale la pena ",
      "Mi abuela fue la más cool cuando le conté mrc",
      "Tu valor me inspira a ser más auténtico también kajaja",
      "Espero que sientas el peso lifted off your shoulders",
      "Mi tía gay me ayudó cuando salí del closet ",
      "Cada coming out es victory para toda la comunidad mrc",
      "Tus papás necesitan procesar pero amor prevalece kajaja",
      "Yo salí del closet tres veces porque kept going back",
      "Tu honestidad es gift que les das a tus padres ",
      "Mi mamá now brags about having gay son mrc",
      "Living your truth es revolutionary act kajaja",
      "Some parents surprise you with their acceptance",
      "Mi dad took time but now asks about boyfriends ",
      "Your courage gives hope a otros still closeted mrc",
      "Salir del closet es marathon not sprint kajaja",
      "Mi familia ahora es más close because authenticity",
      "You just freed yourself from biggest burden ",
      "Mis hermanas became my biggest allies después mrc",
      "Tu valentía ripples out y helps others kajaja",
      "Parents love differently than they understand sometimes",
      "Mi coming out brought family closer together ",
      "You chose vulnerability over comfort que es brave mrc",
      "Algunos padres Google 'how to support gay child' kajaja",
      "Your authenticity gives permission a otros to be real",
      "Mi mom went from crying a attending Pride ",
      "Trust the process even cuando feels scary mrc",
      "Tu truth is valid regardless of their reaction kajaja",
      "Some parents mourn idea of child they thought they knew",
      "Mi dad ahora tells dad jokes about being gay ",
      "You being out makes world safer para otros mrc",
      "Family acceptance sometimes comes en waves kajaja",
      "Mi abuela said 'mijo I always knew'",
      "Your bravery today impacts future generations ",
      "Parents sometimes need education not just acceptance mrc",
      "Mi family now asks meaningful questions about my life kajaja",
      "You modeled authenticity que es powerful teaching",
      "Some parents react from fear not from hate ",
      "Mi mom became PFLAG mom después de educarse mrc",
      "Your coming out es act of self-love kajaja",
      "Family dynamics shift pero often for better",
      "Mi dad learned LGBTQ+ terminology para understand mejor ",
      "You eliminated need to hide que es exhausting mrc",
      "Parents sometimes surprise with their growth capacity kajaja",
      "Mi familia ahora celebrates Pride con nosotros",
      "Your honesty created opportunity para deeper connection ",
      "Some parents need time pero love usually wins mrc",
      "Mi coming out taught family about unconditional love kajaja",
      "You chose integrity over people-pleasing",
      "Family acceptance es journey not destination ",
      "Mi parents now defend LGBTQ+ rights publicly mrc",
      "Your authenticity freed them from false expectations kajaja",
      "Some parents mourn closeted child pero celebrate real you",
      "Mi family relationships deeper now because honesty ",
      "You gave them chance to love real you mrc",
      "Parents sometimes need time to unlearn harmful messaging kajaja",
      "Mi mom tells other parents about accepting gay kids",
      "Your courage creates ripple effects in family ",
      "Some parents fear for your safety más than judge mrc",
      "Mi family learned love has no conditions kajaja",
      "You eliminated barrier between you and family",
      "Parents education curve steep pero worth climbing ",
      "Mi dad now calls boyfriends by name mrc",
      "Your truth telling taught family about authenticity kajaja",
      "Some parents need Google translate para understand identity",
      "Mi coming out made siblings more open about themselves ",
      "You demonstrated self-respect which demands respect mrc",
      "Family acceptance sometimes happens gradually kajaja",
      "Mi parents now volunteer at LGBTQ+ organizations",
      "Your bravery opened door para honest relationships ",
      "Some parents love better when they understand más mrc",
      "Mi family bonds stronger now because no secrets kajaja",
      "You chose freedom over family approval",
      "Parents sometimes need community of other parents ",
      "Mi mom now corrects people who use wrong pronouns mrc",
      "Your authenticity taught family love es verb not feeling kajaja",
      "Some parents grow into acceptance through action",
      "Mi family learned pride means celebrating not hiding ",
      "You created space para genuine relationship con family mrc"
    ]
  },

  // ============ VIDA COTIDIANA & HUMOR ============
  {
    starter: "Qué hacen un viernes noche? Yo toy tirado en el sillón con Netflix 😅",
    responses: [
      "Same , pijama y chillin total mrc",
      "Salir a tomar algo con amigues, deberías venir kajaja",
      "Depende del mood, hoy me quedo en casa también",
      "Fiesta en Provi si te animas, va a estar buena ",
      "Yo limpiando porque mañana gym temprano ajajaja mrc",
      "Netflix and chill literal, pero solo yo 😂 kajaja",
      "Planificando salir pero la flojera es real",
      "Antro gay si hay buena música, sino casa ",
      "Zoom call con amigues de otros países mrc",
      "Cocinando algo rico y viendo series kajaja",
      "Gym nocturno porque de día no puedo",
      "Deberíamos organizar algo entre todos ",
      "Tinder scrolling y procrastinando como siempre 😂 mrc",
      "Leyendo fanfics hasta las 3am probably kajaja",
      "Viernes de skincare routine y self-care",
      "Jugando videojuegos con los amigues online ",
      "Llamada con mi novio que está lejos 💕 mrc",
      "Meditando porque la semana fue heavy kajaja",
      "Karaoke gay bar si encuentro con quién ir",
      "Viendo RuPaul obvio, nueva temporada ",
      "Date con alguien de Grindr wish me luck ajajaja mrc",
      "Escribiendo en mi diario como terapeuta barato kajaja",
      "Maratón de películas gay que tengo pendientes",
      "Horneando brownies porque sí, antojo random ",
      "Nada planeado, lo que salga espontáneo mrc",
      "Ordenando Uber Eats porque cocinar is overrated kajaja",
      "Stalkeando ex en Instagram like pathetic gay",
      "Facetime con mi mejor amiga de hace años ",
      "Reorganizando Spotify playlists porque I'm that gay mrc",
      "Depilándome las piernas para nadie en particular kajaja",
      "Limpiando closet y donando ropa que never wear",
      "Scrolling TikTok hasta que eyes hurt ",
      "Pintándome las uñas mientras veo series mrc",
      "Haciendo face mask y pretending I'm at spa kajaja",
      "Leyendo sobre conspiracy theories porque why not",
      "Reorganizing room para sentirme productive ",
      "Ordering overpriced smoothie porque deserve it mrc",
      "Viendo YouTube tutorials sobre things I'll never do kajaja",
      "Llamando a mi mamá porque good son",
      "Planning outfits para next week like it matters ",
      "Crying sobre things que no puedo controlar mrc",
      "Researching vacations que can't afford kajaja",
      "Doing online quizzes about my personality",
      "Reorganizing phone photos from two years ago ",
      "Googling symptoms que probably don't have mrc",
      "Making vision boards que never look at again kajaja",
      "Calculating how many hours until Monday",
      "Fantasizing about life I don't have ",
      "Organizing digital files porque procrastination mrc",
      "Watching makeup tutorials para skills I lack kajaja",
      "Reading reviews para products I won't buy",
      "Comparing myself to people on social media ",
      "Making playlists para different moods mrc",
      "Researching random facts que no one cares about kajaja",
      "Planning elaborate meals que I'll never cook",
      "Googling celebrities altura weight porque curious ",
      "Making lists of things to do que never happen mrc",
      "Watching old videos of myself siendo cringe kajaja",
      "Researching apartments I can't afford",
      "Reading about places I want to visit ",
      "Organizing contacts en phone que never call mrc",
      "Watching lives de people I don't know kajaja",
      "Planning perfect responses to arguments already over",
      "Googling 'how to be adult' at 25 ",
      "Making mental notes about things I'll forget mrc",
      "Watching compilations de things que make me happy kajaja",
      "Researching career changes que terrify me",
      "Reading about productivity mientras being unproductive ",
      "Organizing browser bookmarks from 2019 mrc",
      "Watching house tours of places I'll never afford kajaja",
      "Making pros y cons lists about everything",
      "Googling 'am I normal' variations ",
      "Reading self-help articles mientras avoiding responsibility mrc",
      "Planning conversations I'll never have kajaja",
      "Researching random illnesses because WebMD",
      "Watching old Disney movies para nostalgia ",
      "Making elaborate plans que require motivation I lack mrc",
      "Reading about successful people mientras doing nothing kajaja",
      "Googling 'how to know if you're gay' still",
      "Planning fictional scenarios que will never happen ",
      "Researching workout routines I won't do mrc",
      "Watching tutorials para skills que already have kajaja",
      "Making mental grocery lists I'll forget immediately",
      "Googling 'signs of depression' entonces getting scared ",
      "Reading about relationships mientras being single mrc",
      "Planning perfect comebacks para situations already over kajaja",
      "Researching random conspiracy theories until 3am",
      "Watching old music videos from middle school ",
      "Making fake scenarios donde I'm successful mrc",
      "Googling 'how to adult' variations kajaja",
      "Reading about places I want to move to",
      "Watching documentaries about serial killers ",
      "Making playlists que perfectly capture my mood mrc",
      "Researching symptoms que definitely don't have kajaja",
      "Planning elaborate revenge scenarios que are petty",
      "Googling celebrities birth charts because astrology ",
      "Reading about productivity mientras procrastinating mrc",
      "Watching satisfying cleaning videos whilst living in mess kajaja",
      "Making lists de goals I won't achieve",
      "Researching random facts to sound interesting ",
      "Planning conversations with people I'm avoiding mrc",
      "Googling 'how to be confident' variations kajaja",
      "Reading about successful morning routines at midnight",
      "Watching old interviews de people I admire ",
      "Making elaborate plans que require energy I don't have mrc"
    ]
  },

  {
    starter: "Alguien hace gym o puro cuerpo de pana como yo? ajajaja 💪😂",
    responses: [
      "Yo voy al gym pero por salud nomá ",
      "Dejé el gym hace mil años, pura flojera mrc",
      "Gym 5 veces a la semana, es mi terapia 💪 kajaja",
      "Running mejor, el gym me aburre un poco",
      "Musculoca level pero con alma sensible ajajaja ",
      "Yoga en casa cuando me acuerdo mrc",
      "Calistenia en el parque es mi onda kajaja",
      "Natación es lo mío, cuerpo de nadador",
      "Bailando en casa cuenta como ejercicio? ajajaja ",
      "Crossfit pero sufro cada día 😅 mrc",
      "Gym para ver hombres guapos, bonus el ejercicio kajaja",
      "Ciclismo los fines de semana con amigos",
      "Entrenador personal porque sola no me motivo ",
      "Gym a las 6am antes del trabajo dedication mrc",
      "Zumba gay es lo más divertido que existe kajaja",
      "Pole dance estoy aprendiendo, es brutal",
      "Bodyweight exercises en casa son suficientes ",
      "Hiking los domingos, naturaleza y ejercicio mrc",
      "Gym con mi mejor amigo, accountability partner kajaja",
      "Boxeo para sacar el estrés, super efectivo",
      "Spinning classes son mi infierno favorito ajajaja ",
      "Stretching y movilidad, cuerpo de bailarín mrc",
      "Gym de noche para evitar crowds kajaja",
      "Mi cuerpo está perfecto así ajajaja",
      "Deportes de equipo, fútbol gay los sábados ",
      "Pilates online porque studio prices son robbery mrc",
      "Walking es underrated cardio y free kajaja",
      "Hot yoga para flexibility y sweat therapy",
      "Rock climbing indoor porque outdoors scary ",
      "Swimming laps mindlessly es meditative mrc",
      "Tennis lessons porque want to be bougie kajaja",
      "Martial arts para self-defense y discipline",
      "Dance classes porque body positivity ",
      "Hiking trails early morning antes que crowds mrc",
      "Beach volleyball cuando weather permits kajaja",
      "Skateboarding badly pero with enthusiasm",
      "Kayaking cuando can afford rental ",
      "Badminton because underrated racquet sport mrc",
      "Frisbee ultimate porque team sport fun kajaja",
      "Archery lessons porque medieval fantasy vibes",
      "Surfing lessons pero mostly falling off board ",
      "Paddleboarding which is harder than looks mrc",
      "Bouldering porque less commitment than climbing kajaja",
      "Fencing because want to feel fancy",
      "Horseback riding cuando can splurge ",
      "Golf badly pero enjoy being outdoors mrc",
      "Bowling porque nostalgia y social activity kajaja",
      "Roller skating because '80s vibes",
      "Ice skating poorly pero with joy ",
      "Sledding cuando snow exists where I live mrc",
      "Trampoline parks porque inner child kajaja",
      "Laser tag porque competitive streak",
      "Mini golf seriously porque precision matters ",
      "Escape rooms que require physical movement mrc",
      "Geocaching porque treasure hunting adult style kajaja",
      "Parkour badly pero safely",
      "Slackline practice porque balance challenge ",
      "Unicycling lessons porque why not mrc",
      "Pogo stick because childhood regression kajaja",
      "Stilts walking porque circus dreams",
      "Juggling practice porque hand-eye coordination ",
      "Hula hooping porque core workout disguised as fun mrc",
      "Jump rope because efficient cardio kajaja",
      "Obstacle course racing when feeling brave",
      "Mud runs porque getting dirty therapeutic ",
      "Color runs porque photos look good mrc",
      "Charity walks porque good cause plus movement kajaja",
      "Mall walking cuando weather bad outside",
      "Stair climbing porque elevators are cheating ",
      "Walking meetings instead of sitting mrc",
      "Dancing while cleaning house kajaja",
      "Stretching during TV commercial breaks",
      "Desk exercises porque office job sedentary ",
      "Walking phone calls when possible mrc",
      "Taking stairs instead of escalators kajaja",
      "Parking farther away for extra steps",
      "Getting off bus one stop early ",
      "Walking to nearby errands instead driving mrc",
      "Pacing while thinking or on calls kajaja",
      "Standing desk setup when working",
      "Fidgeting because constant motion ",
      "Cleaning house vigorously counts as workout mrc",
      "Gardening because squatting y lifting kajaja",
      "Playing with pets actively",
      "Chasing after toddlers if available ",
      "Moving furniture around for exercise mrc",
      "Carrying groceries instead of using cart kajaja",
      "Walking while waiting instead of sitting",
      "Taking movement breaks every hour ",
      "Doing exercises during phone holds mrc",
      "Walking meditation instead of sitting kajaja",
      "Dancing while cooking meals",
      "Stretching before getting out of bed ",
      "Exercise videos when can't leave house mrc",
      "Following along with YouTube workouts kajaja",
      "Bodyweight exercises durante commercial breaks",
      "Chair exercises when stuck at desk ",
      "Resistance band workouts porque portable mrc",
      "Balance exercises while brushing teeth kajaja",
      "Calf raises while standing in lines",
      "Shoulder rolls durante computer work ",
      "Neck stretches to combat phone neck mrc",
      "Hip circles to counteract sitting kajaja",
      "Ankle rotations under desk",
      "Deep breathing exercises for core ",
      "Wall push-ups in office bathroom mrc",
      "Squats while waiting for coffee to brew kajaja"
    ]
  },

  // ============ MÚSICA & CULTURA POP ============
  {
    starter: "Qué están escuchando? Yo puro Bad Bunny y Peso Pluma últimamente 🐰🎵",
    responses: [
      "Bad Bunny es GOD, nuevo álbum increíble ",
      "Peso Pluma me tiene obsesionado también mrc",
      "Reggaeton viejo, Daddy Yankee y Don Omar kajaja",
      "Música variada, de todo un poco dependiendo el mood",
      "Rosalía cuando quiero sentirme ICONIC ",
      "Lady Gaga eternamente, little monster aquí 🦄 mrc",
      "Shakira después del beef con Piqué es FUEGO kajaja",
      "Karol G para entrenar en el gym obvio",
      "Pop en inglés, Dua Lipa es mi fave ",
      "Ariana Grande always, esa voz es perfecta mrc",
      "Coldplay cuando estoy melancólico kajaja",
      "Música electrónica para limpiar la casa ajajaja",
      "Podcasts más que música últimamente ",
      "Spotify Discover Weekly me salva la vida mrc",
      "Corridos tumbados son mi guilty pleasure kajaja",
      "Música clásica para concentrarme estudiando",
      "Cumbia para fiestas, la mejor para bailar ",
      "Harry Styles porque es hermoso y talentoso mrc",
      "Rock alternativo de los 2000s nostalgia kajaja",
      "Música de películas, soundtracks son arte",
      "Reggae cuando quiero relax total ",
      "Lana Del Rey para sentirme melancólica aesthetic mrc",
      "Trap latino, Anuel y Ozuna también kajaja",
      "Música brasileña, bossa nova es hermosa",
      "Lo que sea que tenga buen beat para bailar ",
      "Taylor Swift porque I'm not immune a pop perfection mrc",
      "Becky G mixing English y Spanish perfectly kajaja",
      "J Balvin cuando need reggaeton pero classy",
      "Billie Eilish para moods depresivos ",
      "The Weeknd porque voice of an angel mrc",
      "Olivia Rodrigo for teenage angst at 25 kajaja",
      "SZA when need R&B feelings",
      "Bad Gyal mixing reggaeton con attitude ",
      "C. Tangana because Spanish rap evolution mrc",
      "Anitta bringing Brazilian funk to mainstream kajaja",
      "Mon Laferte for Latin rock realness",
      "Jesse & Joy para sibling harmony goals ",
      "Mau y Ricky because twin energy mrc",
      "Camila Cabello solo career appreciation kajaja",
      "Lauren Jauregui solo work deserves more recognition",
      "Kali Uchis bringing that trilingual energy ",
      "Omar Apollo porque queer Latino representation mrc",
      "Boy Pablo for indie Spanish vibes kajaja",
      "Cuco bringing bedroom pop Latino style",
      "Carla Morrison for emotional vulnerability ",
      "Natalia Lafourcade preserving Mexican folk beautifully mrc",
      "Álvaro Díaz Puerto Rican innovation kajaja",
      "Rauw Alejandro evolution as artist",
      "Myke Towers consistent reggaeton quality ",
      "Arcángel veteran reggaeton respect mrc",
      "Farruko reinventing himself constantly kajaja",
      "Daddy Yankee retirement hitting different",
      "Don Omar nostalgia hitting hard ",
      "Wisin y Yandel reunion energy mrc",
      "Zion y Lennox underrated duo kajaja",
      "Plan B throwback reggaeton vibes",
      "Tito El Bambino classic reggaeton ",
      "Héctor El Father pioneer respect mrc",
      "Ivy Queen la reina del reggaeton kajaja",
      "Natti Natasha female reggaeton power",
      "Cazzu Argentine trap queen ",
      "Tokischa Dominican dembow realness mrc",
      "Young Miko Puerto Rican lesbian rapper kajaja",
      "Snow Tha Product Mexican-American bars",
      "La Santa Cecilia mixing genres beautifully ",
      "Manu Chao for world music fusion mrc",
      "Devendra Banhart indie folk Latin influence kajaja",
      "Helado Negro ambient Latin sounds",
      "Chicano Batman psychedelic soul ",
      "Calexico southwestern border music mrc",
      "Gipsy Kings flamenco rumba kajaja",
      "Mano Negra punk rock Latino",
      "Los Fabulosos Cadillacs ska reggae ",
      "Soda Stereo classic rock en español mrc",
      "Café Tacvba experimental rock kajaja",
      "Molotov rap rock político",
      "Control Machete Mexican rap pioneers ",
      "Cypress Hill Latin hip-hop crossover mrc",
      "Ozomatli multicultural LA sound kajaja",
      "Los Lobos Chicano rock legends",
      "Santana guitar magic timeless ",
      "Selena Tejano queen forever mrc",
      "Vicente Fernández ranchera respect kajaja",
      "Juan Gabriel songwriting genius",
      "José José romantic ballad king ",
      "Luis Miguel crooner perfection mrc",
      "Marc Anthony salsa romántica kajaja",
      "Rubén Blades salsa intelectual",
      "Celia Cruz la reina de la salsa ",
      "Hector Lavoe tragic salsa genius mrc",
      "Willie Colón salsa innovation kajaja",
      "Tito Puente mambo king",
      "Benny Moré Cuban music legend ",
      "Ibrahim Ferrer Buena Vista Social Club mrc",
      "Compay Segundo trovador eternal kajaja",
      "Silvio Rodríguez nueva canción",
      "Pablo Milanés Cuban songwriter ",
      "Mercedes Sosa nueva canción argentina mrc",
      "Violeta Parra Chilean folk legend kajaja",
      "Víctor Jara political folk hero",
      "Atahualpa Yupanqui Argentine folk ",
      "Los Kjarkas Bolivian folk mrc",
      "Inti-Illimani Chilean nueva canción kajaja",
      "Quilapayún political folk group",
      "Manu Chao mixing languages y genres "
    ]
  },

  // ============ TEMAS COQUETOS (Sin violar reglas) ============
  {
    starter: "Alguien para un café o algo más interesante? 👀☕",
    responses: [
      "Ese 'algo más' me tiene intrigado  😏",
      "Café suena bien, depende qué tan interesante sea lo otro ajajaja",
      "Dime más sobre ese 'algo más' mrc 👀",
      "Café primero, vamos viendo qué sale después kajaja",
      "Me gusta cómo piensas ajajaja, cuenta más",
      "Ese 'o algo' tiene muchas posibilidades  😏",
      "Café está bien, pero soy más de conversaciones profundas mrc",
      "Ese 'algo más' es código para? ajajaja kajaja",
      "Suena tentador eso que propones",
      "Café con buena compañía es mi debilidad ",
      "Me tienes curiosa con esa propuesta 👀 mrc",
      "Soy todo oídos para ese plan interesante kajaja",
      "El misterio me gusta, cuéntame más",
      "Café y buena conversación es el inicio perfecto ",
      "Ese emoji de ojos lo dice todo ajajaja mrc",
      "Me gustan las propuestas directas así 😏 kajaja",
      "Depende qué tan interesante seas tú también",
      "Café y ver a dónde nos lleva la vibra ",
      "Ese 'algo más' me pone creativo ajajaja mrc",
      "Me encanta tu estilo directo kajaja",
      "Cuéntame más en DM entonces? 👀",
      "Café está bien pero mejor un trago no? ",
      "Esa energía me gusta, sigamos hablando mrc",
      "Mándame ubicación y vemos qué sale 😏 kajaja",
      "Me tienes intrigado con esa propuesta",
      "Café sounds innocent pero that emoji says otherwise ",
      "I like where this conversation is heading mrc 👀",
      "Define 'interesante' porque my imagination running wild kajaja",
      "Coffee first, then we see donde leads us",
      "That eyeball emoji doing things to me  😏",
      "I'm here for mysterious proposals mrc",
      "Coffee pero make it spicy kajaja",
      "You got my attention, now what?",
      "Straight to the point, I respect that ",
      "Coffee sounds safe, pero I live dangerously mrc 👀",
      "My curiosity es officially piqued kajaja",
      "Coffee dates can turn into interesting adventures",
      "I like confident people who know what they want ",
      "That 'algo más' got my wheels turning mrc 😏",
      "Coffee y mystery, perfect combination kajaja",
      "You're speaking my love language",
      "I'm intrigued by your directness ",
      "Coffee pero what's the real agenda? mrc 👀",
      "I appreciate someone who doesn't beat around bush kajaja",
      "My interest level just went from 0 to 100",
      "Coffee sounds like good starting point ",
      "I like people who hint at adventure mrc 😏",
      "That proposition got my attention fully kajaja",
      "Coffee first, mysteries later",
      "You know how to make things interesting ",
      "I'm here for whatever you're suggesting mrc 👀",
      "Coffee pero with interesting company kajaja",
      "Direct approach works on me",
      "I like the way your mind works ",
      "Coffee y good conversation, then we'll see mrc 😏",
      "That suggestion has layers I appreciate kajaja",
      "You got my curiosity now deliver",
      "Coffee seems innocent enough starting point ",
      "I respond well to confident proposals mrc 👀",
      "That hint of mystery is working kajaja",
      "Coffee pero I sense underlying agenda",
      "I like people who suggest adventures ",
      "That proposition sounds promising mrc 😏",
      "Coffee first, then interesting developments kajaja",
      "You know how to peak someone's interest",
      "I'm drawn to confident suggestions ",
      "Coffee pero what else you got in mind? mrc 👀",
      "That approach is refreshingly direct kajaja",
      "My attention is captured completely",
      "Coffee sounds perfect, everything else bonus ",
      "I appreciate bold conversation starters mrc 😏",
      "That suggestion got wheels turning kajaja",
      "Coffee pero I sense more to this story",
      "Confident proposals work on me ",
      "I like where your head's at mrc 👀",
      "That hint was perfectly executed kajaja",
      "Coffee first, adventure after",
      "You know how to intrigue someone ",
      "I respond to confident energy mrc 😏",
      "That suggestion has my full attention kajaja",
      "Coffee pero I'm curious about alternatives",
      "Direct approach is appreciated ",
      "I like people who suggest possibilities mrc 👀",
      "That proposition sounds promising kajaja",
      "Coffee pero open to interpretations",
      "You got confidence I find attractive ",
      "I'm here for whatever you're hinting at mrc 😏",
      "That suggestion perfectly balances innocent y intriguing kajaja",
      "Coffee sounds like perfect excuse",
      "I appreciate someone who creates curiosity ",
      "That approach works on me mrc 👀",
      "Coffee pero I sense hidden agenda kajaja",
      "Direct suggestions are refreshing",
      "I like confident conversation starters ",
      "That hint was executed perfectly mrc 😏",
      "Coffee pero what's the real plan? kajaja",
      "You know how to capture attention",
      "I'm intrigued by confident propositions ",
      "That suggestion has interesting undertones mrc 👀",
      "Coffee first, mysteries after kajaja",
      "I respond well to bold approaches",
      "You got my curiosity fully engaged ",
      "Coffee pero I'm open to alternatives mrc 😏",
      "That proposition sounds perfectly intriguing kajaja"
    ]
  },

  // ============ VIAJES & LUGARES ============
  {
    starter: "Alguien de Santiago Centro? Para conocer gente del barrio 📍",
    responses: [
      "Yo soy de Santiago Centro! Barrio Lastarria ",
      "Providencia acá, cerca igual mrc",
      "Bellavista, zona bohemia total kajaja",
      "Ñuñoa representa! No tan centro pero cerca",
      "Las Condes, soy cuico ajajaja 😂 ",
      "Maipú, un poco lejos pero vengo al centro mrc",
      "Barrio República acá, lleno de estudiantes kajaja",
      "Recoleta, me encanta este barrio",
      "Cerca del Cerro Santa Lucía, hermoso lugar ",
      "Estación Central, área un poco ruda pero ok mrc",
      "Matucana cerca, zona artística kajaja",
      "Viví en varios barrios, ahora en Yungay",
      "Barrio Italia es mi zona favorita para salir ",
      "GAM cerca, siempre hay eventos mrc",
      "Apoquindo para el lado del metro kajaja",
      "Cerca de la Plaza de Armas literal",
      "Suecia con Providencia, buena ubicación ",
      "Deberíamos juntarnos en algún café céntrico mrc",
      "Barrio Concha y Toro es tranquilo pero lindo kajaja",
      "Yo trabajo en el centro así que siempre ando",
      "Parque Bustamante cerca, buena vibra ",
      "Metro Baquedano es mi referencia siempre mrc",
      "Alameda con todo, es súper central kajaja",
      "Santa Isabel cerca, conoces el sector?",
      "Santiago es chico, todos estamos cerca igual ",
      "Barrio Brasilito, súper central mrc",
      "Plaza Italia área, epicentro de todo kajaja",
      "Barrio París Londres, arquitectura hermosa",
      "Santa Lucía con Alameda intersection ",
      "Barrio Dieciocho, histórico y céntrico mrc",
      "Mapocho estación área, urbano y cool kajaja",
      "Barrio Franklin, vintage y artístico",
      "Santa Ana plaza cerca, transporte perfecto ",
      "Barrio Yungay, bohemio y auténtico mrc",
      "Quinta Normal área, espacios verdes kajaja",
      "Universidad de Chile sector, estudiantil",
      "Plaza Baquedano literal epicenter ",
      "Barrio Meiggs, multicultural y vibrante mrc",
      "Santa Rosa con Alameda, conectado todo kajaja",
      "Barrio Patronato, comercio y diversidad",
      "San Pablo calle, transporte a everywhere ",
      "Plaza de la Constitución cerca mrc",
      "Barrio Cívico, government district kajaja",
      "Merced con todo, bar scene perfecto",
      "Universidad Católica sector ",
      "Moneda palace área, turístico pero central mrc",
      "San Antonio port cuando want escape city kajaja",
      "Valparaíso weekend trips desde centro",
      "Viña del Mar playa desde Santiago ",
      "Concepción visits cuando travel south mrc",
      "La Serena norte trips occasionally kajaja",
      "Temuco family visits down south",
      "Puerto Montt cuando want real south ",
      "Iquique desert y ocean combination mrc",
      "Arica border adventures rarely kajaja",
      "Punta Arenas extreme south bucket list",
      "Easter Island dream destination ",
      "Atacama desert spiritual journey someday mrc",
      "Patagonia hiking dreams constantly kajaja",
      "Torres del Paine national park goals",
      "Chiloé island culture exploration ",
      "Mendoza Argentina wine trips mrc",
      "Buenos Aires weekend getaways kajaja",
      "Lima Peru food pilgrimage",
      "Machu Picchu obligatory tourist trip ",
      "Cusco altitude sickness experience mrc",
      "Cartagena Colombia beach paradise kajaja",
      "Medellín transformation city visit",
      "Bogotá high altitude capital ",
      "Quito Ecuador equator experience mrc",
      "Galápagos islands wildlife dream kajaja",
      "Rio de Janeiro carnival bucket list",
      "São Paulo urban jungle exploration ",
      "Florianópolis Brazil beach paradise mrc",
      "Montevideo Uruguay calm capital kajaja",
      "Punta del Este fancy beach resort",
      "La Paz Bolivia highest capital ",
      "Sucre Bolivia colonial beauty mrc",
      "Asunción Paraguay underrated destination kajaja",
      "Iguazu Falls natural wonder",
      "Bariloche Argentina lake district ",
      "Ushuaia world's southernmost city mrc",
      "El Calafate glacier experience kajaja",
      "Salta Argentina colonial charm",
      "Córdoba Argentina student city ",
      "Rosario Argentina industrial pero cultural mrc",
      "Mar del Plata Argentina beach classic kajaja",
      "Mendoza wine country perfection",
      "San Carlos de Bariloche chocolate y lakes ",
      "Puerto Iguazu falls Argentine side mrc",
      "Península Valdés whale watching kajaja",
      "El Chaltén hiking paradise",
      "Villa La Angostura lake beauty ",
      "San Martín de los Andes mountain town mrc",
      "Villa Carlos Paz Argentina lake resort kajaja",
      "Tandil Argentina small city charm",
      "Necochea Argentina beach alternative ",
      "Pinamar Argentina upscale beach mrc",
      "San Clemente del Tuyú Argentina family beach kajaja",
      "Chascomús Argentina lake town",
      "Mercedes Argentina rural charm ",
      "Luján Argentina religious pilgrimage mrc",
      "San Antonio de Areco Argentina gaucho culture kajaja",
      "Tigre Argentina river delta",
      "La Plata Argentina planned city ",
      "Punta del Este Uruguay summer playground mrc",
      "Colonia del Sacramento Uruguay colonial kajaja",
      "Piriápolis Uruguay beach town",
      "José Ignacio Uruguay exclusive beach "
    ]
  }

  // Continuar con más temas expandidos...
];

/**
 * ==============================================
 * RESPUESTAS DE SEGUIMIENTO - EXPANDIDAS (150 respuestas)
 * Para mantener conversaciones fluyendo naturalmente
 * ==============================================
 */
const FOLLOW_UP_RESPONSES = [
  // Chileno
  "ajajaja sí , mal",
  "totalmente de acuerdo po",
  "nah , yo creo que no",
  "puede ser jaja, quién sabe po",
  "y ustedes qué piensan?",
  "me muero  😂",
  "ajajaja no puede ser po",
  "eso mismo digo yo literal",
  "me pasa igual po",
  "depende del mood jaja ",
  "facts po",
  "literal no te creo kajajaja",
  "ay sí po, cuenta más",
  "yo también po ",
  "qué chistoso po",
  "kajajaja muero con eso",
  "dímelo a mí po",
  "sí obvio ",
  "ajajajaja ya po",
  "interesante eso",
  
  // Venezolano
  "qué arrecho eso mrc",
  "verga literal me identifico",
  "naguará eso está fino ",
  "qué nivel mrc",
  "vale, entiendo kajaja",
  "chévere eso",
  "épale cuenta más",
  "coño qué fino ",
  "verga sí mrc",
  "ladilla eso kajajaja",
  "brutal",
  "arrecho ese peo ",
  "vale vale entendido",
  "nojoda qué nivel mrc",
  "full identificado kajaja",
  
  // Neutral Latino
  "kajajaja tal cual",
  "uff sí totalmente ",
  "me encanta esa vibra 💕",
  "apoyo esa moción jaja mrc",
  "100% de acuerdo kajaja",
  "eso es real talk",
  "no mentirás ajajaja ",
  "FACTS 💯",
  "me representas tanto mrc",
  "same energy aquí 🙌 kajaja",
  "eso eso eso",
  "hablaste con verdad ",
  "pensé que era el único jaja mrc",
  "relatable af kajaja",
  "mood total",

  // Nuevas adiciones variadas
  "te entiendo perfecto ",
  "same pero diferente mrc",
  "eso suena conocido kajaja",
  "me late esa idea",
  "interesante perspectiva ",
  "nunca lo había pensado así mrc",
  "qué deep eso kajaja",
  "relatable content",
  "mood actual ",
  "te siento tanto mrc",
  "esa vibra me gusta kajaja",
  "pensamiento profundo",
  "filosófico el ",
  "sabias palabras mrc",
  "gospel truth kajaja",
  "predicando verdades",
  "facts no cap ",
  "periodt mrc",
  "say it louder kajaja",
  "louder for the back",
  "this is it ",
  "exactly this mrc",
  "couldn't agree more kajaja",
  "you said what you said",
  "speak your truth ",
  "periodt periodt mrc",
  "that's the tea kajaja",
  "spilling facts",
  "no lies detected ",
  "straight facts mrc",
  "truth bomb kajaja",
  "hit different",
  "different type of real ",
  "another level mrc",
  "next level thinking kajaja",
  "galaxy brain moment",
  "big brain energy ",
  "intellectual icon mrc",
  "philosopher king kajaja",
  "deep thinker",
  "wise beyond years ",
  "old soul vibes mrc",
  "that wisdom tho kajaja",
  "enlightened content",
  "spiritual awakening ",
  "consciousness level up mrc",
  "third eye open kajaja",
  "seeing clearly",
  "vision activated ",
  "clarity achieved mrc",
  "understanding unlocked kajaja",
  "wisdom gained",
  "lesson learned ",
  "growth mindset mrc",
  "evolution in progress kajaja",
  "leveling up",
  "upgrading daily ",
  "constant improvement mrc",
  "getting better kajaja",
  "progress not perfection",
  "small wins count ",
  "celebrating growth mrc",
  "proud of progress kajaja",
  "journey continues",
  "path unclear pero moving ",
  "figuring it out mrc",
  "learning as we go kajaja",
  "improvising life",
  "winging it successfully ",
  "fake it till make it mrc",
  "confidence is key kajaja",
  "believing in process",
  "trusting the journey ",
  "faith over fear mrc",
  "courage over comfort kajaja",
  "brave choices daily",
  "living authentically ",
  "being real mrc",
  "no pretending kajaja",
  "honest living",
  "transparent existence ",
  "open book vibes mrc",
  "nothing to hide kajaja",
  "authentic self",
  "real recognize real ",
  "keeping it 100 mrc",
  "genuine article kajaja",
  "original content",
  "unique perspective ",
  "one of a kind mrc",
  "special individual kajaja",
  "rare breed",
  "limited edition ",
  "collector's item mrc",
  "priceless person kajaja",
  "invaluable human",
  "treasure of human ",
  "gem of person mrc",
  "diamond in rough kajaja",
  "shining bright",
  "glowing up ",
  "radiating energy mrc",
  "positive vibes only kajaja",
  "good energy",
  "high frequency ",
  "elevated consciousness mrc",
  "spiritual gangster kajaja",
  "enlightened being",
  "awakened soul ",
  "conscious living mrc",
  "mindful existence kajaja",
  "present moment",
  "living now ",
  "current reality mrc",
  "today's vibe kajaja",
  "right now energy",
  "this moment ",
  "present consciousness mrc"
];

/**
 * ==============================================
 * RESPUESTAS COQUETAS - EXPANDIDAS (75 respuestas)
 * ==============================================
 */
const FLIRTY_RESPONSES = [
  "ay pero qué lindo 👀",
  "uff interesante jaja ",
  "me gusta cómo piensas 😏",
  "cuéntame más de ti jaja mrc",
  "suena tentador eso 🔥 kajaja",
  "ajajaja pícarO",
  "ay no seas malo jaja ",
  "me lo estás poniendo difícil",
  "tú sí sabes 😉 mrc",
  "dame más detalles jaja kajaja",
  "qué directo/a eres, me gusta 👀",
  "esa energía me encanta ",
  "me tienes intrigado/a jaja 😏 mrc",
  "cuéntame más en privado? kajaja",
  "ese misterio me gusta",
  "qué atrevido/a ajajaja 🔥 ",
  "me gusta tu estilo mrc",
  "esa vibra me llama la atención 😊 kajaja",
  "interesante propuesta 👀",
  "me convenciste jaja ",
  "esa sonrisa debe ser linda 😏 mrc",
  "cuándo nos conocemos entonces? kajaja",
  "me gusta esa confianza",
  "ese comentario 🔥 ",
  "no me tientes ajajaja mrc",
  "I like your style kajaja 😏",
  "that confidence though 👀",
  "you got my attention ",
  "interesting approach mrc",
  "I'm listening kajaja 😉",
  "bold move, I respect it",
  "you know what you want  🔥",
  "that energy is infectious mrc",
  "smooth talker alert kajaja 👀",
  "I see you",
  "working that charm  😏",
  "confidence is attractive mrc",
  "I like direct people kajaja 🔥",
  "you're trouble, I can tell",
  "dangerous combination  👀",
  "that smile probably deadly mrc 😊",
  "I'm intrigued, continue kajaja",
  "you got game",
  "smooth operator  😏",
  "I respect the boldness mrc 🔥",
  "that approach works kajaja 👀",
  "you know your way around words",
  "charming personality detected  😉",
  "I like confident energy mrc",
  "that's attractive quality kajaja 🔥",
  "you got my interest",
  "smooth delivery  👀",
  "I appreciate directness mrc 😏",
  "that confidence is showing kajaja",
  "you make good points",
  "persuasive argument  🔥",
  "I'm convinced mrc 👀",
  "that charm is working kajaja 😊",
  "you got skills",
  "I like your energy  😏",
  "that attitude is everything mrc 🔥",
  "you're dangerous kajaja 👀",
  "I see what you did there",
  "smooth move  😉",
  "you got my attention now mrc",
  "that was slick kajaja 🔥",
  "I appreciate the effort",
  "you're good at this  👀",
  "that confidence is key mrc 😏",
  "I like your approach kajaja",
  "you know what you're doing",
  "that energy is magnetic  🔥",
  "I'm here for it mrc 👀",
  "you got the right idea kajaja 😊",
  "that's working for you"
];

/**
 * ==============================================
 * RESPUESTAS CALIENTES - EXPANDIDAS (60 respuestas)
 * Sugerentes pero NO explícitas, mantienen misterio
 * ==============================================
 */
const SPICY_RESPONSES = [
  "ese tema es interesante 🔥",
  "kajajaja me gusta hacia dónde va esto ",
  "seguimos esta conversación mejor en otro lado? 👀 mrc",
  "qué travieso/a kajajaja",
  "me tienes pensando cosas ahora 😏 ",
  "esa imaginación tuya mrc",
  "mejor hablamos de eso en privado jaja kajaja",
  "ay dios qué atrevido/a 🔥",
  "me estás provocando? ajajaja ",
  "esa mente tuya 😏 mrc",
  "cuéntame más pero no aquí jaja kajaja",
  "qué calor de repente 🔥",
  "me estás tentando ",
  "ajajaja no puedo creer que dijiste eso mrc",
  "eres un peligro jaja 👀 kajaja",
  "mi mente fue a otro lado completamente 😅",
  "qué directo/a madre mía ajajaja ",
  "seguimos esto en DM mejor? 🔥 mrc",
  "ay no me hagas pensar en eso kajaja",
  "ajajaja qué barbaridad",
  "that energy is dangerous 🔥 ",
  "you got my imagination running mrc 👀",
  "that's playing with fire kajaja 😏",
  "I see where this is going",
  "that's a loaded statement  🔥",
  "you're trouble, I can tell mrc",
  "that suggestion is tempting kajaja 👀",
  "dangerous territory there 😏",
  "you know what you're doing ",
  "that's risky business mrc 🔥",
  "I like where your head's at kajaja 👀",
  "that's bold of you",
  "you're playing dangerous games  😏",
  "that energy is intoxicating mrc",
  "you got me curious now kajaja 🔥",
  "that's provocative thinking 👀",
  "you know how to push buttons ",
  "that's stirring things up mrc 😏",
  "you're creating tension kajaja",
  "that's raising the temperature 🔥",
  "you got my pulse racing ",
  "that's magnetic energy mrc 👀",
  "you're being provocative kajaja 😏",
  "that's intense stuff",
  "you know how to create atmosphere  🔥",
  "that's charged conversation mrc",
  "you're turning up the heat kajaja 👀",
  "that's electric energy 😏",
  "you got my heart racing ",
  "that's dangerous territory mrc 🔥",
  "you're walking the line kajaja 👀",
  "that's risky talk 😏",
  "you know how to create tension ",
  "that's loaded with possibilities mrc 🔥",
  "you're being suggestive kajaja 👀",
  "that's stirring emotions 😏",
  "you got chemistry working ",
  "that's creating sparks mrc 🔥",
  "you're igniting something kajaja 👀",
  "that's combustible energy 😏"
];

/**
 * ==============================================
 * SALUDOS PERSONALIZADOS - EXPANDIDOS (45 respuestas)
 * Detecta cuando entra un usuario nuevo y saluda humanamente
 * ==============================================
 */
const WELCOME_MESSAGES = [
  "Hola! Bienvenido/a al chat, cómo estás? 😊",
  "Hey! Qué bueno que llegas, únete a la conversa 💬 ",
  "Holaaa! De dónde eres? Cuéntanos de ti 🌟 mrc",
  "Bienvenido/a! Nos alegra tenerte acá, preséntate 👋 kajaja",
  "Hey qué tal! Nuevo/a por acá? Cuéntanos algo de ti 😄",
  "Hola! Qué te trae por acá? Siéntete como en casa 🏠 ",
  "Bienvenido/a al grupo! Cómo te llamas? 💕 mrc",
  "Hey! Llegaste justo a tiempo, estábamos hablando de... kajaja",
  "Hola! Qué buena vibra que llegues, participa cuando quieras 🎉",
  "Welcome! De qué ciudad eres? Preséntate con nosotros 🌈 ",
  "Holaaa! Primera vez acá? Cuéntanos qué buscas 😊 mrc",
  "Hey bienvenido/a! Relájate y conversa, aquí todos somos gente cool ✨ kajaja",
  "Hola! Llegaste al mejor chat, ya verás 😄💯",
  "Bienvenido/a! No seas tímido/a, participa nomás 👋 ",
  "Hey qué onda! Cuéntanos algo de ti para conocerte 🌟 mrc",
  "Holiii! Fresh face en el chat! Preséntate kajaja 😊",
  "Welcome to the party! Cuál es tu historia? 🎉",
  "Hola beautiful human! Cuéntanos de ti  ✨",
  "Hey hey! Nueva energy en el chat! Nos encanta mrc 💫",
  "Holaaa! Qué te trae por estos lares? kajaja 🌈",
  "Welcome! Este es safe space, siéntete libre de ser tú 🏠",
  "Hey! Perfect timing, necesitábamos fresh perspective  💭",
  "Hola! Ready para buenas conversaciones? mrc 🗣️",
  "Welcome welcome! Qué good vibes traes kajaja ✨",
  "Hey! New friend alert! Cuéntanos tu deal 👋",
  "Hola! Este chat needed your energy  🌟",
  "Welcome! Espero que te guste la vibra aquí mrc 😊",
  "Hey! Fresh blood! Nos gusta diversity kajaja 🌈",
  "Hola! Qué te gusta hacer for fun? 🎨 ",
  "Welcome! Acabas de join la mejor conversación mrc 💬",
  "Hey! New energy es always welcome kajaja ✨",
  "Hola! Este chat es addictive, fair warning 😅",
  "Welcome! Qué brings you to our little corner?  🏠",
  "Hey! Perfect time to jump in mrc 🌊",
  "Hola! Fresh perspective es exactly what needed kajaja 💡",
  "Welcome! Hope you're ready for good times ✨",
  "Hey! New friend unlocked! Tell us about yourself  🔓",
  "Hola! This chat familia grows bigger mrc 👨‍👩‍👧‍👦",
  "Welcome! Qué good timing you have kajaja ⏰",
  "Hey! Ready para some real talk? 💯 ",
  "Hola! New voice en la conversation mrc 🎤",
  "Welcome! Hope you brought good energy kajaja ⚡",
  "Hey! Este chat just got more interesting ✨",
  "Hola! Nueva persona, nuevas stories  📚",
  "Welcome! Ready to vibe with us? mrc 🌈"
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
                    'Diego', 'Sebastián', 'Lucas', 'Andrés', 'Felipe', 'Martín', 'Joaquín', 'Gonzalo',
                    'Rodrigo', 'Nicolás', 'Eduardo', 'Ricardo', 'Gabriel', 'Francisco', 'José', 'Luis'];
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

  // Seleccionar un starter aleatorio de la lista
  const randomStarter = topic.starters
    ? topic.starters[Math.floor(Math.random() * topic.starters.length)]
    : topic.starter; // Fallback por si hay temas viejos sin array

  return {
    ...topic,
    starter: randomStarter
  };
};

/**
 * Selecciona respuesta de seguimiento aleatoria
 */
const getRandomFollowUp = (botId) => {
  let response;
  let attempts = 0;

  do {
    // 15% coqueto, 8% spicy, 77% normal
    const rand = Math.random();
    let pool;
    
    if (rand < 0.08) {
      pool = SPICY_RESPONSES;
    } else if (rand < 0.23) {
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
      content: addNaturalLaughs(translateToSpanish(topic.starter)), // Traducir + risas
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

          // 95% respuestas predefinidas, 5% IA (ahorro de API)
          if (Math.random() < 0.95 && topic.responses.length > 0) {
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
            // Usar respuesta de seguimiento como fallback
            response = getRandomFollowUp(bot.id);
          }

          await sendMessage(roomId, {
            userId: bot.id,
            username: bot.username,
            avatar: bot.avatar,
            isPremium: false,
            content: addNaturalLaughs(translateToSpanish(response)), // Traducir + risas naturales
            type: 'text'
          });

          currentConversation.participants.push({ bot: bot.username, response });
          currentConversation.messageCount++;

          console.log(`💬 ${bot.username}: "${response}"`);

          // Último bot puede hacer seguimiento
          if (index === otherBots.length - 1 && Math.random() < 0.35) {
            setTimeout(async () => {
              const followUp = getRandomFollowUp(bot.id);
              await sendMessage(roomId, {
                userId: bot.id,
                username: bot.username,
                avatar: bot.avatar,
                isPremium: false,
                content: addNaturalLaughs(translateToSpanish(followUp)), // Traducir + risas
                type: 'text'
              });
              console.log(`💬 ${bot.username} siguió: "${followUp}"`);
            }, 4000 + Math.random() * 2000);
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
 * RESPONDE A USUARIO REAL
 * Cuando un usuario real escribe, los bots pueden responder
 */
export const respondToRealUser = async (roomId, userMessage, username, activeBots) => {
  if (activeBots.length === 0) return;

  // 55% probabilidad de que un bot responda
  if (Math.random() > 0.55) return;

  // Esperar 3-8 segundos (humano)
  const delay = Math.random() * 5000 + 3000;
  
  setTimeout(async () => {
    const respondingBot = activeBots[Math.floor(Math.random() * activeBots.length)];
    
    // Respuestas contextuales expandidas
    const contextualResponses = [
      `Qué bueno lo que dices ${username}! 😊`,
      `Kajajaja ${username} me identifico con eso `,
      `Totalmente ${username}, pensé lo mismo mrc`,
      `${username} tienes razón en eso kajaja`,
      `Interesante punto ${username}! 💯`,
      `${username} cuenta más de eso jaja `,
      `${username} yo también pienso así mrc`,
      `${username} me gusta tu perspectiva 🌟 kajaja`,
      `Facts ${username}, literal `,
      `${username} speaking truths mrc`,
      `Ese ${username} sabe kajaja ✨`,
      `Tell em ${username}! 💪`,
      `${username} gets it `,
      `Wisdom from ${username} mrc`,
      `${username} con la real kajaja`,
      `That's deep ${username} 🧠`,
      `${username} filosofando `,
      `Big brain ${username} mrc`,
      `${username} pensamiento profundo kajaja`,
      `Real talk ${username} 💯`
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