pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "docker.io/nouraa253"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/demo-backend:latest"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/demo-frontend:latest"
    }

      stages {
        stage('Build') {
            steps {
                script {
                    try {
                        sh 'mvn clean package -DskipTests=true'
                        env.STAGE_BUILD = "SUCCESS"
                    } catch (err) {
                        env.STAGE_BUILD = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    try {
                        sh 'mvn test'
                        env.STAGE_TEST = "SUCCESS"
                    } catch (err) {
                        env.STAGE_TEST = "FAILURE"
                        throw err
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i inventory.ini Build.yml \
                    """
                }
            }
        }

        stage('Docker Push using Ansible') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i inventory.ini Push.yml \
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'ansible-playbook -i inventory.ini deploy.yml'
            }
        }
    }
}
