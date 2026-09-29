pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Obteniendo codigo fuente desde GitHub - rama dev'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Validando codigo Python de Warlus CRM'

                bat 'python --version'

                bat 'python -m py_compile src\\auth\\main.py'
                bat 'python -m py_compile src\\catalogo\\main.py'
                bat 'python -m py_compile src\\pedidos\\main.py'
                bat 'python -m py_compile src\\pagos\\main.py'
            }
        }

        stage('Test') {
            steps {
                echo 'Preparando entorno automatizado de pruebas Pytest'

                bat '''
                if exist .jenkins-venv rmdir /s /q .jenkins-venv
                if exist reports rmdir /s /q reports

                mkdir reports

                python -m venv .jenkins-venv

                .jenkins-venv\\Scripts\\python.exe -m pip install --upgrade pip

                .jenkins-venv\\Scripts\\python.exe -m pip install ^
                    -r src\\auth\\requirements-test.txt ^
                    -r src\\catalogo\\requirements-test.txt ^
                    -r src\\pedidos\\requirements-test.txt ^
                    -r src\\pagos\\requirements-test.txt
                '''

                dir('src/auth') {
                    bat '..\\..\\.jenkins-venv\\Scripts\\python.exe -m pytest -v test_main.py --html=..\\..\\reports\\auth.html --self-contained-html'
                }

                dir('src/catalogo') {
                    bat '..\\..\\.jenkins-venv\\Scripts\\python.exe -m pytest -v test_main.py --html=..\\..\\reports\\catalogo.html --self-contained-html'
                }

                dir('src/pedidos') {
                    bat '..\\..\\.jenkins-venv\\Scripts\\python.exe -m pytest -v test_main.py --html=..\\..\\reports\\pedidos.html --self-contained-html'
                }

                dir('src/pagos') {
                    bat '..\\..\\.jenkins-venv\\Scripts\\python.exe -m pytest -v test_main.py --html=..\\..\\reports\\pagos.html --self-contained-html'
                }

                echo 'Ejecutando pruebas funcionales Selenium con Chrome Headless'

                bat '.jenkins-venv\\Scripts\\python.exe -m pytest -v tests\\selenium\\test_auth_selenium.py --html=reports\\selenium-auth.html --self-contained-html'
            }

            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'auth.html',
                        reportName: 'Pytest - Auth'
                    ])

                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'catalogo.html',
                        reportName: 'Pytest - Catalogo'
                    ])

                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'pedidos.html',
                        reportName: 'Pytest - Pedidos'
                    ])

                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'pagos.html',
                        reportName: 'Pytest - Pagos'
                    ])

                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'selenium-auth.html',
                        reportName: 'Selenium - Auth'
                    ])
                }
            }
        }

        stage('Deploy Staging') {
            steps {
                echo 'Etapa de despliegue a staging preparada para configuracion posterior'
            }
        }
    }

    post {
        success {
            echo 'Pipeline Warlus CRM finalizado correctamente'
        }

        failure {
            echo 'Pipeline Warlus CRM finalizo con errores'
        }
    }
}