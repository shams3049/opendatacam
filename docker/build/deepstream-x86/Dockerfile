# DeepStream SDK 7.0 for x86 with OpenDataCam
# Based on NVIDIA DeepStream SDK container
ARG DEEPSTREAM_VERSION=7.0-triton-multiarch
FROM nvcr.io/nvidia/deepstream:${DEEPSTREAM_VERSION}

ENV DEBIAN_FRONTEND=noninteractive

ARG NODE_MAJOR=20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    wget \
    jq \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Node.js
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set up working directory
WORKDIR /opt/nvidia/deepstream/deepstream

# Copy OpenDataCam source
COPY ./package*.json /var/local/opendatacam/
WORKDIR /var/local/opendatacam
RUN npm install

COPY ./ /var/local/opendatacam
RUN npm run build

# Configure for DeepStream
RUN sed -i -e 's+TO_REPLACE_DETECTION_ENGINE+deepstream+g' config.json && \
    sed -i -e 's+TO_REPLACE_VIDEO_INPUT+file+g' config.json && \
    sed -i -e 's+TO_REPLACE_NEURAL_NETWORK+yolov4+g' config.json

# Include demo video
RUN mkdir -p /var/local/opendatacam/opendatacam_videos && \
    cd /var/local/opendatacam/opendatacam_videos && \
    wget https://github.com/opendatacam/opendatacam/raw/development/public/static/demo/demo.mp4

EXPOSE 8080 8070 8090

COPY docker/build/deepstream-x86/launch.sh /var/local/opendatacam/launch.sh
RUN chmod 777 /var/local/opendatacam/launch.sh

CMD ["/var/local/opendatacam/launch.sh"]
