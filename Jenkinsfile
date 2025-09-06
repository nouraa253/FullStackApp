pipeline {
  agent any

  environment {
    REGISTRY          = "docker.io/nouraa253" // عدّل حسب ريجسترك (docker.io/username أو ghcr.io/org)
    REGISTRY_CRED_ID  = 'docker'                 // Jenkins Credentials (Username/Password أو Token)
    KUBECONFIG_CRED   = 'kubeconfig'                      // Secret file للكوبكونفيغ
    APP_NAME          = 'project5'
    K8S_NAMESPACE     = 'project5'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Ansible Galaxy') {
      steps {
        sh '''
          cd ansible
          ansible-galaxy collection install -r requirements.yml
        '''
      }
    }

    stage('Build (Ansible)') {
      steps {
        sh '''
          cd ansible
          ansible-playbook -i inventory.ini build.yml \
            -e registry="${REGISTRY}" \
            -e app_name="${APP_NAME}" \
            -e build_tag="${BUILD_NUMBER}"
        '''
      }
    }

    stage('Push (Ansible)') {
      steps {
        withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            cd ansible
            ansible-playbook -i inventory.ini push.yml \
              -e registry="${REGISTRY}" \
              -e registry_username="${REG_USER}" \
              -e registry_password="${REG_PASS}" \
              -e app_name="${APP_NAME}" \
              -e build_tag="${BUILD_NUMBER}"
          '''
        }
      }
    }

    stage('Deploy to Kubernetes (Ansible)') {
      steps {
        sh '''
          export KUBECONFIG=$WORKSPACE/.kube/config
          cd ansible
          ansible-playbook -i inventory.ini deploy.yml \
            -e k8s_namespace="${K8S_NAMESPACE}" \
            -e registry="${REGISTRY}" \
            -e app_name="${APP_NAME}" \
            -e build_tag="${BUILD_NUMBER}"
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'k8s/*.yaml', onlyIfSuccessful: false
    }
  }
}
