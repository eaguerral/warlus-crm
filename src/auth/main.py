import os

import jwt
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Usuario
from schemas import LoginRequest, RegisterRequest
from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    validate_password_strength,
    verify_password,
)


app = FastAPI(
    title="Warlus CRM - Auth Service",
    description="Microservicio de autenticacion y autorizacion de Warlus CRM",
    version="2.0.0",
)

cors_origins = [
    item.strip()
    for item in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:4173",
    ).split(",")
    if item.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

bearer = HTTPBearer(auto_error=False)


@app.middleware("http")
async def secure_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    if request.url.path in {"/login", "/register", "/me", "/logout"}:
        response.headers["Cache-Control"] = "no-store"

    return response


@app.on_event("startup")
def on_startup():
    if os.getenv("SKIP_DB_STARTUP", "false").lower() != "true":
        Base.metadata.create_all(bind=engine)


def current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacion requerida",
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o vencido",
        )

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id == user_id,
            Usuario.activo.is_(True),
        )
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
        )

    return usuario


@app.get("/")
def root():
    return {"message": "Microservicio de autenticacion Warlus CRM"}


@app.get("/health")
def health():
    return {"service": "auth", "status": "OK"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"service": "auth", "database": "OK"}


# PUBLICO: cualquier persona puede crear una cuenta.
@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()

    try:
        validate_password_strength(data.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    if db.query(Usuario).filter(Usuario.email == email).first():
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

    try:
        db.commit()
        db.refresh(usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con este correo electronico",
        )

    return {
        "id": usuario.id,
        "email": usuario.email,
        "message": "Cuenta creada correctamente",
    }


@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.email == email,
            Usuario.activo.is_(True),
        )
        .first()
    )

    if (
        usuario is None
        or not verify_password(
            data.password,
            usuario.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseÃ±a incorrectos",
        )

    token = create_access_token(
        usuario.id,
        usuario.email,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": usuario.id,
            "email": usuario.email,
        },
    }


@app.get("/me")
def me(usuario: Usuario = Depends(current_user)):
    return {
        "id": usuario.id,
        "email": usuario.email,
        "activo": usuario.activo,
    }


@app.post("/logout")
def logout(_: Usuario = Depends(current_user)):
    return {
        "message": "Sesion cerrada correctamente"
    }