# OpenDataCam Docker Build Guide

This directory contains Dockerfiles for building OpenDataCam with different detection engines and platforms.

## Directory Structure

```
docker/build/
├── base-desktop/       # Base image for desktop/x86 with dependencies
├── base-jetson/        # Base image for Jetson devices
├── cpu-amd64/          # CPU-only build (no GPU)
├── desktop/            # Darknet/YOLO for x86 with NVIDIA GPU
├── nano/               # Darknet/YOLO for Jetson Nano
├── xavier/             # Darknet/YOLO for Jetson Xavier
├── deepstream-x86/     # DeepStream SDK for x86 platforms
└── deepstream-jetson/  # DeepStream SDK for Jetson devices
```

## Detection Engines

### Darknet/YOLO (Legacy)
- Traditional detection using Darknet framework
- Directories: `desktop/`, `nano/`, `xavier/`
- Best for: Existing installations, custom models

### DeepStream SDK (Modern)
- NVIDIA's optimized inference framework
- Directories: `deepstream-x86/`, `deepstream-jetson/`
- Best for: Production, performance, scalability

## Building Images

### Prerequisites

1. Docker installed
2. For GPU support: NVIDIA Container Toolkit
3. Model weights (for Darknet builds)

### DeepStream Builds (Recommended)

#### x86/Server Platform

```bash
# Build DeepStream x86 image
cd docker/build/deepstream-x86
docker build -t opendatacam/opendatacam:3.1.0-deepstream-x86 \
  -f Dockerfile \
  ../../../

# Run the container
docker run -d \
  --name opendatacam \
  --runtime=nvidia \
  -p 8080:8080 \
  -p 8070:8070 \
  -p 8090:8090 \
  opendatacam/opendatacam:3.1.0-deepstream-x86
```

#### Jetson Platform

```bash
# Build DeepStream Jetson image
cd docker/build/deepstream-jetson
docker build -t opendatacam/opendatacam:3.1.0-deepstream-jetson \
  -f Dockerfile \
  ../../../

# Run the container
docker run -d \
  --name opendatacam \
  --privileged \
  -p 8080:8080 \
  -p 8070:8070 \
  -p 8090:8090 \
  opendatacam/opendatacam:3.1.0-deepstream-jetson
```

### Darknet Builds (Legacy)

#### Desktop/x86

```bash
# First, download YOLO weights
cd docker/build/desktop
wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights

# Build the image
docker build -t opendatacam/opendatacam:3.1.0-desktop \
  -f Dockerfile \
  ../../../
```

#### Jetson Nano

```bash
cd docker/build/nano
wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights

docker build -t opendatacam/opendatacam:3.1.0-nano \
  -f Dockerfile \
  ../../../
```

#### Jetson Xavier

```bash
cd docker/build/xavier
wget https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights

docker build -t opendatacam/opendatacam:3.1.0-xavier \
  -f Dockerfile \
  ../../../
```

## Multi-Architecture Builds

### Build for Multiple Platforms

Using Docker Buildx for multi-arch builds:

```bash
# Create a new builder
docker buildx create --name multiarch-builder --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t opendatacam/opendatacam:3.1.0-deepstream \
  -f docker/build/deepstream-x86/Dockerfile \
  --push \
  .
```

## Customization

### Custom Models

#### For Darknet
1. Place your `.weights`, `.cfg`, and `.data` files in the build directory
2. Update the `NEURAL_NETWORK_PARAMS` section in config.json
3. Rebuild the image

#### For DeepStream
1. Add your model configuration to `DEEPSTREAM_MODELS` in config.json
2. Mount model files via volume or include in Dockerfile
3. Update the DeepStream config files

### Environment Variables

All images support these environment variables:

```bash
VIDEO_INPUT=file              # Video input source
INPUT_FILE=path/to/video.mp4  # Video file path
DETECTION_ENGINE=deepstream   # darknet or deepstream
DEEPSTREAM_HOST=deepstream    # DeepStream container hostname
INPUT_USBCAM=device_string    # USB camera configuration
INPUT_REMOTE_CAM=stream_url   # Remote camera URL
```

### Volume Mounts

Recommended volume mounts:

```bash
docker run \
  -v $(pwd)/config.json:/var/local/opendatacam/config.json \
  -v $(pwd)/videos:/var/local/opendatacam/opendatacam_videos \
  -v mongodb_data:/data/db \
  ...
```

## Optimization

### Image Size Optimization

- Use multi-stage builds for smaller images
- Clean up apt cache: `rm -rf /var/lib/apt/lists/*`
- Remove build dependencies after installation
- Use `.dockerignore` to exclude unnecessary files

### Build Cache

Speed up builds with BuildKit:

```bash
export DOCKER_BUILDKIT=1
docker build --cache-from opendatacam/opendatacam:latest ...
```

### Layer Optimization

Order Dockerfile commands from least to most frequently changed:
1. Base image and system packages
2. Application dependencies (npm install)
3. Application code
4. Configuration files

## Testing

### Test a Build Locally

```bash
# Build the image
docker build -t opendatacam-test -f docker/build/deepstream-x86/Dockerfile .

# Run with demo video
docker run -d \
  --name opendatacam-test \
  --runtime=nvidia \
  -p 8080:8080 \
  opendatacam-test

# Check logs
docker logs -f opendatacam-test

# Test the UI
open http://localhost:8080
```

### Automated Testing

```bash
# Build test
docker build -t test-image -f docker/build/deepstream-x86/Dockerfile .

# Container starts successfully
docker run -d --name test-container test-image
docker ps | grep test-container

# Health check
curl http://localhost:8080/status

# Cleanup
docker stop test-container
docker rm test-container
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Docker Images

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1
      
      - name: Login to DockerHub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          file: docker/build/deepstream-x86/Dockerfile
          push: true
          tags: opendatacam/opendatacam:latest-deepstream-x86
```

## Troubleshooting

### Build Failures

**Problem**: "Failed to fetch" or network errors

**Solution**:
```bash
# Update package lists first
docker build --no-cache ...
```

**Problem**: "Cannot find CUDA libraries"

**Solution**:
- Ensure using correct base image with CUDA support
- Check CUDA version compatibility

### Runtime Issues

**Problem**: GPU not detected in container

**Solution**:
```bash
# Verify NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Use correct runtime flag
docker run --runtime=nvidia ...  # For docker-compose
docker run --gpus all ...        # For Docker 19.03+
```

### Model Loading Issues

**Problem**: Model files not found

**Solution**:
- Verify model files are in correct location in image
- Check file permissions
- Validate config.json paths

## Performance Tips

1. **Use BuildKit**: Faster builds with better caching
2. **Multi-stage builds**: Reduce final image size
3. **Cache npm dependencies**: Copy package.json first
4. **Parallel builds**: Use `docker buildx` for multi-arch
5. **Layer caching**: Structure Dockerfile for optimal caching

## Security Best Practices

1. **Use specific base image tags**: Avoid `:latest`
2. **Run as non-root**: Create and use app user
3. **Scan images**: Use `docker scan` or Trivy
4. **Minimal images**: Remove unnecessary tools
5. **Update regularly**: Keep base images and dependencies updated

## Contributing

When adding new Dockerfiles:

1. Follow existing naming convention
2. Add comprehensive comments
3. Include launch.sh script
4. Test on target platform
5. Update this README
6. Document environment variables

## Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-docker)
- [DeepStream SDK](https://developer.nvidia.com/deepstream-sdk)
- [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)

## Support

- GitHub Issues: https://github.com/opendatacam/opendatacam/issues
- Docker Hub: https://hub.docker.com/r/opendatacam/opendatacam
- Documentation: https://opendata.cam/docs
