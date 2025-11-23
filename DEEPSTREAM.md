# OpenDataCam with DeepStream SDK

This version of OpenDataCam uses NVIDIA DeepStream SDK for object detection and tracking, providing improved performance and support for modern NVIDIA hardware.

## Features

- **NVIDIA DeepStream SDK 7.0** - Latest inference engine from NVIDIA
- **Multi-platform Support** - Works on x86 servers, Jetson devices (Nano, Xavier, Orin), and cloud instances
- **Flexible Architecture** - Run DeepStream separately or integrated with the UI
- **Modern Models** - Support for ResNet10, YOLOv4, YOLOv5, PeopleNet, TrafficCamNet, and more
- **Easy Configuration** - Connect to remote DeepStream instances via simple config

## Quick Start

### Prerequisites

- Docker and Docker Compose
- NVIDIA GPU with drivers installed
- NVIDIA Container Toolkit (for GPU support)
- For Jetson: JetPack 5.x or later

### Installation

#### For x86/Server Platform

```bash
# Download the installation script
wget -N https://raw.githubusercontent.com/opendatacam/opendatacam/master/docker/install-opendatacam.sh

# Make it executable
chmod +x install-opendatacam.sh

# Install for DeepStream on x86
./install-opendatacam.sh --platform deepstream-x86
```

#### For Jetson Platform

```bash
# Download the installation script
wget -N https://raw.githubusercontent.com/opendatacam/opendatacam/master/docker/install-opendatacam.sh

# Make it executable
chmod +x install-opendatacam.sh

# Install for DeepStream on Jetson
./install-opendatacam.sh --platform deepstream-jetson
```

### Manual Docker Compose Setup

1. Create a directory for your OpenDataCam installation:
```bash
mkdir opendatacam
cd opendatacam
```

2. Download the appropriate docker-compose file:
```bash
# For x86
wget https://raw.githubusercontent.com/opendatacam/opendatacam/master/docker/run/deepstream-x86/docker-compose.yml

# For Jetson
wget https://raw.githubusercontent.com/opendatacam/opendatacam/master/docker/run/deepstream-jetson/docker-compose.yml
```

3. Download the default config:
```bash
wget https://raw.githubusercontent.com/opendatacam/opendatacam/master/config.json
```

4. Start the containers:
```bash
docker-compose up -d
```

5. Access the UI at http://localhost:8080

## Configuration

### Basic Configuration

Edit `config.json` to configure your installation:

```json
{
  "DETECTION_ENGINE": "deepstream",
  "DEEPSTREAM_CONFIG": {
    "mode": "remote",
    "host": "deepstream",
    "port": 8080,
    "connectionTimeout": 5000,
    "retryAttempts": 3
  }
}
```

### Detection Engine Options

- `"darknet"` - Use legacy Darknet/YOLO (default for backward compatibility)
- `"deepstream"` - Use NVIDIA DeepStream SDK

### DeepStream Modes

- `"remote"` - Connect to a separate DeepStream container or instance
- `"local"` - Run DeepStream in the same container (not yet implemented)

### Available Models

DeepStream supports multiple pre-trained models:

- **resnet10** - Fast and efficient, good for edge devices
- **yolov4** - High accuracy object detection
- **yolov5** - Latest YOLO architecture
- **peoplenet** - Optimized for person detection
- **trafficcamnet** - Optimized for traffic monitoring

Configure the model in `config.json`:
```json
{
  "NEURAL_NETWORK": "yolov4"
}
```

### Video Input Configuration

Same as standard OpenDataCam:

```json
{
  "VIDEO_INPUT": "file",
  "VIDEO_INPUTS_PARAMS": {
    "file": "opendatacam_videos/demo.mp4",
    "usbcam": "v4l2src device=/dev/video0...",
    "remote_cam": "rtsp://your-camera-url"
  }
}
```

## Architecture

### Integrated Mode (Default)

```
┌─────────────────────────────────┐
│   OpenDataCam Container         │
│  ┌──────────────────────────┐   │
│  │   Frontend (Next.js)     │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │   Backend (Node.js)      │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │   DeepStream Adapter     │───┼───► DeepStream Container
│  └──────────────────────────┘   │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │
└─────────────────┘
```

### Separate Compute Mode

For production deployments, you can run DeepStream on separate hardware:

```
┌─────────────────────────────────┐      ┌──────────────────────┐
│   OpenDataCam UI Container      │      │  DeepStream Compute  │
│  ┌──────────────────────────┐   │      │   (Separate Server)  │
│  │   Frontend + Backend     │───┼──────┼───► DeepStream SDK   │
│  └──────────────────────────┘   │      │                      │
└─────────────────────────────────┘      └──────────────────────┘
```

To use this mode:
1. Deploy DeepStream on your compute server
2. Configure `DEEPSTREAM_CONFIG.host` to point to your DeepStream server
3. Optionally remove the `deepstream` service from docker-compose.yml

## Connecting to External DeepStream

To connect OpenDataCam to an external DeepStream instance:

1. Edit `config.json`:
```json
{
  "DEEPSTREAM_CONFIG": {
    "mode": "remote",
    "host": "your-deepstream-server.com",
    "port": 8080
  }
}
```

2. Comment out or remove the `deepstream` service in `docker-compose.yml`

3. Restart OpenDataCam:
```bash
docker-compose restart opendatacam
```

## Performance Tuning

### For Jetson Devices

- Use `resnet10` or `yolov4-tiny` models for better performance
- Adjust `TRACKER_SETTINGS.confidence_threshold` based on your needs
- Consider reducing video resolution for real-time processing

### For x86/Server

- Use `yolov4` or `yolov5` for best accuracy
- Enable Triton Inference Server for multi-model support
- Scale horizontally by adding more DeepStream compute nodes

## Troubleshooting

### Connection Issues

If OpenDataCam can't connect to DeepStream:

1. Check that DeepStream container is running:
```bash
docker-compose ps
```

2. Verify network connectivity:
```bash
docker-compose exec opendatacam ping deepstream
```

3. Check DeepStream logs:
```bash
docker-compose logs deepstream
```

### Performance Issues

- Monitor GPU usage: `nvidia-smi`
- Check model performance in DeepStream logs
- Consider using a lighter model for edge devices

## Migration from Darknet

To migrate from the Darknet version:

1. Backup your current `config.json`
2. Update to the DeepStream version
3. Change `DETECTION_ENGINE` to `"deepstream"`
4. Add `DEEPSTREAM_CONFIG` section
5. Restart the application

Your existing counters, recordings, and data will be preserved.

## Development

### Building Images

Build the DeepStream-enabled OpenDataCam image:

```bash
# For x86
docker build -f docker/build/deepstream-x86/Dockerfile -t opendatacam/opendatacam:dev-deepstream-x86 .

# For Jetson
docker build -f docker/build/deepstream-jetson/Dockerfile -t opendatacam/opendatacam:dev-deepstream-jetson .
```

### Running in Development Mode

```bash
# Set detection engine to DeepStream
export DETECTION_ENGINE=deepstream

# Run development server
npm run dev
```

## Support

- GitHub Issues: https://github.com/opendatacam/opendatacam/issues
- GitHub Discussions: https://github.com/opendatacam/opendatacam/discussions
- NVIDIA DeepStream Forum: https://forums.developer.nvidia.com/c/accelerated-computing/deepstream/

## License

MIT License - See LICENSE file for details
