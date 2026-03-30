const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class DockerService {
  /**
   * Run a new Docker container
   */
  async runContainer({ image, name, envVars = {}, hostPort, targetPort }) {
    let plainEnvVars = envVars;
    if (envVars && typeof envVars.toJSON === 'function') {
      plainEnvVars = envVars.toJSON();
    } else if (envVars instanceof Map) {
      plainEnvVars = Object.fromEntries(envVars);
    }
    
    let envString = '';
    for (const [key, value] of Object.entries(plainEnvVars || {})) {
      // Basic escaping for environment variable values
      const safeValue = String(value).replace(/"/g, '\\"');
      envString += `-e ${key}="${safeValue}" `;
    }

    const command = `docker run -d --name ${name} -p ${hostPort}:${targetPort} ${envString}${image}`;
    try {
      const { stdout } = await execPromise(command);
      return stdout.trim(); // Returns the docker container ID
    } catch (error) {
      console.error(`Failed to run container ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop an existing Docker container
   */
  async stopContainer(containerId) {
    try {
      await execPromise(`docker stop ${containerId}`);
    } catch (error) {
      console.error(`Failed to stop container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove a Docker container forcefully
   */
  async removeContainer(containerId) {
    try {
      await execPromise(`docker rm -f ${containerId}`);
    } catch (error) {
      console.error(`Failed to remove container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Inspect a Docker container
   */
  async inspectContainer(containerId) {
    try {
      const { stdout } = await execPromise(`docker inspect ${containerId}`);
      return JSON.parse(stdout)[0];
    } catch (error) {
      console.error(`Failed to inspect container ${containerId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get logs for a container
   */
  async getLogs(containerId, tail = 100) {
    try {
      const { stdout, stderr } = await execPromise(`docker logs --tail ${tail} ${containerId}`);
      return { stdout, stderr };
    } catch (error) {
      console.error(`Failed to get logs for container ${containerId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new DockerService();
