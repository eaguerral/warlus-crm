import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt


APP_ENV = os.getenv("APP_ENV", "development").lower()
JWT_ISSUER = os.getenv("JWT_ISSUER", "warlus-crm")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "warlus-crm-web")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "8"))

_secret = os.getenv("JWT_SECRET", "")

if (
    APP_ENV == "production"
    and (
        len(_secret) < 32
        or _secret.startswith("replace_")
        or "change_me" in _secret.lower()
    )
):
    raise RuntimeError(
        "JWT_SECRET debe ser un secreto real de al menos 32 caracteres en produccion"
    )

JWT_SECRET = _secret or "warlus-local-development-only-secret-please-change"


def validate_password_strength(password: str) -> None:
    if len(password) < 10:
        raise ValueError("La contraseÃ±a debe tener al menos 10 caracteres")
    if not re.search(r"[A-Z]", password):
        raise ValueError("La contraseÃ±a debe incluir una mayuscula")
    if not re.search(r"[a-z]", password):
        raise ValueError("La contraseÃ±a debe incluir una minuscula")
    if not re.search(r"\d", password):
        raise ValueError("La contraseÃ±a debe incluir un numero")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("La contraseÃ±a debe incluir un caracter especial")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "email": email,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(hours=JWT_EXPIRATION_HOURS),
        "jti": str(uuid.uuid4()),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER,
        options={
            "require": ["sub", "exp", "iat", "iss", "aud"],
        },
    )