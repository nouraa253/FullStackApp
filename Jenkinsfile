pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
  }

  stages {

    stage('SonarQube') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'mvn -f demo/pom.xml clean verify sonar:sonar -Dsonar.projectKey=FullStack'
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

    stage('Upload-to-Nexus') {
      steps {
        nexusArtifactUploader(
          artifacts: [[
            artifactId: 'demo',
            classifier: '',
            file: 'target/demo-0.0.1.jar',
            type: 'jar'
          ]],
          credentialsId: 'Nexus',
          groupId: 'com.devops',
          nexusUrl: '35.159.39.161:8081',
          nexusVersion: 'nexus3',
          protocol: 'http',
          repository: 'FullStack',
          version: "0.0.1-${env.BUILD_NUMBER}"
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
