import os

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


APP_ENV = os.getenv("APP_ENV", "development").lower()
JWT_ISSUER = os.getenv("JWT_ISSUER", "warlus-crm")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "warlus-crm-web")
JWT_ALGORITHM = "HS256"

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

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacion requerida",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            options={
                "require": ["sub", "exp", "iat", "iss", "aud"],
            },
        )

        user_id = int(payload["sub"])

        if user_id <= 0:
            raise ValueError("sub invalido")

    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o vencido",
        )

    return {
        "id": user_id,
        "email": str(payload.get("email", "")),
    }