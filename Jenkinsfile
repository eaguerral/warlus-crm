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
                echo 'Etapa de pruebas preparada para Pytest y Selenium'
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