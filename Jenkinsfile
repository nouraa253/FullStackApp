pipeline {
  agent any

  environment {
    REGISTRY         = "docker.io/nouraa253"     // غيّر إذا اسم حسابك مختلف
    REGISTRY_CRED_ID = "docker-"    // Jenkins credential (username+password أو token)
    KUBECONFIG_CRED  = "kubeconfig"         // Jenkins secret file فيه kubeconfig
    APP_NAME         = "project5"
    K8S_NAMESPACE    = "project5"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Images') {
      steps {
        script {
          sh """
            echo "===> Build frontend image"
            docker build -t ${REGISTRY}/${APP_NAME}-frontend:${BUILD_NUMBER} ./frontend

            echo "===> Build backend image"
            docker build -t ${REGISTRY}/${APP_NAME}-backend:${BUILD_NUMBER} ./demo
          """
        }
      }
    }

    stage('Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh """
            echo "===> Login to Docker Registry"
            echo "${REG_PASS}" | docker login -u "${REG_USER}" --password-stdin ${REGISTRY}

            echo "===> Push frontend image"
            docker push ${REGISTRY}/${APP_NAME}-frontend:${BUILD_NUMBER}

            echo "===> Push backend image"
            docker push ${REGISTRY}/${APP_NAME}-backend:${BUILD_NUMBER}

            docker logout ${REGISTRY}
          """
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withKubeConfig([credentialsId: "${KUBECONFIG_CRED}"]) {
          sh """
            set -e
            echo "===> Apply namespace"
            kubectl apply -f k8s/namespace.yaml

            echo "===> Apply MySQL"
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/mysql-secret.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/mysql-configmap.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/mysql-pvc.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/mysql-deployment.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/mysql-service.yaml

            echo "===> Apply Backend"
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/backend-deployment.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/backend-service.yaml

            echo "===> Apply Frontend"
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/frontend-deployment.yaml
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/frontend-service.yaml

            echo "===> Apply Ingress (if exists)"
            kubectl apply -n ${K8S_NAMESPACE} -f k8s/ingress.yaml || true

            echo "===> Update images with build number"
            kubectl -n ${K8S_NAMESPACE} set image deployment/backend backend=${REGISTRY}/${APP_NAME}-backend:${BUILD_NUMBER} --record=true
            kubectl -n ${K8S_NAMESPACE} set image deployment/frontend frontend=${REGISTRY}/${APP_NAME}-frontend:${BUILD_NUMBER} --record=true

            echo "===> Wait for rollouts"
            kubectl -n ${K8S_NAMESPACE} rollout status deployment/mysql --timeout=180s
            kubectl -n ${K8S_NAMESPACE} rollout status deployment/backend --timeout=300s
            kubectl -n ${K8S_NAMESPACE} rollout status deployment/frontend --timeout=180s
          """
        }
      }
    }

  }

  post {
    always {
      archiveArtifacts artifacts: 'k8s/*.yaml', onlyIfSuccessful: false
    }
  }
}
