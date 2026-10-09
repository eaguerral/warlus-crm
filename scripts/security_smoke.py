import json
import os
import time
import urllib.error
import urllib.request
from uuid import uuid4


AUTH = os.getenv("AUTH_BASE_URL", "http://localhost:8081")
CATALOGO = os.getenv("CATALOGO_BASE_URL", "http://localhost:8082")
PEDIDOS = os.getenv("PEDIDOS_BASE_URL", "http://localhost:8083")
PAGOS = os.getenv("PAGOS_BASE_URL", "http://localhost:8084")
def request(method, url, body=None, token=None, expected=None):
    headers = {
        "Content-Type": "application/json",
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = (
        json.dumps(body).encode("utf-8")
        if body is not None
        else None
    )

    req = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            raw = response.read().decode("utf-8")
            payload = json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        status = exc.code
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw

    if expected is not None and status != expected:
        raise AssertionError(
            f"{method} {url}: esperado {expected}, recibido {status}: {payload}"
        )

    return status, payload


def wait_health(url):
    for _ in range(30):
        try:
            status, _ = request("GET", f"{url}/health")
            if status == 200:
                return
        except Exception:
            pass

        time.sleep(2)

    raise RuntimeError(f"Servicio no disponible: {url}")


for service in (AUTH, CATALOGO, PEDIDOS, PAGOS):
    wait_health(service)


suffix = uuid4().hex[:10]
email_a = f"security.a.{suffix}@example.com"
email_b = f"security.b.{suffix}@example.com"
password = "Warlus2026!Segura"


for email in (email_a, email_b):
    request(
        "POST",
        f"{AUTH}/register",
        {
            "email": email,
            "password": password,
        },
        expected=201,
    )


def login(email):
    _, body = request(
        "POST",
        f"{AUTH}/login",
        {
            "email": email,
            "password": password,
        },
        expected=200,
    )

    return body["access_token"]


token_a = login(email_a)
token_b = login(email_b)


# Sin token no se puede acceder a informacion de negocio.
request(
    "GET",
    f"{PEDIDOS}/pedidos",
    expected=401,
)

request(
    "GET",
    f"{PAGOS}/pagos",
    expected=401,
)


# Obtener resumen global antes de crear registros de A.
_, before = request(
    "GET",
    f"{PEDIDOS}/pedidos/resumen/global",
    token=token_b,
    expected=200,
)


# A crea servicio privado.
_, service_a = request(
    "POST",
    f"{CATALOGO}/servicios",
    {
        "nombre": f"Servicio privado {suffix}",
        "descripcion": "Prueba automatizada de aislamiento",
        "precio": 999.00,
        "activo": True,
    },
    token=token_a,
    expected=201,
)

service_id = service_a["id"]


# A crea pedido.
_, order_a = request(
    "POST",
    f"{PEDIDOS}/pedidos",
    {
        "cliente": "Cliente privado A",
        "servicio_id": service_id,
        "estado": "pendiente",
    },
    token=token_a,
    expected=201,
)

order_id = order_a["id"]


# A crea pago.
_, payment_a = request(
    "POST",
    f"{PAGOS}/pagos",
    {
        "pedido_id": order_id,
        "monto": 999.00,
        "metodo": "Tarjeta",
        "estado": "completado",
    },
    token=token_a,
    expected=201,
)

payment_id = payment_a["id"]


# A ve su pedido.
_, orders_a = request(
    "GET",
    f"{PEDIDOS}/pedidos",
    token=token_a,
    expected=200,
)

assert any(
    item["id"] == order_id
    for item in orders_a
), "Usuario A no puede ver su propio pedido"


# B NO puede ver pedido de A.
_, orders_b = request(
    "GET",
    f"{PEDIDOS}/pedidos",
    token=token_b,
    expected=200,
)

assert all(
    item["id"] != order_id
    for item in orders_b
), "FUGA: usuario B vio pedido de usuario A"


# B NO puede editar pedido de A.
request(
    "PUT",
    f"{PEDIDOS}/pedidos/{order_id}",
    {
        "cliente": "Intento indebido",
        "servicio_id": service_id,
        "estado": "completado",
    },
    token=token_b,
    expected=404,
)


# B NO puede usar servicio privado de A.
request(
    "POST",
    f"{PEDIDOS}/pedidos",
    {
        "cliente": "Intento servicio ajeno",
        "servicio_id": service_id,
        "estado": "pendiente",
    },
    token=token_b,
    expected=404,
)


# El resumen global SI debe sumar el pedido de A.
_, after = request(
    "GET",
    f"{PEDIDOS}/pedidos/resumen/global",
    token=token_b,
    expected=200,
)

assert after["total"] == before["total"] + 1, (
    "El dashboard global no esta incluyendo todos los registros del CRM"
)


# El resumen global NO puede filtrar PII.
_, summary_payments = request(
    "GET",
    f"{PAGOS}/pagos/resumen/global",
    token=token_b,
    expected=200,
)

serialized = json.dumps(
    {
        "orders": after,
        "payments": summary_payments,
    },
    ensure_ascii=False,
)

for forbidden in (
    "Cliente privado A",
    email_a,
    email_b,
):
    assert forbidden not in serialized, (
        f"FUGA: resumen global contiene PII: {forbidden}"
    )


# Limpieza del negocio de prueba.
request(
    "DELETE",
    f"{PAGOS}/pagos/{payment_id}",
    token=token_a,
    expected=200,
)

request(
    "DELETE",
    f"{PEDIDOS}/pedidos/{order_id}",
    token=token_a,
    expected=200,
)

request(
    "DELETE",
    f"{CATALOGO}/servicios/{service_id}",
    token=token_a,
    expected=200,
)


print("SECURITY_SMOKE_OK")
print("AISLAMIENTO_USUARIOS_OK")
print("DASHBOARD_GLOBAL_TODO_CRM_OK")
print("RESUMEN_SIN_PII_OK")
print(f"TEST_EMAIL_A={email_a}")
print(f"TEST_EMAIL_B={email_b}")