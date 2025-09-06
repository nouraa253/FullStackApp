pipeline {
    agent any

    environment {
        DOCKER_USER = credentials('docker-username')   // خزّن بياناتك بـ Jenkins Credentials
        DOCKER_PASS = credentials('docker-password')
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
        
        stage('Build with Ansible') {
            steps {
                ansiblePlaybook credentialsId: 'ansible-ssh', playbook: 'ansible/build.yml'
            }
        }

        stage('Push Images with Ansible') {
            steps {
                ansiblePlaybook credentialsId: 'ansible-ssh', playbook: 'ansible/push.yml'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                ansiblePlaybook credentialsId: 'ansible-ssh', playbook: 'ansible/deploy.yml'
            }
        }
    }
}
