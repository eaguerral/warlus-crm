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
                echo 'Preparando despliegue real a Azure App Service Staging'

                bat '''
                if exist deploy-staging rmdir /s /q deploy-staging
                if exist warlus-auth-staging.zip del /f /q warlus-auth-staging.zip

                mkdir deploy-staging

                copy /Y src\\auth\\main.py deploy-staging\\main.py
                copy /Y src\\auth\\requirements.txt deploy-staging\\requirements.txt

                powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path 'deploy-staging\\*' -DestinationPath 'warlus-auth-staging.zip' -Force"
                '''

                timeout(time: 5, unit: 'MINUTES') {
                    withCredentials([
                        string(
                            credentialsId: 'azure-jenkins-client-id',
                            variable: 'AZ_CLIENT_ID'
                        ),
                        string(
                            credentialsId: 'azure-jenkins-client-secret',
                            variable: 'AZ_CLIENT_SECRET'
                        ),
                        string(
                            credentialsId: 'azure-jenkins-tenant-id',
                            variable: 'AZ_TENANT_ID'
                        ),
                        string(
                            credentialsId: 'azure-jenkins-subscription-id',
                            variable: 'AZ_SUBSCRIPTION_ID'
                        )
                    ]) {
                        bat '''
                        @echo off

                        set "AZURE_CONFIG_DIR=%WORKSPACE%\\.azure-jenkins-%BUILD_NUMBER%"

                        if exist "%AZURE_CONFIG_DIR%" (
                            rmdir /s /q "%AZURE_CONFIG_DIR%"
                        )

                        call "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd" login ^
                          --service-principal ^
                          --username "%AZ_CLIENT_ID%" ^
                          --password "%AZ_CLIENT_SECRET%" ^
                          --tenant "%AZ_TENANT_ID%" ^
                          --output none

                        if errorlevel 1 exit /b 1

                        call "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd" webapp deploy ^
                          --resource-group "rg-warlus-crm-dev" ^
                          --name "warlus-auth-staging-eguerral" ^
                          --subscription "%AZ_SUBSCRIPTION_ID%" ^
                          --src-path "warlus-auth-staging.zip" ^
                          --type zip ^
                          --clean true ^
                          --restart true ^
                          --track-status false ^
                          --enriched-errors true ^
                          --output none

                        if errorlevel 1 exit /b 1

                        if exist "%AZURE_CONFIG_DIR%" (
                            rmdir /s /q "%AZURE_CONFIG_DIR%"
                        )

                        echo AZURE DEPLOY SUBMITTED
                        '''
                    }
                }
                echo 'Validando endpoint publico de staging'

                bat '''
                powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $url='https://warlus-auth-staging-eguerral.azurewebsites.net/health'; $ok=$false; Start-Sleep -Seconds 20; for($i=1; $i -le 30; $i++){ try { $r=Invoke-RestMethod -Uri $url -TimeoutSec 10; if($r.service -eq 'auth' -and $r.status -eq 'OK'){ Write-Host 'STAGING HEALTH OK'; Write-Host ('service=' + $r.service); Write-Host ('status=' + $r.status); $ok=$true; break } } catch { Write-Host ('Intento ' + $i + ': staging aun no disponible') }; Start-Sleep -Seconds 10 }; if(-not $ok){ Write-Error 'Staging no respondio correctamente'; exit 1 }"
                '''
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