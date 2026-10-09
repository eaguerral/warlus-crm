import os

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Usuario
from schemas import LoginRequest, RegisterRequest
from security import (
    create_access_token,
    hash_password,
    verify_password,
)


app = FastAPI(
    title="Warlus CRM - Auth Service",
    description="Microservicio de autenticacion y autorizacion de Warlus CRM",
    version="1.1.0",
)


cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:4173",
    ).split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


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


@app.get("/health/db")
def health_db(
    db: Session = Depends(get_db),
):
    db.execute(text("SELECT 1"))

    return {
        "service": "auth",
        "database": "OK",
    }


@app.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    email = data.email.lower().strip()

    existing_user = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con este correo electronico",
        )

    usuario = Usuario(
        email=email,
        password_hash=hash_password(data.password),
        activo=True,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return {
        "id": usuario.id,
        "email": usuario.email,
        "message": "Cuenta creada correctamente",
    }


@app.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    email = data.email.lower().strip()

    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == email)
        .first()
    )

    if (
        usuario is None
        or not usuario.activo
        or not verify_password(
            data.password,
            usuario.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    access_token = create_access_token(
        usuario.id,
        usuario.email,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": usuario.id,
            "email": usuario.email,
        },
    }


@app.post("/logout")
def logout():
    return {
        "message": "Sesion cerrada correctamente"
    }