pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    NEXUS_URL       = '18.185.109.163:8081'
    NEXUS_BACKEND   = 'backend'
    NEXUS_FRONTEND  = 'frontend'
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

    stage('SonarQube Analysis') {
      parallel {
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
      }
    }

    stage('Upload to Nexus') {
      parallel {
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
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.currentResult
                def pipelineStatusUpper = pipelineStatus.toUpperCase()
                def bannerColor = pipelineStatusUpper == 'SUCCESS' ? 'green' : 'red'

                def body = """<html>
                    <body>
                        <div style="border: 4px solid ${bannerColor}; padding: 10px;">
                            <h2>${jobName} - Build ${buildNumber}</h2>
                            <div style="background-color: ${bannerColor}; padding: 10px;">
                                <h3 style="color: white;">Pipeline Status: ${pipelineStatusUpper}</h3>
                            </div>
                            <p>Check the <a href="${env.BUILD_URL}">console output</a>.</p>
                            <p style="font-size: 16px;">The build has finished with a <strong>${pipelineStatusUpper}</strong> status.</p>

                            
                        </div>
                    </body>
                </html>"""

                emailext (
                    subject: "${jobName} - Build ${buildNumber} - ${pipelineStatusUpper}",
                    body: body,
                    to: 'noora1sultan2r@gmail.com',
                    from: 'jenkins@example.com',
                    replyTo: 'jenkins@example.com',
                    mimeType: 'text/html'
                )
            }
        }
    }
}
