export const SERVICIOS = ["auth", "catalogo", "pedidos", "pagos"];

const BASES = {
  auth:
    import.meta.env.VITE_AUTH_API_URL ||
    "/api/auth",

  catalogo:
    import.meta.env.VITE_CATALOGO_API_URL ||
    "/api/catalogo",

  pedidos:
    import.meta.env.VITE_PEDIDOS_API_URL ||
    "/api/pedidos",

  pagos:
    import.meta.env.VITE_PAGOS_API_URL ||
    "/api/pagos",
};


function getAccessToken() {
  try {
    const raw =
      localStorage.getItem("authUser");

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return parsed?.access_token || null;
  } catch {
    return null;
  }
}


function buildUrl(servicio, path) {
  const base = BASES[servicio];

  if (!base) {
    throw new Error(
      `Servicio API no configurado: ${servicio}`
    );
  }

  const normalizedBase =
    base.endsWith("/")
      ? base.slice(0, -1)
      : base;

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}


export async function apiFetch(
  servicio,
  path = "/",
  options = {}
) {
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
    ...options.headers,
  };

  const response = await fetch(
    buildUrl(servicio, path),
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401) {
    localStorage.removeItem("authUser");

    if (
      window.location.pathname !== "/login"
    ) {
      window.location.assign("/login");
    }

    throw new Error(
      "La sesion expiro. Inicia sesion nuevamente."
    );
  }

  if (!response.ok) {
    let detail =
      `${servicio} respondio ${response.status}`;

    try {
      const body = await response.json();

      if (body?.detail) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      // respuesta sin JSON
    }

    const error = new Error(detail);
    error.status = response.status;

    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}


export const getHealth = servicio =>
  apiFetch(servicio, "/health");