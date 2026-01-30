# xProxy - Lightweight Node.js HTTP/SOCKS5 Proxy Server

[English](./README_EN.md) | [中文](./README.md)

A lightweight proxy server implemented in Node.js, supporting both HTTP and SOCKS5 protocols with username/password authentication.

**Project URL**: [https://github.com/xproxy](https://github.com/xproxy)

## Features

- **Dual Protocol Support**:
  - HTTP Proxy (Default port 3000)
  - SOCKS5 Proxy (Default port 3001)
- **Authentication**: Supports Basic Auth (HTTP) and Username/Password Auth (SOCKS5). Toggleable.
- **Tunneling**: Integrated Cloudflared Tunnel support via `ARGO_PAT`.
- **Custom DNS**: Defaults to `1.1.1.1` and `8.8.8.8` for better connectivity.
- **Flexible Configuration**: Fully configurable via environment variables.
- **Ready to Deploy**: Docker images available.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HTTP_PORT` | HTTP Proxy listening port | `3000` |
| `SOCKS5_PORT` | SOCKS5 Proxy listening port | `3001` |
| `USER` | Authentication Username | `admin` |
| `PASSWORD` | Authentication Password | `12345678` |
| `AUTH` | Enable Authentication (`true`/`false`) | `true` |
| `ARGO_PAT` / `ARGO_AUTH` | Cloudflare Tunnel Token (Starts tunnel if set) | - |

## Protocols

This project supports three connection modes:

1.  **HTTP Proxy (TCP)**: Port `3000`. Standard HTTP Proxy.
2.  **SOCKS5 Proxy (TCP)**: Port `3001`. Standard SOCKS5 Proxy.
3.  **SOCKS5 Proxy (WebSocket)**: Port `3000` (Path `/`). For Cloudflare Tunnel/CDN.

## Cloudflare Tunnel Configuration (Web UI)

If you are using Cloudflare Tunnel, you only need one rule to support both HTTP and SOCKS5(WS):

1.  Go to **Zero Trust Dashboard** -> **Tunnels** -> **Public Hostname**.
2.  **Add a public hostname**:
    -   **Subdomain**: e.g., `proxy` (Resulting in `proxy.example.com`)
    -   **Service**: `HTTP`
    -   **URL**: `localhost:3000`
3.  **Save**.

*Note: Even though SOCKS5 TCP is on 3001, we recommend using the WebSocket mode on port 3000 for Cloudflare usage. This avoids needing `cloudflared` on the client side.*

## Client Connection Guide

### 1. Direct IP Mode (Public IP)

For VPS or dedicated servers.

-   **HTTP**: `IP:3000` (User/Pass)
-   **SOCKS5**: `IP:3001` (User/Pass)

### 2. Cloudflare Tunnel Mode (Domain Name)

For home servers or NAT environments using Cloudflare Tunnel.
Assuming domain `proxy.example.com` on port `80` (HTTP) or `443` (HTTPS).

#### **Connect via HTTP Proxy**
-   **Tools**: Browser, Curl, etc.
-   **Address**: `proxy.example.com`
-   **Port**: `80` (or `443`)
-   **Auth**: `admin:12345678`

#### **Connect via SOCKS5 Proxy (V2RayN / Clash)**
Uses WebSocket tunneling. No client-side `cloudflared` needed.

**V2RayN Example**:
1.  Add **Socks** Server.
2.  **Address**: `proxy.example.com`
3.  **Port**: `80` (Use 443 if TLS enabled)
4.  **User**: `admin`
5.  **Password**: `12345678`
6.  **Transport**: Select **`ws`**
7.  **Path**: `/`
8.  (Optional) TLS: Enable if using HTTPS.

**Clash Example**:
```yaml
proxies:
  - name: "Socks5-WS"
    type: socks5
    server: proxy.example.com
    port: 80
    username: admin
    password: "12345678"
    tls: false # set true for https
    network: ws
    ws-opts:
      path: "/"
```

## License

ISC
