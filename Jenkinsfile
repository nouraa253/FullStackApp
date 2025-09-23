pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    // Nexus
    NEXUS_URL   = '35.159.39.161:8081'
    NEXUS_REPO_MAVEN = 'FullStack'      // مستودع maven-hosted
    NEXUS_REPO_RAW   = 'FullStack-raw'  // مستودع raw-hosted لحزمة الفرونت (tgz)
  }

  stages {

    
    stage('SonarQube - Backend') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh '''
            mvn -f demo/pom.xml verify sonar:sonar \
              -Dsonar.projectKey=FullStack-backend \
              -Dsonar.projectName=FullStack-backend
          '''
        }
      }
    }

    stage('SonarQube - Frontend') {
      steps {
        withSonarQubeEnv('SonarQube') {
          // نستخدم sonar-scanner (نصبه مسبقًا على الوكر أو اضفه كأداة)
          sh '''
            cd frontend
            sonar-scanner \
              -Dsonar.projectKey=FullStack-frontend \
              -Dsonar.projectName=FullStack-frontend \
              -Dsonar.sources=src \
              -Dsonar.exclusions=**/node_modules/**,**/*.spec.ts
          '''
        }
      }
    }

    stage('Quality_Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
    
    stage('Quality_Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
    
    stage('Upload-to-Nexus (Backend JAR)') {
      steps {
        // تأكد من مسار الجار الصحيح (SNAPSHOT)
        nexusArtifactUploader(
          artifacts: [[
            artifactId: 'demo',
            classifier: '',
            file: 'demo/target/demo-0.0.1-SNAPSHOT.jar',
            type: 'jar'
          ]],
          credentialsId: 'Nexus',             // اسم الكريدنشل في Jenkins
          groupId: 'com.example',             // من pom.xml عندك
          nexusUrl: "${NEXUS_URL}",
          nexusVersion: 'nexus3',
          protocol: 'http',
          repository: "fullstackBackend",
          version: "0.0.1-${env.BUILD_NUMBER}"
        )
      }
    }

    stage('Upload-to-Nexus (Frontend bundle)') {
      steps {
        sh '''
          # نغلف مخرجات Angular (dist/frontend) في tgz ونرفعها كمادة raw
          tar -C frontend/dist/frontend -czf artifacts/frontend-dist-${BUILD_NUMBER}.tgz .
        '''
        nexusArtifactUploader(
          artifacts: [[
            artifactId: 'frontend-dist',
            classifier: '',
            file: "artifacts/frontend-dist-${env.BUILD_NUMBER}.tgz",
            type: 'tgz'
          ]],
          credentialsId: 'Nexus',
          groupId: 'com.example.frontend',
          nexusUrl: "${NEXUS_URL}",
          nexusVersion: 'nexus3',
          protocol: 'http',
          repository: "fullstackFrontend",
          version: "1.0.${env.BUILD_NUMBER}"
        )
      }
    }

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

    stage('Deploy to Kubernetes') {
      steps {
        sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
      }
    }
  }
}
