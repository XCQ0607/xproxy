# xProxy - 轻量级 Node.js HTTP/SOCKS5 代理服务器

[English](./README_EN.md) | [中文](./README.md)

本项目是一个轻量级的 Node.js 代理服务器，同时支持 HTTP 和 SOCKS5 协议，并支持用户名/密码认证。

**项目地址**: [https://github.com/xproxy](https://github.com/xproxy)

## 功能特性

- **双协议支持**: 
  - HTTP 代理 (默认端口 3000)
  - SOCKS5 代理 (默认端口 3001)
- **身份验证**: 支持 Basic Auth (HTTP) 和 用户名/密码 (SOCKS5)。
- **配置灵活**: 所有配置均可通过环境变量覆盖。
- **开箱即用**: 提供 Docker 镜像，一键部署。

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `HTTP_PORT` | HTTP 代理监听端口 | `3000` |
| `SOCKS5_PORT` | SOCKS5 代理监听端口 | `3001` |
| `USER` | 代理认证用户名 | `admin` |
| `PASSWORD` | 代理认证密码 | `12345678` |

## 快速开始

### 方式一：使用 Docker (推荐)

我们提供了预构建的 Docker 镜像：`ghcr.io/xcq0607/xproxy:latest`

**运行命令：**

```bash
docker run -d \
  --name xproxy \
  -p 3000:3000 \
  -p 3001:3001 \
  -e USER=myusername \
  -e PASSWORD=mypassword \
  ghcr.io/xcq0607/xproxy:latest
```

运行后：
- HTTP 代理地址: `http://myusername:mypassword@<IP>:3000`
- SOCKS5 代理地址: `socks5://myusername:mypassword@<IP>:3001`

### 方式二：使用 Node.js

如果你想在本地直接运行源码：

1.  **克隆代码 (或下载源码)**
    ```bash
    git clone https://github.com/xproxy
    cd xproxy
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **运行**
    ```bash
    # 默认配置启动
    npm start

    # 自定义配置启动 (Linux/Mac)
    USER=myuser PASSWORD=mypass HTTP_PORT=8080 npm start
    
    # 自定义配置启动 (Windows PowerShell)
    $env:USER="myuser"; $env:PASSWORD="mypass"; npm start
    ```

## 验证连接

使用 `curl` 进行测试：

**测试 HTTP 代理:**
```bash
curl -x http://admin:12345678@localhost:3000 http://example.com
```

**测试 SOCKS5 代理:**
```bash
curl -x socks5h://admin:12345678@localhost:3001 http://example.com
```

## 许可证

ISC
