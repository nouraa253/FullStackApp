pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "nouraa253"
        BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
        NEXUS_URL       = '3.68.158.214:8081'
        NEXUS_BACKEND = 'backend'
        NEXUS_FRONTEND = 'frontend'
    }

    stages {

        // 1. بناء واختبار الباك إند
        stage('Build & Test Backend') {
            steps {
                sh 'mvn clean package -DskipTests=true'
                sh 'mvn test'
            }
        }

        // 2. بناء واختبار الفرونت إند
        stage('Build & Test Frontend') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
                sh 'xvfb-run npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox'
            }
        }

        // 3. تحليل الكود للباك إند باستخدام SonarQube
        stage('SonarQube Backend Analysis') {
            steps {
                withSonarQubeEnv("SonarQube") {
                    sh 'mvn clean verify sonar:sonar \
                        -Dsonar.projectKey=fullstack-backend'
                }
            }
        }
      
        // 5. التحقق من بوابة الجودة (Quality Gate) للباك إند
        stage('Quality Gate Backend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
      
        // 4. تحليل الكود للفرونت إند باستخدام SonarQube
        stage('SonarQube Frontend Analysis') {
            steps {
                withSonarQubeEnv("SonarQube") {
                    sh "sonar-scanner \
                        -Dsonar.projectKey=fullstack-frontend \
                        -Dsonar.sources=."
                }
            }
        }


        // 6. التحقق من بوابة الجودة (Quality Gate) للفرونت إند
        stage('Quality Gate Frontend') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // 7. رفع الباك إند إلى Nexus
        stage('Upload Backend to Nexus') {
            steps {
                nexusArtifactUploader artifacts: [
                    [
                        artifactId: 'numeric',
                        classifier: '', 
                        file: 'target/numeric-0.0.1.jar', 
                        type: 'jar'
                    ]
                ],     
                credentialsId: 'Nexus', 
                groupId: 'com.devops',
                nexusUrl: "${NEXUS_SERVER_URL}",
                nexusVersion: 'nexus3',
                protocol: 'http',
                repository: 'backend',
                version: "0.0.1-${env.BUILD_NUMBER}"
            }
        
        }

        // 8. رفع الفرونت إند إلى Nexus
        stage('Upload Frontend to Nexus') {
            steps {
                sh 'tar -czf frontend-${BUILD_NUMBER}.tgz -C frontend/dist .'
                nexusArtifactUploader artifacts: [
                    [
                        artifactId: 'frontend',
                        classifier: '',
                        file: 'frontend/dist/frontend-${BUILD_NUMBER}.tgz',
                        type: 'tgz'
                    ]
                ],
                credentialsId: 'Nexus', 
                groupId: 'com.example.frontend',
                nexusUrl: "${NEXUS_SERVER_URL}",
                nexusVersion: 'nexus3',
                protocol: 'http',
                repository: 'frontend',
                version: "${BUILD_NUMBER}"
            }
        }

        // 9. بناء الحاويات Docker
        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
                }
            }
        }

        // 10. دفع الحاويات Docker باستخدام Ansible
        stage('Docker Push using Ansible') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh 'ansible-playbook -i ansible/inventory.ini ansible/push.yml'
                }
            }
        }

        // 11. نشر إلى Kubernetes
        stage('Deploy to Kubernetes') {
            steps {
                sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
            }
        }
    }
}
