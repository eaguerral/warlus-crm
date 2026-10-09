export const SERVICIOS = ['auth', 'catalogo', 'pedidos', 'pagos']

export async function apiFetch(servicio, path = '/', options = {}) {
  const response = await fetch(`/api/${servicio}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`${servicio} respondio ${response.status}`)
  }

  return response.json()
}

export const getHealth = (servicio) => apiFetch(servicio, '/health')
