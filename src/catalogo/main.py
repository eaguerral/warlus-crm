from fastapi import FastAPI

app = FastAPI(
    title="Warlus CRM - Catalogo Service",
    description="Microservicio de catalogo de Warlus CRM",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Microservicio de catalogo Warlus CRM"
    }


@app.get("/health")
def health():
    return {
        "service": "catalogo",
        "status": "OK"
    }
