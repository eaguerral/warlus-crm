from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_health_http_200():
    response = client.get("/health")

    assert response.status_code == 200


def test_health_content():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["service"] == "auth"
    assert response.json()["status"] == "OK"


def test_root_http_200():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Microservicio de autenticacion Warlus CRM"


def test_health_rejects_post():
    response = client.post("/health")

    assert response.status_code == 405


def test_health_basic_performance():
    import time

    start = time.perf_counter()

    for _ in range(20):
        response = client.get("/health")
        assert response.status_code == 200

    elapsed = time.perf_counter() - start
    average = elapsed / 20

    assert average < 1.0