export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { system, userInput } = body;
  if (!system || !userInput) {
    return new Response(JSON.stringify({ error: 'Missing system or userInput.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userInput }]
    })
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'Anthropic error' }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const text = data.content?.find(b => b.type === 'text')?.text || '';
  return new Response(JSON.stringify({ text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = {
  path: '/api/analyze'
};
