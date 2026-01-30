# xProxy - 轻量级 Node.js HTTP/SOCKS5 代理服务器

[English](./README_EN.md) | [中文](./README.md)

本项目是一个轻量级的 Node.js 代理服务器，同时支持 HTTP 和 SOCKS5 协议，并支持用户名/密码认证。

**项目地址**: [https://github.com/xproxy](https://github.com/xproxy)

## 功能特性

- **双协议支持**: 
  - HTTP 代理 (默认端口 3000)
  - SOCKS5 代理 (默认端口 3001)
- **身份验证**: 支持 Basic Auth (HTTP) 和 用户名/密码 (SOCKS5)。可关闭。
- **内网穿透**: 集成 Cloudflared Tunnel，支持 `ARGO_PAT` 自动启动。
- **自定义 DNS**: 默认使用 `1.1.1.1` 和 `8.8.8.8` 进行解析，优化海外连接。
- **配置灵活**: 所有配置均可通过环境变量覆盖。
- **开箱即用**: 提供 Docker 镜像，一键部署。

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `HTTP_PORT` | HTTP 代理监听端口 | `3000` |
| `SOCKS5_PORT` | SOCKS5 代理监听端口 | `3001` |
| `USER` | 代理认证用户名 | `admin` |
| `PASSWORD` | 代理认证密码 | `12345678` |
| `AUTH` | 是否开启认证 (`true`/`false`) | `true` |
| `ARGO_PAT` / `ARGO_AUTH` | Cloudflare Tunnel Token (有值则启动 Tunnel) | - |

## 协议说明

本项目提供三种连接方式，适应不同场景：

1.  **HTTP 代理 (TCP)**: 监听端口 `3000`。标准的 HTTP 代理。
2.  **SOCKS5 代理 (TCP)**: 监听端口 `3001`。标准的 SOCKS5 代理。
3.  **SOCKS5 代理 (WebSocket)**: 监听端口 `3000` (路径 `/`)。用于 Cloudflare CDN/Tunnel 穿透。

## Cloudflare Tunnel 配置指南 (网页端)

如果你使用 Cloudflare Tunnel 进行内网穿透，只需配置一条规则即可同时支持 HTTP 和 SOCKS5(WS) 代理：

1.  进入 **Zero Trust Dashboard** -> **Tunnels** -> **Public Hostname**。
2.  **Add a public hostname**：
    -   **Subdomain (子域名)**: 例如 `proxy` (你的完整域名如 `proxy.example.com`)
    -   **Service (服务)**: `HTTP`
    -   **URL**: `localhost:3000`
3.  **保存**。

*注意：虽然 SOCKS5 (TCP) 在 3001 端口，但通过 Cloudflare 穿透时，推荐使用 3000 端口的 WebSocket 模式，这样客户端无需安装 cloudflared 即可连接。*

## 客户端连接指南

### 1. 直连模式 (使用公网 IP)

适用于 VPS 或有公网 IP 的环境。

-   **HTTP**: `IP:3000` (用户/密码)
-   **SOCKS5**: `IP:3001` (用户/密码)

### 2. Cloudflare 穿透模式 (使用域名)

适用于家庭宽带或无公网 IP 环境，已配置 Cloudflare Tunnel。
假设域名为 `proxy.example.com`，端口为 `80` (HTTP) 或 `443` (HTTPS)。

#### **连接 HTTP 代理**
-   **软件**: 浏览器插件 (SwitchyOmega),curl 等。
-   **地址**: `proxy.example.com`
-   **端口**: `80` (或 `443`)
-   **认证**: `admin:12345678`

#### **连接 SOCKS5 代理 (V2RayN / Clash)**
通过 WebSocket 穿透，无需客户端安装 cloudflared。

**V2RayN 配置示例**:
1.  添加 **Socks** 服务器。
2.  **地址 (Address)**: `proxy.example.com`
3.  **端口 (Port)**: `80` (开启 TLS 则为 443)
4.  **用户 (User)**: `admin` (如果有)
5.  **密码 (Pass)**: `12345678`
6.  **传输协议 (Transport)**: 选择 **`ws`**
7.  **路径 (Path)**: `/`
8.  (可选) 如果是 https 域名，传输层安全 (TLS) 选 `tls`。

**Clash 配置示例**:
```yaml
proxies:
  - name: "Socks5-WS"
    type: socks5
    server: proxy.example.com
    port: 80
    username: admin
    password: "12345678"
    tls: false # 如果是 https 则 true
    network: ws
    ws-opts:
      path: "/"
```

## 许可证

ISC
