pipeline {
  agent any

  environment {
    DOCKER_REGISTRY = "nouraa253"
    BACKEND_IMAGE   = "nouraa253/demo-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE  = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    NEXUS_URL       = '3.120.180.224:8081'
    NEXUS_BACKEND   = 'backend'
    NEXUS_FRONTEND  = 'frontend'

    // قيم مبدئية لحالات الستيدجات (للتقرير)
    STAGE_FE_BUILD  = 'NOT_RUN'
    STAGE_BE_BUILD  = 'NOT_RUN'
    STAGE_SONAR_BE  = 'NOT_RUN'
    STAGE_QG_BE     = 'NOT_RUN'
    STAGE_SONAR_FE  = 'NOT_RUN'
    STAGE_QG_FE     = 'NOT_RUN'
    STAGE_NEXUS_BE  = 'NOT_RUN'
    STAGE_NEXUS_FE  = 'NOT_RUN'
    STAGE_DOCKER_B  = 'NOT_RUN'
    STAGE_DOCKER_P  = 'NOT_RUN'
    STAGE_DEPLOY    = 'NOT_RUN'
  }

  stages {

    stage('Build & test') {
      parallel {

        stage('Build & Test Frontend') {
          steps {
            script {
              try {
                dir('frontend') {
                  sh 'node -v && npm -v'
                  sh 'npm ci'
                  sh 'xvfb-run -a npx ng test --watch=false --browsers=ChromeHeadless'
                  sh 'npm run build'
                }
                env.STAGE_FE_BUILD = 'SUCCESS'
              } catch (err) {
                env.STAGE_FE_BUILD = 'FAILURE'
                throw err
              }
            }
          }
        }

        stage('Build & Test Backend') {
          environment {
            SPRING_PROFILES_ACTIVE = 'test-no-db'
          }
          steps {
            script {
              try {
                dir('demo') {
                  sh 'mvn clean package -DskipTests=true'
                  sh 'mvn test'
                }
                env.STAGE_BE_BUILD = 'SUCCESS'
              } catch (err) {
                env.STAGE_BE_BUILD = 'FAILURE'
                throw err
              }
            }
          }
        }

      }
    }

    // 3) SonarQube Backend
    stage('SonarQube Backend Analysis') {
      steps {
        script {
          try {
            withSonarQubeEnv('sonar-backend') {
              sh 'mvn -f demo/pom.xml clean verify sonar:sonar -Dsonar.projectKey=fullstack-backend'
            }
            env.STAGE_SONAR_BE = 'SUCCESS'
          } catch (err) {
            env.STAGE_SONAR_BE = 'FAILURE'
            throw err
          }
        }
      }
    }

    stage('Quality Gate Backend') {
      steps {
        script {
          try {
            timeout(time: 15, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true
            }
            env.STAGE_QG_BE = 'SUCCESS'
          } catch (err) {
            env.STAGE_QG_BE = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 4) SonarQube Frontend
    stage('SonarQube Frontend Analysis') {
      steps {
        script {
          try {
            withSonarQubeEnv('sonar-frontend') {
              def scannerHome = tool 'sonar-scanner'  // لازم تكون مضافة كـ Global Tool
              dir('frontend') {
                sh """
                  ${scannerHome}/bin/sonar-scanner \
                    -Dsonar.projectKey=fullstack-frontend \
                    -Dsonar.sources=. \
                    -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                """
              }
            }
            env.STAGE_SONAR_FE = 'SUCCESS'
          } catch (err) {
            env.STAGE_SONAR_FE = 'FAILURE'
            throw err
          }
        }
      }
    }

    stage('Quality Gate Frontend') {
      steps {
        script {
          try {
            timeout(time: 15, unit: 'MINUTES') {
              waitForQualityGate abortPipeline: true
            }
            env.STAGE_QG_FE = 'SUCCESS'
          } catch (err) {
            env.STAGE_QG_FE = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 7) Upload Backend to Nexus
    stage('Upload Backend to Nexus') {
      steps {
        script {
          try {
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
              repository: "${NEXUS_BACKEND}",
              version: "${BUILD_NUMBER}"
            }
            env.STAGE_NEXUS_BE = 'SUCCESS'
          } catch (err) {
            env.STAGE_NEXUS_BE = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 8) Upload Frontend to Nexus
    stage('Upload Frontend to Nexus') {
      steps {
        script {
          try {
            dir('frontend') {
              // ينشئ أرشيف من محتويات dist
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
              repository: "${NEXUS_FRONTEND}",
              version: "${BUILD_NUMBER}"
            }
            env.STAGE_NEXUS_FE = 'SUCCESS'
          } catch (err) {
            env.STAGE_NEXUS_FE = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 9) Docker Build
    stage('Docker Build') {
      steps {
        script {
          try {
            withCredentials([usernamePassword(
              credentialsId: 'docker',
              usernameVariable: 'DOCKER_USERNAME',
              passwordVariable: 'DOCKER_PASSWORD'
            )]) {
              sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
            }
            env.STAGE_DOCKER_B = 'SUCCESS'
          } catch (err) {
            env.STAGE_DOCKER_B = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 10) Docker Push
    stage('Docker Push using Ansible') {
      steps {
        script {
          try {
            withCredentials([usernamePassword(
              credentialsId: 'docker',
              usernameVariable: 'DOCKER_USERNAME',
              passwordVariable: 'DOCKER_PASSWORD'
            )]) {
              sh 'ansible-playbook -i ansible/inventory.ini ansible/push.yml'
            }
            env.STAGE_DOCKER_P = 'SUCCESS'
          } catch (err) {
            env.STAGE_DOCKER_P = 'FAILURE'
            throw err
          }
        }
      }
    }

    // 11) Deploy
    stage('Deploy to Kubernetes') {
      steps {
        script {
          try {
            sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
            env.STAGE_DEPLOY = 'SUCCESS'
          } catch (err) {
            env.STAGE_DEPLOY = 'FAILURE'
            throw err
          }
        }
      }
    }
  } // end stages

  post {
    always {
      script {
        def jobName = env.JOB_NAME
        def buildNumber = env.BUILD_NUMBER
        def pipelineStatus = currentBuild.currentResult
        def pipelineStatusUpper = pipelineStatus.toUpperCase()
        def bannerColor = pipelineStatusUpper == 'SUCCESS' ? 'green' : 'red'

        def row = { name, val ->
          return "<tr><td>${name}</td><td style='color:${val=="SUCCESS"?"green":(val=="FAILURE"?"red":"#999")}'>${val}</td></tr>"
        }

        def stageTable = """
          <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>
            <tr><th>Stage</th><th>Status</th></tr>
            ${row('FE Build & Test', env.STAGE_FE_BUILD)}
            ${row('BE Build & Test', env.STAGE_BE_BUILD)}
            ${row('Sonar BE',       env.STAGE_SONAR_BE)}
            ${row('Quality Gate BE',env.STAGE_QG_BE)}
            ${row('Sonar FE',       env.STAGE_SONAR_FE)}
            ${row('Quality Gate FE',env.STAGE_QG_FE)}
            ${row('Upload BE Nexus',env.STAGE_NEXUS_BE)}
            ${row('Upload FE Nexus',env.STAGE_NEXUS_FE)}
            ${row('Docker Build',   env.STAGE_DOCKER_B)}
            ${row('Docker Push',    env.STAGE_DOCKER_P)}
            ${row('Deploy',         env.STAGE_DEPLOY)}
          </table>
        """

        def body = """<html>
          <body>
            <div style="border: 4px solid ${bannerColor}; padding: 10px;">
              <h2>${jobName} - Build ${buildNumber}</h2>
              <div style="background-color: ${bannerColor}; padding: 10px;">
                <h3 style="color: white;">Pipeline Status: ${pipelineStatusUpper}</h3>
              </div>
              <p>Check the <a href="${env.BUILD_URL}">console output</a>.</p>
              <h3>Stage Summary</h3>
              ${stageTable}
            </div>
          </body>
        </html>"""

        emailext(
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
