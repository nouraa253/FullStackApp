pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    NEXUS_URL       = '3.120.180.224:8081'
    NEXUS_BACKEND   = 'backend'
    NEXUS_FRONTEND  = 'frontend'

    // مستلمي الإشعارات
    NOTIFY_TO = 'dev-team@example.com, qa@example.com'
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

    // 3. تحليل الكود للباك إند باستخدام SonarQube
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

    // 8. رفع الفرونت إند إلى Nexus
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

    // 9. بناء الحاويات Docker
    stage('Docker Build') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
        }
      }
    }

    // 10. دفع الحاويات Docker باستخدام Ansible
    stage('Docker Push using Ansible') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
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

  // تنبيهات الإيميل
  post {
    success {
      emailext(
        to: "${env.NOTIFY_TO}",
        subject: "✅ SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """Build succeeded.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Branch: ${env.BRANCH_NAME}
URL: ${env.BUILD_URL}

Changes:
${CHANGES, format="%a: %m %r%n  - %d", showPaths=true, pathFormat="  * %p"}
"""
      )
    }
    failure {
      emailext(
        to: "${env.NOTIFY_TO}",
        subject: "❌ FAILURE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """Build failed.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Stage likely failed before/at: ${env.STAGE_NAME}
URL: ${env.BUILD_URL}

Last 100 lines of log are attached.
""",
        attachmentsPattern: '**/target/surefire-reports/*.txt',
        compressLog: true,
        attachLog: true,
        maxAttachmentSize: 10
      )
    }
    unstable {
      emailext(
        to: "${env.NOTIFY_TO}",
        subject: "⚠️ UNSTABLE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """Build is UNSTABLE (tests or quality gate issues).

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
URL: ${env.BUILD_URL}
"""
      )
    }
    aborted {
      emailext(
        to: "${env.NOTIFY_TO}",
        subject: "⏹ ABORTED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: """Build aborted.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
URL: ${env.BUILD_URL}
"""
      )
    }
    always {
      // مثال على تنبيه مختصر دائمًا (اختياري)
      echo "Email notification evaluated."
    }
  }
}
