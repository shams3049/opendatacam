# Migration Guide: Darknet to DeepStream

This guide helps you migrate from the legacy Darknet/YOLO implementation to the modern NVIDIA DeepStream SDK implementation.

## Why Migrate?

- **Better Performance**: DeepStream SDK is optimized for NVIDIA hardware
- **Modern Models**: Access to latest models like YOLOv5, ResNet, PeopleNet, TrafficCamNet
- **Scalability**: Run inference on separate hardware or in the cloud
- **Active Development**: DeepStream is actively maintained by NVIDIA
- **Multi-stream Support**: Process multiple video streams simultaneously
- **Better Integration**: Native support for NVIDIA hardware acceleration

## Compatibility

The migration maintains full backward compatibility:
- All existing recordings and data are preserved
- Counter configurations remain the same
- API endpoints continue to work
- UI and UX remain familiar

## Prerequisites

Before migrating:
1. Backup your current `config.json`
2. Backup your MongoDB data (optional, but recommended)
3. Note your current video input settings
4. Ensure you have NVIDIA GPU with updated drivers
5. Install NVIDIA Container Toolkit if not already installed

## Migration Steps

### Step 1: Backup Current Setup

```bash
# Backup your config
cp config.json config.json.backup

# Backup your docker-compose file
cp docker-compose.yml docker-compose.yml.backup

# Export MongoDB data (optional)
docker-compose exec mongo mongodump --out=/data/backup
```

### Step 2: Stop Current Containers

```bash
docker-compose down
```

### Step 3: Update Configuration

Edit your `config.json` to enable DeepStream:

```json
{
  "OPENDATACAM_VERSION": "3.1.0",
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

### Step 4: Choose Your Deployment Model

#### Option A: All-in-One Container (Easiest)

Use the new DeepStream-enabled Docker images:

```bash
# For x86/Server
wget https://raw.githubusercontent.com/opendatacam/opendatacam/v3.1.0/docker/run/deepstream-x86/docker-compose.yml

# For Jetson
wget https://raw.githubusercontent.com/opendatacam/opendatacam/v3.1.0/docker/run/deepstream-jetson/docker-compose.yml

# Start the containers
docker-compose up -d
```

#### Option B: Separate Compute Container (Recommended for Production)

This setup runs DeepStream on dedicated hardware:

1. Deploy the full stack on your edge device or server:
```bash
docker-compose -f docker-compose.deepstream.yml up -d
```

2. For remote DeepStream, update your `config.json`:
```json
{
  "DEEPSTREAM_CONFIG": {
    "mode": "remote",
    "host": "your-deepstream-server.com",
    "port": 8080
  }
}
```

### Step 5: Select Your Model

DeepStream supports multiple models. Choose based on your needs:

**For Jetson Nano/Edge Devices:**
```json
{
  "NEURAL_NETWORK": "resnet10"
}
```

**For Jetson Xavier/Orin:**
```json
{
  "NEURAL_NETWORK": "yolov4"
}
```

**For x86/Server with Strong GPU:**
```json
{
  "NEURAL_NETWORK": "yolov5"
}
```

**For Person Detection:**
```json
{
  "NEURAL_NETWORK": "peoplenet"
}
```

**For Traffic Monitoring:**
```json
{
  "NEURAL_NETWORK": "trafficcamnet"
}
```

### Step 6: Update Video Input (if needed)

DeepStream uses the same video input configuration:

```json
{
  "VIDEO_INPUT": "file",
  "VIDEO_INPUTS_PARAMS": {
    "file": "opendatacam_videos/demo.mp4",
    "usbcam": "v4l2src device=/dev/video0 ! ...",
    "remote_cam": "rtsp://your-camera-url"
  }
}
```

### Step 7: Start and Verify

```bash
# Start the containers
docker-compose up -d

# Check logs
docker-compose logs -f opendatacam

# Access the UI
open http://localhost:8080
```

In the UI, open the menu (gear icon) and verify:
- DeepStream SDK status shows "Connected"
- Version shows 3.1.0

## Model Comparison

| Model | Speed | Accuracy | Use Case | Best For |
|-------|-------|----------|----------|----------|
| resnet10 | Fast | Good | General detection | Edge devices |
| yolov4 | Medium | High | General detection | Balanced performance |
| yolov5 | Medium | High | General detection | Latest YOLO |
| peoplenet | Fast | High | People only | Person tracking |
| trafficcamnet | Fast | High | Vehicles | Traffic monitoring |

## Configuration Changes

### Old (Darknet) Config
```json
{
  "PATH_TO_YOLO_DARKNET": "/var/local/darknet",
  "CMD_TO_YOLO_DARKNET": "/var/local/darknet/darknet",
  "NEURAL_NETWORK": "yolov4",
  "NEURAL_NETWORK_PARAMS": {
    "yolov4": {
      "data": "cfg/coco.data",
      "cfg": "cfg/yolov4-416x416.cfg",
      "weights": "yolov4.weights"
    }
  }
}
```

### New (DeepStream) Config
```json
{
  "DETECTION_ENGINE": "deepstream",
  "NEURAL_NETWORK": "yolov4",
  "DEEPSTREAM_CONFIG": {
    "mode": "remote",
    "host": "deepstream",
    "port": 8080
  },
  "DEEPSTREAM_MODELS": {
    "yolov4": {
      "type": "yolo",
      "config": "config_infer_primary_yoloV4.txt"
    }
  }
}
```

## Rollback Procedure

If you need to rollback to Darknet:

1. Stop containers:
```bash
docker-compose down
```

2. Restore your backup:
```bash
cp config.json.backup config.json
cp docker-compose.yml.backup docker-compose.yml
```

3. Change detection engine:
```json
{
  "DETECTION_ENGINE": "darknet"
}
```

4. Restart:
```bash
docker-compose up -d
```

## Troubleshooting

### DeepStream Not Connecting

**Problem**: UI shows "Disconnected" status

**Solution**:
1. Check if DeepStream container is running:
```bash
docker-compose ps
```

2. Check network connectivity:
```bash
docker-compose exec opendatacam ping deepstream
```

3. Verify DeepStream host in config.json

### Model Not Loading

**Problem**: Detection not working

**Solution**:
1. Check available models:
```bash
curl http://localhost:8080/deepstream/models
```

2. Verify model name matches one from DEEPSTREAM_MODELS in config.json

3. Check DeepStream logs:
```bash
docker-compose logs deepstream
```

### Performance Issues

**Problem**: Slow inference or dropped frames

**Solution**:
1. Use a lighter model (e.g., resnet10 instead of yolov5)
2. Reduce video resolution
3. Check GPU utilization: `nvidia-smi`
4. Allocate more resources to DeepStream container

### GPU Not Detected

**Problem**: DeepStream can't access GPU

**Solution**:
1. Verify NVIDIA drivers: `nvidia-smi`
2. Install NVIDIA Container Toolkit
3. Add `runtime: nvidia` to docker-compose.yml
4. Set `NVIDIA_VISIBLE_DEVICES=all`

## Performance Comparison

Based on typical hardware:

### Jetson Nano
- Darknet YOLOv4-tiny: ~15 FPS
- DeepStream ResNet10: ~25 FPS
- DeepStream YOLOv4-tiny: ~20 FPS

### Jetson Xavier
- Darknet YOLOv4: ~20 FPS
- DeepStream YOLOv4: ~30 FPS
- DeepStream YOLOv5: ~35 FPS

### x86 (RTX 3080)
- Darknet YOLOv4: ~45 FPS
- DeepStream YOLOv4: ~70 FPS
- DeepStream YOLOv5: ~80 FPS

## FAQ

**Q: Can I use my custom-trained Darknet weights?**

A: Not directly. You'll need to convert your model to TensorRT format for DeepStream. See NVIDIA's conversion tools.

**Q: Will my existing counters and recordings work?**

A: Yes, all data is preserved. Only the detection engine changes.

**Q: Can I run both Darknet and DeepStream?**

A: You can switch between them by changing `DETECTION_ENGINE` in config.json, but not simultaneously.

**Q: Does DeepStream work on non-NVIDIA GPUs?**

A: No, DeepStream requires NVIDIA GPUs. For other hardware, continue using Darknet.

**Q: Can I use DeepStream in the cloud?**

A: Yes! Deploy DeepStream on any cloud instance with NVIDIA GPUs (AWS, GCP, Azure).

## Support

- GitHub Issues: https://github.com/opendatacam/opendatacam/issues
- DeepStream Documentation: https://docs.nvidia.com/metropolis/deepstream/
- Community Forum: https://github.com/opendatacam/opendatacam/discussions

## Next Steps

After successful migration:

1. Fine-tune model selection for your use case
2. Optimize video input settings
3. Set up production monitoring
4. Consider scaling with multiple DeepStream instances
5. Explore advanced DeepStream features

## Contributing

Help improve this migration guide:
- Report issues with migration
- Share your experience
- Submit improvements to documentation
