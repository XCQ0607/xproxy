# xProxy - Lightweight Node.js HTTP/SOCKS5 Proxy Server

[English](./README_EN.md) | [中文](./README.md)

A lightweight proxy server implemented in Node.js, supporting both HTTP and SOCKS5 protocols with username/password authentication.

**Project URL**: [https://github.com/xproxy](https://github.com/xproxy)

## Features

- **Dual Protocol Support**:
  - HTTP Proxy (Default port 3000)
  - SOCKS5 Proxy (Default port 3001)
- **Authentication**: Supports Basic Auth (HTTP) and Username/Password Auth (SOCKS5).
- **Flexible Configuration**: Fully configurable via environment variables.
- **Ready to Deploy**: Docker images available.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HTTP_PORT` | HTTP Proxy listening port | `3000` |
| `SOCKS5_PORT` | SOCKS5 Proxy listening port | `3001` |
| `USER` | Authentication Username | `admin` |
| `PASSWORD` | Authentication Password | `12345678` |

## Getting Started

### Method 1: Using Docker (Recommended)

Use our pre-built image from GHCR: `ghcr.io/xcq0607/xproxy:latest`

**Run Command:**

```bash
docker run -d \
  --name xproxy \
  -p 3000:3000 \
  -p 3001:3001 \
  -e USER=myusername \
  -e PASSWORD=mypassword \
  ghcr.io/xcq0607/xproxy:latest
```

After running:
- HTTP Proxy: `http://myusername:mypassword@<IP>:3000`
- SOCKS5 Proxy: `socks5://myusername:mypassword@<IP>:3001`

### Method 2: Using Node.js

To run from source:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/xproxy
    cd xproxy
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run**
    ```bash
    # Start with default settings
    npm start

    # Start with custom settings (Linux/Mac)
    USER=myuser PASSWORD=mypass HTTP_PORT=8080 npm start
    
    # Start with custom settings (Windows PowerShell)
    $env:USER="myuser"; $env:PASSWORD="mypass"; npm start
    ```

## Verification

Test with `curl`:

**Test HTTP Proxy:**
```bash
curl -x http://admin:12345678@localhost:3000 http://example.com
```

**Test SOCKS5 Proxy:**
```bash
curl -x socks5h://admin:12345678@localhost:3001 http://example.com
```

## License

ISC
