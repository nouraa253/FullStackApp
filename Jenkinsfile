pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    NEXUS_URL       = '3.64.13.110:8081'
    NEXUS_BACKEND   = 'backend'
    NEXUS_FRONTEND  = 'frontend'
    EMAIL_RECIPIENTS = 'noora1sultan2r@gmail.com'  // Replace with actual email
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
          environment { SPRING_PROFILES_ACTIVE = 'test-no-db' }
          steps {
            dir('demo'){
              sh 'mvn clean package -DskipTests=true'
              sh 'mvn test'
            }
          }
        }
      }
    }

    stage('SonarQube Backend Analysis') {
      steps {
        withSonarQubeEnv('sonar-backend') {
          sh 'mvn -f demo/pom.xml clean verify sonar:sonar -Dsonar.projectKey=fullstack-backend'
        }
        timeout(time: 15, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

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

    stage('Upload Backend to Nexus') {
      steps {
        dir('demo') {
          nexusArtifactUploader artifacts: [[
            artifactId: 'demo',
            classifier: '',
            file: "target/demo-0.0.1-SNAPSHOT.jar",
            type: 'jar'
          ]],
          credentialsId: 'Nexus',
          groupId: 'com.example',
          nexusUrl: "${NEXUS_URL}",
          nexusVersion: 'nexus3',
          protocol: 'http',
          repository: 'backend',
          version: "${BUILD_NUMBER}"
        }
      }
    }

    stage('Upload Frontend to Nexus') {
      steps {
        dir('frontend') {
          sh 'tar -czf frontend-${BUILD_NUMBER}.tgz -C dist .'
          nexusArtifactUploader artifacts: [[
            artifactId: 'frontend',
            classifier: '',
            file: "frontend-${BUILD_NUMBER}.tgz",
            type: 'tgz'
          ]],
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

    stage('Docker Build') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
        }
      }
    }

    stage('Docker Push using Ansible') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
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

  post {
    always {
      emailext (
        subject: "Build ${currentBuild.currentResult}: ${currentBuild.fullDisplayName}",
        body: """
          Build Status: ${currentBuild.currentResult}
          Project: ${env.JOB_NAME}
          Build URL: ${env.BUILD_URL}
        """,
        to: "${EMAIL_RECIPIENTS}"
      )
    }
    success {
      emailext (
        subject: "Build Success: ${currentBuild.fullDisplayName}",
        body: """
          Build Success: ${currentBuild.fullDisplayName}
          Project: ${env.JOB_NAME}
          Build URL: ${env.BUILD_URL}
        """,
        to: "${EMAIL_RECIPIENTS}"
      )
    }
    failure {
      emailext (
        subject: "Build Failure: ${currentBuild.fullDisplayName}",
        body: """
          Build Failed: ${currentBuild.fullDisplayName}
          Project: ${env.JOB_NAME}
          Build URL: ${env.BUILD_URL}
        """,
        to: "${EMAIL_RECIPIENTS}"
      )
    }
  }
}
