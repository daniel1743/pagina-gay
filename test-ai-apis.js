/**
 * TEST: Verificar que las 3 APIs de IA funcionan correctamente
 */

import dotenv from 'dotenv';
dotenv.config();

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    apiKey: process.env.VITE_OPENAI_API_KEY,
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    apiKey: process.env.VITE_QWEN_API_KEY,
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen2.5-7b-instruct'
  },
  deepseek: {
    name: 'DeepSeek',
    apiKey: process.env.VITE_DEEPSEEK_API_KEY,
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
};

const testProvider = async (providerKey, provider) => {
  console.log(`\n🧪 Probando ${provider.name}...`);

  if (!provider.apiKey) {
    console.log(`   ❌ API Key no configurada`);
    return false;
  }

  console.log(`   🔑 API Key: ${provider.apiKey.substring(0, 20)}...`);

  try {
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente amigable. Responde en una frase corta.'
          },
          {
            role: 'user',
            content: 'Hola, di algo divertido en una frase.'
          }
        ],
        temperature: 0.9,
        max_tokens: 50
      })
    });

    console.log(`   📡 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
      return false;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content || 'Sin respuesta';

    console.log(`   ✅ Respuesta: "${message}"`);
    return true;

  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🧪 TEST DE APIs DE IA                            ║
╠════════════════════════════════════════════════════════════╣
║ Proveedores: OpenAI, Qwen, DeepSeek                       ║
║ Objetivo: Verificar que las API keys funcionan            ║
╚════════════════════════════════════════════════════════════╝
  `);

  const results = {};

  for (const [key, provider] of Object.entries(PROVIDERS)) {
    results[key] = await testProvider(key, provider);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }

  console.log(`\n
╔════════════════════════════════════════════════════════════╗
║                   📊 RESULTADOS                            ║
╠════════════════════════════════════════════════════════════╣
║ OpenAI:    ${results.openai ? '✅ FUNCIONAL' : '❌ NO FUNCIONA'}                                    ║
║ Qwen:      ${results.qwen ? '✅ FUNCIONAL' : '❌ NO FUNCIONA'}                                    ║
║ DeepSeek:  ${results.deepseek ? '✅ FUNCIONAL' : '❌ NO FUNCIONA'}                                    ║
╠════════════════════════════════════════════════════════════╣
║ Sistema:   ${Object.values(results).some(r => r) ? '✅ AL MENOS 1 API FUNCIONA' : '❌ NINGUNA API FUNCIONA'}              ║
╚════════════════════════════════════════════════════════════╝
  `);

  const anyWorking = Object.values(results).some(r => r);
  process.exit(anyWorking ? 0 : 1);
};

runTests().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
