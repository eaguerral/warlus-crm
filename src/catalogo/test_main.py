from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_http_200():
    response = client.get("/health")

    assert response.status_code == 200


def test_health_content():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["service"] == "catalogo"
    assert response.json()["status"] == "OK"
