import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


ROOT_DIR = Path(__file__).resolve().parents[2]
AUTH_DIR = ROOT_DIR / "src" / "auth"

BASE_URL = "http://127.0.0.1:8091"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


@pytest.fixture(scope="module", autouse=True)
def auth_server():
    creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8091",
        ],
        cwd=AUTH_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creation_flags,
    )

    started = False

    for _ in range(30):
        try:
            with urllib.request.urlopen(
                f"{BASE_URL}/health",
                timeout=2
            ) as response:
                if response.status == 200:
                    started = True
                    break
        except Exception:
            time.sleep(1)

    if not started:
        process.terminate()
        raise RuntimeError(
            "El microservicio auth no pudo iniciar para las pruebas Selenium."
        )

    yield

    process.terminate()

    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()


@pytest.fixture
def driver():
    options = Options()

    options.binary_location = CHROME_PATH
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")

    browser = webdriver.Chrome(options=options)

    yield browser

    browser.quit()


def test_auth_swagger_ui_loads(driver):
    driver.get(f"{BASE_URL}/docs")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    assert "Swagger UI" in driver.title


def test_auth_health_browser(driver):
    driver.get(f"{BASE_URL}/health")

    body = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    ).text

    assert "auth" in body
    assert "OK" in body