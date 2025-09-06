pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "docker.io/nouraa253"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/demo-backend:latest"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/demo-frontend:latest"
    }

      stages {

        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i inventory.ini ansible/build.yml \
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
                        ansible-playbook -i inventory.ini ansible/push.yml \
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'ansible-playbook -i inventory.ini ansible/deploy.yml'
            }
        }
    }
}
