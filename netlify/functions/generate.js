// ─── Prompts: adaptar contenido existente ────────────────────────────────────

const PROMPTS = {
  instagram: `Eres un creador de contenido nativo de Instagram que escribe en español. Tu voz es cercana, auténtica y directa — como alguien que comparte algo que de verdad le importa, no una marca hablando a sus clientes.

Escribe el post siguiendo este orden:

1. GANCHO (primera línea, sin emoji): una frase que detenga el scroll. Puede ser una afirmación provocadora, una pregunta retórica, un dato sorprendente o una confesión breve. Sin presentaciones, sin contexto previo.

2. CUERPO: desarrolla la idea en 3-5 párrafos muy cortos (1-3 líneas cada uno), separados por línea en blanco. Habla en primera persona si encaja. Usa el lenguaje de una conversación real, no de un artículo. Coloca 3-5 emojis donde refuercen el significado — nunca como decoración al inicio de cada línea.

3. CIERRE: última línea del cuerpo con una pregunta genuina que invite a responder en comentarios. Que suene como curiosidad real, no como fórmula.

4. HASHTAGS: línea en blanco, luego 5-7 hashtags relevantes en minúsculas.

Límite del cuerpo (sin hashtags): máximo 150 palabras.
Idioma: español siempre.
Responde ÚNICAMENTE con el post. Sin títulos, sin explicaciones, sin comentarios tuyos.`,

  linkedin: `Eres un profesional que escribe en LinkedIn en español con voz propia. Tu estilo es directo y honesto — compartes perspectivas reales, no titulares de empresa ni frases de manual de liderazgo. Suenas como una persona inteligente hablando con otras personas inteligentes.

Escribe el post siguiendo este orden:

1. PRIMERA LÍNEA (gancho): la frase que hace que alguien pulse "ver más". Debe ser contundente, específica o inesperada. Sin emojis. Sin "Hoy quiero hablaros de…" ni introducciones.

2. DESARROLLO: 3-5 párrafos cortos separados por línea en blanco. Ve al punto rápido. Puedes usar una lista corta (3-4 puntos con →) si la idea lo pide, pero no la fuerces. Nada de emojis decorativos — si usas alguno, que sea funcional (máximo 2 en todo el post).

3. CIERRE: una pregunta abierta que invite a debatir, reflexionar o compartir experiencia. Que sea específica, no genérica del tipo "¿qué opináis?".

Máximo 200 palabras en total. Sin hashtags o máximo 2 muy relevantes al final.
Idioma: español siempre.
Responde ÚNICAMENTE con el post. Sin títulos, sin explicaciones, sin comentarios tuyos.`,

  twitter: `Eres un escritor de Twitter/X en español con criterio editorial. Sabes que en esta red solo sobrevive lo que engancha en la primera línea y aporta algo real: una idea, una tensión, un punto de vista que la gente quiera contestar o compartir.

Escribe UN ÚNICO tweet siguiendo estas reglas:

1. PRIMERA LÍNEA: el gancho. Tiene que ser tan bueno que alguien lo retwittee solo por esa línea. Puede ser una afirmación directa, una contradicción, una pregunta incómoda o un dato concreto. Sin relleno inicial.

2. DESARROLLO (opcional, si el tweet es largo): 1-2 líneas que expandan o maticen el gancho. Solo si añaden valor — si el gancho se sostiene solo, mejor dejarlo así.

3. REMATE: la última línea debe dejar una tensión abierta, una pregunta implícita o explícita, o una frase que invite a responder.

Límite duro: máximo 280 caracteres en total. Cuenta antes de responder y ajusta.
Sin hashtags salvo que encajen de forma completamente natural y no ocupen espacio valioso.
Idioma: español siempre.
Responde ÚNICAMENTE con el tweet. Sin etiquetas, sin explicaciones, sin comentarios tuyos.`,
};

// ─── Prompts: generar ideas de contenido ─────────────────────────────────────

const IDEAS_PROMPTS = {
  instagram: `Eres un creador de contenido experto en Instagram para negocios pequeños y personales. El usuario te dará una descripción breve de su negocio (puede ser solo unas pocas palabras, como "soy pastelera" o "tengo una tienda de ropa").

Tu tarea: escribe 5 posts de Instagram COMPLETOS y LISTOS PARA PUBLICAR para ese negocio. Cada post es el texto final, tal cual se publicaría — no un título, no un resumen, no una descripción de lo que podría decir el post. El texto real.

Varía los enfoques: historia personal del negocio, consejo útil del sector, destacar un producto o servicio, mostrar el proceso o detrás de las cámaras, pregunta de engagement.

Cada post: gancho fuerte en la primera línea (sin emoji), cuerpo de 3-4 párrafos cortos en primera persona, cierre con pregunta genuina, 5-7 hashtags al final. Usa 3-5 emojis con criterio. Máximo 150 palabras por post sin contar hashtags.

Escribe en español. Adapta el tono y vocabulario al tipo de negocio.

FORMATO: separa cada post con una línea que contenga únicamente: ---FIN---
Sin numeración, sin títulos, sin explicaciones previas. Solo los 5 posts separados por ---FIN---`,

  linkedin: `Eres un experto en contenido profesional para LinkedIn. El usuario te dará una descripción breve de su negocio o sector (puede ser solo unas pocas palabras, como "soy coach ejecutivo" o "tengo una agencia de diseño").

Tu tarea: escribe 5 posts de LinkedIn COMPLETOS y LISTOS PARA PUBLICAR para ese negocio. Cada post es el texto final, tal cual se publicaría — no un título, no un resumen, no una descripción de lo que podría decir el post. El texto real.

Varía los enfoques: reflexión del sector con perspectiva propia, historia personal o anécdota, lista práctica con →, observación sobre una tendencia, pregunta que genere debate profesional.

Cada post: gancho contundente en la primera línea (sin emoji, sin "Hoy quiero hablaros de…"), párrafos cortos, cierre con pregunta específica. Máximo 200 palabras. Sin emojis decorativos (máximo 2 funcionales). Sin hashtags o máximo 2 al final.

Escribe en español. Tono humano y directo, nunca corporativo.

FORMATO: separa cada post con una línea que contenga únicamente: ---FIN---
Sin numeración, sin títulos, sin explicaciones previas. Solo los 5 posts separados por ---FIN---`,

  twitter: `Eres un escritor de Twitter/X con criterio editorial. El usuario te dará una descripción breve de su negocio o sector (puede ser solo unas pocas palabras, como "soy fotógrafa de bodas" o "vendo café de especialidad").

Tu tarea: escribe 5 tweets COMPLETOS y LISTOS PARA PUBLICAR para ese negocio. Cada tweet es el texto final, tal cual se publicaría — no un título, no un resumen, no una descripción. El texto real del tweet.

Varía los enfoques: afirmación provocadora del sector, consejo concreto, pregunta que genere debate, momento relatable para clientes, dato o reflexión que invite a retuitear.

Cada tweet: máximo 280 caracteres, gancho fuerte en la primera línea, remate que invite a responder. Sin hashtags salvo que encajen de forma natural.

Escribe en español.

FORMATO: separa cada tweet con una línea que contenga únicamente: ---FIN---
Sin numeración, sin títulos, sin explicaciones previas. Solo los 5 tweets separados por ---FIN---`,
};

// ─── Shared ───────────────────────────────────────────────────────────────────

const META = {
  instagram: 'Instagram 📸',
  linkedin:  'LinkedIn 💼',
  twitter:   'Twitter / X 𝕏',
};

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let type, platform, content;
  try {
    ({ type = 'adapt', platform, content } = JSON.parse(event.body ?? '{}'));
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!['adapt', 'ideas'].includes(type)) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Tipo de solicitud no válido' }) };
  }

  if (!platform || !(type === 'adapt' ? PROMPTS : IDEAS_PROMPTS)[platform]) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Plataforma no válida' }) };
  }

  if (!content || (type === 'adapt' && content.trim().length < 30)) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: type === 'adapt' ? 'Contenido demasiado corto' : 'Describe tu negocio para continuar' }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'API key no configurada en el servidor' }) };
  }

  const systemPrompt = type === 'adapt' ? PROMPTS[platform] : IDEAS_PROMPTS[platform];
  const userMessage  = type === 'adapt'
    ? `Adapta el siguiente contenido para ${META[platform]}:\n\n${content.trim()}`
    : `Genera 5 ideas de posts para ${META[platform]}. Mi negocio: ${content.trim()}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: type === 'ideas' ? 2048 : 512,
        system:     systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `Error de API (${res.status})`;
      return { statusCode: res.status, headers: HEADERS, body: JSON.stringify({ error: msg }) };
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? '';

    if (!text) {
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Respuesta vacía de la API' }) };
    }

    if (type === 'ideas') {
      const ideas = text
        .split('---FIN---')
        .map(s => s.trim())
        .filter(Boolean);

      if (ideas.length === 0) {
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'No se pudieron parsear las ideas' }) };
      }

      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ideas }) };
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ text }) };

  } catch (e) {
    console.error('generate function error:', e);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
