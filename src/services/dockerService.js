const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class DockerService {
  /**
   * Run a new Docker container
   */
  async runContainer({ image, name, envVars = {}, hostPort, targetPort, pull = false }) {
    // 1. Ensure any existing container with this name is removed (safety)
    try {
      await execPromise(`docker rm -f ${name}`);
    } catch (e) {}

    // 2. Optional image pull
    if (pull) {
      await this.pullImage(image);
    }

    let plainEnvVars = envVars;
    if (envVars && typeof envVars.toJSON === 'function') {
      plainEnvVars = envVars.toJSON();
    } else if (envVars instanceof Map) {
      plainEnvVars = Object.fromEntries(envVars);
    }
    
    let envString = '';
    for (const [key, value] of Object.entries(plainEnvVars || {})) {
      const safeValue = String(value).replace(/"/g, '\\"');
      envString += `-e ${key}="${safeValue}" `;
    }

    const command = `docker run -d --name ${name} -p ${hostPort}:${targetPort} ${envString}${image}`;
    try {
      const { stdout } = await execPromise(command);
      return stdout.trim();
    } catch (error) {
      console.error(`Failed to run container ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Pull a Docker image explicitly
   */
  async pullImage(image) {
    try {
      // Optimization: Check if image exists locally first
      const { stdout } = await execPromise(`docker images -q ${image}`);
      if (stdout.trim()) {
        console.log(`[DOCKER] Image ${image} already exists locally, skipping pull.`);
        return true;
      }

      console.log(`[DOCKER] Pulling image ${image}...`);
      await execPromise(`docker pull ${image}`);
      return true;
    } catch (e) {
      console.warn(`[DOCKER] Warning: Failed to pull image ${image}. Attempting to run anyway from local cache.`);
      return false;
    }
  }

  /**
   * Stop an existing Docker container
   */
  async execCommand(containerId, command) {
    try {
      const { stdout, stderr } = await execPromise(`docker exec ${containerId} sh -c "${command}"`);
      return { stdout, stderr };
    } catch (error) {
      console.error(`Exec error for container ${containerId}:`, error.message);
      throw error;
    }
  }

  async stopContainer(containerId) {
    if (!containerId) return;
    try {
      await execPromise(`docker stop ${containerId}`);
    } catch (error) {
      console.error(`Failed to stop container ${containerId}:`, error.message);
      // Don't throw if it's already stopped
      if (!error.message.includes('No such container')) {
        throw error;
      }
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
  /**
   * Check if Docker is available
   */
  async checkDocker() {
    try {
      await execPromise('docker info');
      return true;
    } catch (error) {
      console.error('Docker check failed:', error.message);
      return false;
    }
  }
}


module.exports = new DockerService();

//dockerService.js provides a set of methods to interact with Docker, including running, stopping, removing, inspecting containers, and pulling images. It uses the child_process module to execute Docker CLI commands and handles errors gracefully, providing informative logs for debugging.