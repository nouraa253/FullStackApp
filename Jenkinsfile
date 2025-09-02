pipeline {
    agent any

    environment {
        IMAGE_NAME = 'nouraa253/compare-appt2025'
        CONTAINER_NAME = 'myapp'
        CONTAINER_PORT = '8083:8080'
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

        stage('SonarQube') {
            steps {
                script {
                    try {
                        withSonarQubeEnv('SonarQube') {
                            sh 'mvn clean verify sonar:sonar -Dsonar.projectKey=compare-project4'
                        }
                        env.STAGE_SONAR = "SUCCESS"
                    } catch (err) {
                        env.STAGE_SONAR = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Quality_Gate') {
            steps {
                script {
                    try {
                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                        env.STAGE_QG = "SUCCESS"
                    } catch (err) {
                        env.STAGE_QG = "FAILURE"
                        throw err
                    }
                }
            }
        }
        
        stage('Upload-to-Nexus') {
            steps {
                script {
                    try {
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
                        nexusUrl: '35.159.39.161:8081',
                        nexusVersion: 'nexus3',
                        protocol: 'http',
                        repository: 'compare-project4',
                        version: "0.0.1-${env.BUILD_NUMBER}"

                        env.STAGE_NEXUS = "SUCCESS"
                    } catch (err) {
                        env.STAGE_NEXUS = "FAILURE"
                        throw err
                    }
                }
            }
        }


       stage('Docker Build') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: 'docker',
                                usernameVariable: 'DOCKER_USERNAME',
                                passwordVariable: 'DOCKER_PASSWORD'
                            )
                        ]) {
                            script {
                                sh """
                                    ansible-playbook -i inventory.ini Build.yml \
                                        -e build_context=${WORKSPACE} \
                                """
                            }
                            env.STAGE_DOCKER_BUILD = "SUCCESS"
                        }
                    } catch (err) {
                        env.STAGE_DOCKER_BUILD = "FAILURE"
                        throw err
                    }
                }
            }
        }        
        stage('Docker Push using Ansible') {
            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: 'docker',
                                usernameVariable: 'DOCKER_USERNAME',
                                passwordVariable: 'DOCKER_PASSWORD'
                            )
                        ]) {
                            script {
                                sh """
                                    ansible-playbook -i inventory.ini Push.yml \
                                        -e build_context=${WORKSPACE} \
                                """
                            }
                            env.STAGE_DOCKER_PUSH = "SUCCESS"
                        }
                    } catch (err) {
                        env.STAGE_DOCKER_PUSH = "FAILURE"
                        throw err
                    }
                }
            }
        }
        
        stage('Clean old Docker images from Jenkins') {
            steps {
                script {
                    try {
                        sh 'docker image prune -af'
                        env.STAGE_DOCKER_CLEAN = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DOCKER_CLEAN = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Deploy to Kubernetes via Ansible') {
            steps {
                script {
                    try {
                        sh """
                            ansible-playbook -i inventory.ini deploy.yml
                        """
                        env.STAGE_DEPLOY = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DEPLOY = "FAILURE"
                        throw err
                    }
                }
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

                //table stages
                def stageTable = """
                <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>
                  <tr><th>Stage</th><th>Status</th></tr>
                  <tr><td>Build</td><td style='color:${env.STAGE_BUILD == "SUCCESS" ? "green" : "red"};'>${env.STAGE_BUILD}</td></tr>
                  <tr><td>Test</td><td style='color:${env.STAGE_TEST == "SUCCESS" ? "green" : "red"};'>${env.STAGE_TEST}</td></tr>
                  <tr><td>SonarQube</td><td style='color:${env.STAGE_SONAR == "SUCCESS" ? "green" : "red"};'>${env.STAGE_SONAR}</td></tr>
                  <tr><td>Quality Gate</td><td style='color:${env.STAGE_QG == "SUCCESS" ? "green" : "red"};'>${env.STAGE_QG}</td></tr>
                  <tr><td>Upload-to-Nexus</td><td style='color:${env.STAGE_NEXUS == "SUCCESS" ? "green" : "red"};'>${env.STAGE_NEXUS}</td></tr>
                  <tr><td>Docker Build</td><td style='color:${env.STAGE_DOCKER_BUILD == "SUCCESS" ? "green" : "red"};'>${env.STAGE_DOCKER_BUILD}</td></tr>
                  <tr><td>Docker Push</td><td style='color:${env.STAGE_DOCKER_PUSH == "SUCCESS" ? "green" : "red"};'>${env.STAGE_DOCKER_PUSH}</td></tr>
                  <tr><td>Docker Clean</td><td style='color:${env.STAGE_DOCKER_CLEAN == "SUCCESS" ? "green" : "red"};'>${env.STAGE_DOCKER_CLEAN}</td></tr>
                  <tr><td>Deploy</td><td style='color:${env.STAGE_DEPLOY == "SUCCESS" ? "green" : "red"};'>${env.STAGE_DEPLOY}</td></tr>
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
