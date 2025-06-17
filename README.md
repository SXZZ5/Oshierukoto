# Oshierukoto

**Oshierukoto** is a lightweight browser-based live streaming platform designed for real-time collaborative sessions. It allows a presenter to stream both a **facecam** and a **whiteboard** feed to multiple viewers using an efficient, scalable architecture powered by **WebSockets** and **Go**.

## Features

- **Dual-stream architecture**: Facecam and whiteboard are streamed in parallel.
- **Low-latency binary protocol**: Efficient media delivery using binary WebSocket payloads.
- **Chunked AVC1 streaming**: Media is encoded in 2–4 second chunks, keeping latency low and memory usage bounded.
- **Whiteboard capture via MediaRecorder**: All drawing activity is rendered to a canvas and recorded as a video stream for synchronized playback.
- **In-memory circular buffer**: Keeps a rolling 30-second window of stream data for each session without relying on Redis or other external caches.
- **End-to-end HTTPS**: Secure WebSocket (WSS) connections on port 443.

## Architecture Overview

### Streaming Model

- **Media encoding**: Browser-side `MediaRecorder` generates short AVC1-encoded video chunks for both facecam and whiteboard.
- **Transport**: Chunks are sent over a **single WebSocket** connection per client as raw binary payloads.
- **Backend handling**: A **dedicated goroutine per viewer** ensures stream distribution is concurrent and isolated.
- **Memory strategy**: Each stream is stored in-memory using a bounded circular buffer, capped at ~30 seconds to simulate live behavior.

### Whiteboard Synchronization

Instead of relying on application-level draw event broadcasting, the whiteboard canvas is periodically captured as a video stream. This guarantees:

- Accurate state for late joiners
- Seamless temporal alignment with facecam
- Simplified protocol over event-based drawing systems

### Frontend Stack

- **Framework**: React
- **Rendering**: HTML5 `<video>` and `<canvas>` elements
- **Control**: Uses Web APIs directly (MediaRecorder, WebSocket, Canvas 2D)

## Requirements

- **Go 1.22+**
- **Node.js (for frontend dev)**
- Modern browser with support for:
  - MediaRecorder API (AVC1 codec)
  - Secure WebSockets (WSS)

## Getting Started

```bash
# Backend
cd server/
go run main.go  # or build the binary

# Frontend
cd frontend/
npm install
npm run dev     # or npm run build for production
