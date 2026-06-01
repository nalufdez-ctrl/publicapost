const PROMPTS = {
  instagram: `Eres un experto en contenido para Instagram. Escribe posts cortos y directos.

Reglas estrictas — incumplirlas es un error:
- LÍMITE DURO: el cuerpo del post (sin hashtags) debe tener como máximo 150 palabras. Cuenta las palabras y recorta si te pasas.
- Primera línea: frase gancho sin emojis que enganche al instante.
- Tono cercano y personal. Párrafos de 1-2 frases separados por línea en blanco.
- Usa entre 3 y 5 emojis distribuidos a lo largo del texto, nunca más.
- Última línea del cuerpo: pregunta corta o llamada a la acción.
- Línea en blanco y después exactamente entre 5 y 8 hashtags relevantes.
- Responde ÚNICAMENTE con el post listo para publicar. Sin explicaciones ni comentarios.`,

  linkedin: `Eres un experto en contenido profesional para LinkedIn. Escribe posts concisos y de alto impacto.

Reglas estrictas — incumplirlas es un error:
- LÍMITE DURO: máximo 200 palabras en total. Cuenta las palabras y recorta si te pasas.
- Primera línea: gancho que haga clic en "ver más". Sin emojis en esa línea.
- Tono profesional pero humano. Párrafos de 1-2 frases con saltos de línea entre ellos.
- Cero emojis decorativos. Si usas alguno, que sea únicamente para sustituir una viñeta (máximo 2).
- Sin hashtags o máximo 2 al final, solo si son muy relevantes.
- Cierra con una pregunta breve que invite al debate.
- Responde ÚNICAMENTE con el post listo para publicar. Sin explicaciones ni comentarios.`,

  twitter: `Eres un experto en contenido para Twitter / X.

Reglas estrictas — incumplirlas es un error:
- LÍMITE DURO: un único tweet de máximo 280 caracteres. No hay hilo, no hay más de un tweet.
- Cuenta los caracteres antes de responder y ajusta hasta que quepan en 280.
- Directo al grano desde la primera palabra. Sin introducción, sin relleno.
- Incluye 1 hashtag solo si cabe de forma natural y no consume caracteres valiosos.
- Responde ÚNICAMENTE con el tweet. Sin explicaciones, sin etiquetas, sin comentarios.`,
};

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let platform, content;
  try {
    ({ platform, content } = JSON.parse(event.body ?? '{}'));
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!platform || !PROMPTS[platform]) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Plataforma no válida' }) };
  }

  if (!content || content.trim().length < 30) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Contenido demasiado corto' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'API key no configurada en el servidor' }) };
  }

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
        max_tokens: 512,
        system:     PROMPTS[platform],
        messages: [{
          role:    'user',
          content: `Adapta el siguiente contenido para ${META[platform]}:\n\n${content.trim()}`,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `Error de API (${res.status})`;
      return { statusCode: res.status, headers: HEADERS, body: JSON.stringify({ error: msg }) };
    }

    const data  = await res.json();
    const text  = data?.content?.[0]?.text ?? '';

    if (!text) {
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Respuesta vacía de la API' }) };
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ text }) };

  } catch (e) {
    console.error('generate function error:', e);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};
