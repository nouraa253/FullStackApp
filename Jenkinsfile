pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "nouraa253"
        BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
        NEXUS_URL       = '3.120.180.224:8081'
        NEXUS_BACKEND = 'backend'
        NEXUS_FRONTEND = 'frontend'
    }

    stages {

     stage('Build & test'){
        parallel {
        stage('Build & Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'node -v && npm -v'
                    sh 'npm ci'
                    sh 'xvfb-run -a npx ng test --watch=false --browsers=ChromeHeadless'
                    sh 'npm run build'
                }
            }
        }

        stage('Build & Test Backend') {
            environment {
                SPRING_PROFILES_ACTIVE = 'test-no-db'
            }
              steps {
                dir('demo'){
                sh 'mvn clean package -DskipTests=true'
                sh 'mvn test'
                }
            }
        }
       }
     }
        
    // 3. تحليل الكود للباك إند باستخدام SonarQube
    stage('SonarQube Backend Analysis') {
        steps {
            withSonarQubeEnv('sonar-backend') {
                // تحديد المسار الصحيح لملف pom.xml باستخدام -f
                sh 'mvn -f demo/pom.xml clean verify sonar:sonar -Dsonar.projectKey=fullstack-backend'
            }
             timeout(time: 15, unit: 'MINUTES') {
               waitForQualityGate abortPipeline: true
        }
    }
    }

    // 4. تحليل الكود للفرونت إند باستخدام SonarQube
stage('SonarQube Frontend Analysis') {
      steps {
        withSonarQubeEnv('sonar-frontend') {
          script {
            def scannerHome = tool 'sonar-scanner'
            dir('frontend') {
              sh """
                ${scannerHome}/bin/sonar-scanner \
                  -Dsonar.projectKey=fullstack-frontend \
                  -Dsonar.sources=. \
                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
              """
            }
            timeout(time: 15, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true         
            }
        }
      }
    }
}


    // 7. رفع الباك إند إلى Nexus
    stage('Upload Backend to Nexus') {
        steps {
          dir('demo') {
            nexusArtifactUploader artifacts: [
                [
                    artifactId: 'numeric',
                    classifier: '', 
                    file: 'target/numeric-${BUILD_NUMBER}.jar',  // تأكد من تحديث المسار ليطابق البناء
                    type: 'jar'
                ]
            ],     
            credentialsId: 'Nexus', 
            groupId: 'com.devops',
            nexusUrl: "${NEXUS_URL}",
            nexusVersion: 'nexus3',
            protocol: 'http',
            repository: 'backend',
            version: "${BUILD_NUMBER}"
          }
        }
    }

    // 8. رفع الفرونت إند إلى Nexus
    stage('Upload Frontend to Nexus') {
        steps {
          dir('demo') {
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
            nexusUrl: "${NEXUS_URL}",
            nexusVersion: 'nexus3',
            protocol: 'http',
            repository: 'frontend',
            version: "${BUILD_NUMBER}"
          }
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
