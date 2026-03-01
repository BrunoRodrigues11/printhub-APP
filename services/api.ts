const BASE_URL = 'http://localhost:3001/api';

export async function apiFetch(endpoint: string, method: string = 'GET', body: any = null) {
  // 1. Tenta pegar o token que foi salvo no localStorage durante o login
  const token = localStorage.getItem('token');
  
  // 2. Configura os cabeçalhos (Headers) padrão
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 3. Se o token existir, injeta ele no cabeçalho de Autorização
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Monta a configuração da requisição
  const config: RequestInit = {
    method,
    headers,
  };

  // Se for POST ou PUT, adiciona o corpo (body) convertido para texto
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // Verifica se a resposta é JSON antes de tentar fazer o parse
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      // BÔNUS DE SEGURANÇA: Se a API retornar 401 (Token inválido ou expirado)
      // nós "limpamos" o front-end e forçamos o usuário de volta pro login
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Redireciona para a página de login
      }
      
      throw new Error(data?.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    console.error(`Erro na chamada ${method} ${endpoint}:`, error);
    throw error; // Repassa o erro para o componente React tratar (ex: mostrar no banner vermelho)
  }
}