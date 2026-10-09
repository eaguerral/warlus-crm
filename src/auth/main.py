from fastapi import FastAPI

app = FastAPI(
    title="Warlus CRM - Auth Service",
    description="Microservicio de autenticacion y autorizacion de Warlus CRM",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Microservicio de autenticacion Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "auth",
        "status": "OK"
    }
