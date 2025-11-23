const axios = require('axios');
const { EventEmitter } = require('events');

/**
 * DeepStreamAdapter - Adapter for connecting to NVIDIA DeepStream SDK
 * This adapter can connect to a remote DeepStream container or instance
 * and provides the same interface as YoloDarknet for backward compatibility
 */
class DeepStreamAdapter extends EventEmitter {
  /**
   * Creates a DeepStreamAdapter object
   *
   * @param {*} config The configuration to use
   *
   * Supported config modes:
   * - remote: Connect to a running DeepStream instance via HTTP/REST API
   * - local: Run DeepStream locally (requires DeepStream SDK installed)
   */
  constructor(config = null) {
    super();

    this.isStarting = false;
    this.isStarted = false;
    this.isInitialized = false;
    this.videoResolution = {
      w: 0,
      h: 0,
    };

    /** The configuration passed to the constructor. */
    this.config = {
      mode: 'remote', // 'remote' or 'local'
      deepstreamHost: 'localhost',
      deepstreamPort: 8080,
      videoType: null,
      videoParams: null,
      jsonStreamPort: null,
      mjpegStreamPort: null,
      modelConfig: null,
      connectionTimeout: 5000,
      retryAttempts: 3,
    };

    if (config == null) {
      console.warn('DeepStreamAdapter: Empty configuration passed, most likely because you are in Simulation mode.');
      return;
    }

    // Copy the config
    Object.keys(this.config).forEach((key) => {
      if (key in config) {
        this.config[key] = config[key];
      }
    });

    this.deepstreamUrl = `http://${this.config.deepstreamHost}:${this.config.deepstreamPort}`;
    this.connected = false;
    this.healthCheckInterval = null;

    console.log('DeepStream Adapter initialized');
    console.log(`Mode: ${this.config.mode}`);
    console.log(`DeepStream URL: ${this.deepstreamUrl}`);
    this.isInitialized = true;
  }

  getStatus() {
    return {
      isStarting: this.isStarting,
      isStarted: this.isStarted,
      connected: this.connected,
      mode: this.config.mode,
    };
  }

  getVideoResolution() {
    return this.videoResolution;
  }

  getVideoParams() {
    return this.config.videoParams;
  }

  /**
   * Check if DeepStream instance is reachable
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${this.deepstreamUrl}/health`, {
        timeout: this.config.connectionTimeout,
      });
      return response.status === 200;
    } catch (error) {
      console.error('DeepStream connection check failed:', error.message);
      return false;
    }
  }

  /**
   * Start the DeepStream adapter
   * For remote mode: Establishes connection to remote DeepStream instance
   * For local mode: Would start local DeepStream process (to be implemented)
   */
  async start() {
    // Do not start it twice
    if (this.isStarted || this.isStarting) {
      console.log('DeepStream adapter already started');
      return;
    }

    this.isStarting = true;

    if (this.config.mode === 'remote') {
      await this.startRemoteMode();
    } else if (this.config.mode === 'local') {
      await this.startLocalMode();
    }

    this.isStarted = true;
    this.isStarting = false;
    this.emit('started');
  }

  async startRemoteMode() {
    console.log('Starting DeepStream in remote mode...');

    let attempts = 0;
    let isConnected = false;

    while (attempts < this.config.retryAttempts && !isConnected) {
      // eslint-disable-next-line no-await-in-loop
      isConnected = await this.checkConnection();

      if (isConnected) {
        this.connected = true;
        console.log('Successfully connected to remote DeepStream instance');

        // Fetch video resolution if available
        try {
          const response = await axios.get(`${this.deepstreamUrl}/api/stream/info`);
          if (response.data && response.data.resolution) {
            this.videoResolution = {
              w: response.data.resolution.width,
              h: response.data.resolution.height,
            };
            this.emit('videoresolution', this.videoResolution);
          }
        } catch (error) {
          console.warn('Could not fetch video resolution from DeepStream');
        }

        // Start health check monitoring
        this.startHealthCheck();
        return;
      }

      attempts += 1;
      if (attempts < this.config.retryAttempts) {
        console.log(`Connection attempt ${attempts} failed, retrying...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`Failed to connect to DeepStream instance after ${this.config.retryAttempts} attempts`);
  }

  async startLocalMode() {
    console.log('Starting DeepStream in local mode...');
    console.warn('Local mode is not yet fully implemented. Please use remote mode with a DeepStream container.');
    // TODO: Implement local DeepStream process spawning
    // This would require DeepStream SDK to be installed locally
    throw new Error('Local mode is not yet implemented. Please use remote mode.');
  }

  startHealthCheck() {
    // Check connection every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const isConnected = await this.checkConnection();
      if (!isConnected && this.connected) {
        console.error('Lost connection to DeepStream instance');
        this.connected = false;
        this.emit('disconnected');
      } else if (isConnected && !this.connected) {
        console.log('Reconnected to DeepStream instance');
        this.connected = true;
        this.emit('reconnected');
      }
    }, 30000);
  }

  stop() {
    return new Promise((resolve) => {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      if (this.isStarted) {
        console.log('Stopping DeepStream adapter');
        this.isStarted = false;
        this.connected = false;
        this.emit('stopped');
      }
      
      resolve();
    });
  }

  restart() {
    console.log('Restarting DeepStream adapter');
    this.stop().then(() => {
      this.start();
    });
  }

  /**
   * Indicate whether the source is live or pre-recorded
   *
   * @returns {boolean} true if live; false if pre-recorded
   */
  isLive() {
    // Files are recorded
    if (this.config.videoType === 'file') {
      return false;
    }

    // Simulations we need to check the parameters
    if (this.config.videoType === 'simulation') {
      const isLiveSimulation = !this.config.videoParams.includes('-isLive false');
      return isLiveSimulation;
    }

    // Everything else is considered live
    return true;
  }

  /**
   * Configure the video source for DeepStream
   * This sends a request to the DeepStream instance to change the video source
   */
  async configureVideoSource(videoSource) {
    if (this.config.mode !== 'remote') {
      throw new Error('Video source configuration only supported in remote mode');
    }

    try {
      const response = await axios.post(`${this.deepstreamUrl}/api/stream/source`, {
        source: videoSource,
      });

      console.log('Video source configured successfully');
      return response.data;
    } catch (error) {
      console.error('Failed to configure video source:', error.message);
      throw error;
    }
  }

  /**
   * Get available models from DeepStream
   */
  async getAvailableModels() {
    if (this.config.mode !== 'remote') {
      throw new Error('Model listing only supported in remote mode');
    }

    try {
      const response = await axios.get(`${this.deepstreamUrl}/api/models`);
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to get available models:', error.message);
      return [];
    }
  }

  /**
   * Set the active model for inference
   */
  async setActiveModel(modelName) {
    if (this.config.mode !== 'remote') {
      throw new Error('Model configuration only supported in remote mode');
    }

    try {
      const response = await axios.post(`${this.deepstreamUrl}/api/models/active`, {
        model: modelName,
      });

      console.log(`Active model set to: ${modelName}`);
      return response.data;
    } catch (error) {
      console.error('Failed to set active model:', error.message);
      throw error;
    }
  }
}

module.exports = { DeepStreamAdapter };
