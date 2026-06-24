pipeline {
    agent any
    tools { nodejs 'node23' }

    environment {
        DOCKER_IMAGE = 'grupo14/backend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Verify Node') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }
        

        stage('Install dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install -g pnpm@10'
                    sh 'pnpm install --frozen-lockfile'
                }
            }
        }

        stage('Lint') {
            steps {
                dir('backend') {
                    sh 'pnpm lint'
                }
            }
        }

        stage('Test') {
            steps {
                dir('backend') {
                    sh 'pnpm test'
                }
            }
        }

        stage('Build Docker image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ./backend"
            }
        }
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
