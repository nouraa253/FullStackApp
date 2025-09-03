pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'docker'   // ID حق الـ credentials في Jenkins
        KUBECONFIG_CREDENTIALS = 'kubeconfig' // ID لملف kubeconfig
        BACKEND_IMAGE = 'nouraa253/backend:latest'
        FRONTEND_IMAGE = 'nouraa253/frontend:latest'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'git@github.com:nouraa253/FullStackApp.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        
        stage('Docker Build & Push Backend') {
            steps {
                dir('backend') {
                    script {
                        withDockerRegistry(credentialsId: 'docker', url: '') {
                            sh """
                               docker build -t ${BACKEND_IMAGE} .
                               docker push ${BACKEND_IMAGE}
                            """
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'ng build --configuration production'
                }
            }
        }

        stage('Docker Build & Push Frontend') {
            steps {
                dir('frontend') {
                    script {
                        withDockerRegistry(credentialsId: 'docker', url: '') {
                            sh """
                               docker build -t ${FRONTEND_IMAGE} .
                               docker push ${FRONTEND_IMAGE}
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIALS}", variable: 'KUBECONFIG_FILE')]) {
                        sh """
                           export KUBECONFIG=${KUBECONFIG_FILE}
                           kubectl apply -f k8s/mysql-deployment.yaml
                           kubectl apply -f k8s/backend-deployment.yaml
                           kubectl apply -f k8s/frontend-deployment.yaml
                        """
                    }
                }
            }
        }
    }
}
