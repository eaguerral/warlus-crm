from fastapi import FastAPI

app = FastAPI(
    title="Warlus CRM - Pagos Service",
    description="Microservicio de gestion de pagos de Warlus CRM",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Microservicio de pagos Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "pagos",
        "status": "OK"
    }
