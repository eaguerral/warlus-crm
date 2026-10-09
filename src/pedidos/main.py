from fastapi import FastAPI

app = FastAPI(
    title="Warlus CRM - Pedidos Service",
    description="Microservicio de gestion de pedidos de Warlus CRM",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Microservicio de pedidos Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "pedidos",
        "status": "OK"
    }
