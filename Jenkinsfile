pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'grupo14/backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Lint') {
            steps {
                dir('backend') {
                    sh 'npm lint'
                }
            }
        }

        stage('Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ./backend"
            }
        }

        /*
        stage('SAST - Security Analysis') {
            steps {
                echo 'TODO: integrar SonarQube o Semgrep'
                sh 'semgrep --config=auto backend/'
            }
        }
        */
    }

    post {
        always {
            echo "Pipeline finalizado con estado: ${currentBuild.currentResult}"
        }
        success {
            echo 'Build exitoso'
        }
        failure {
            echo 'Build fallido'
        }
    }
}
