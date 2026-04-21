function getApiUrl(): string {
  // Si estamos en el navegador (cliente)
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    
    // Si hay una variable global configurada (útil para Render)
    const apiFromEnv = (window as any).__API_URL;
    if (apiFromEnv) {
      return apiFromEnv;
    }
    
    // En Render, si el frontend es pts-track.onrender.com y el backend es pts-api.onrender.com
    // Reemplazamos el hostname para apuntar al backend
    if (hostname.includes('onrender.com')) {
      const backendHost = hostname.replace('pts-web', 'pts-api').replace('pts-track', 'pts-api');
      return `${protocol}//` + backendHost + '/api';
    }
    
    // En desarrollo local, intenta /api (posible proxy)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // Fallback: usa /api como ruta relativa
    return '/api';
  }
  
  // Fallback para SSR o desarrollo
  return 'http://localhost:5000/api';
}

export const environment = {
  production: true,
  apiUrl: getApiUrl()
};
 