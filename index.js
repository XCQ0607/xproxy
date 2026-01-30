require('dotenv').config();
const http = require('http');
const net = require('net');
const url = require('url');
const dns = require('dns');

// Set default DNS to Cloudflare and Google
try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    console.log('DNS set to 1.1.1.1 and 8.8.8.8');
} catch (e) {
    console.warn('Failed to set custom DNS:', e.message);
}

const HTTP_PORT = process.env.HTTP_PORT || 3000;
const SOCKS5_PORT = process.env.SOCKS5_PORT || 3001;
const USER = process.env.USER || 'admin';
const PASSWORD = process.env.PASSWORD || '12345678';
const AUTH = process.env.AUTH !== 'false'; // Default to true

const HTTP_AUTH_HEADER = 'Basic ' + Buffer.from(`${USER}:${PASSWORD}`).toString('base64');

// --- HTTP Proxy ---

const requestHandler = (req, res) => {
    // Proxy Authentication
    if (AUTH) {
        const auth = req.headers['proxy-authorization'];
        if (auth !== HTTP_AUTH_HEADER) {
            res.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="Proxy"' });
            res.end('Proxy Authentication Required');
            return;
        }
    }

    const parsedUrl = url.parse(req.url);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: req.method,
        headers: req.headers,
    };

    // Remove Proxy-Authorization header to not leak credentials to upstream
    delete options.headers['proxy-authorization'];

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('HTTP Proxy Request Error:', err.message);
        res.writeHead(500);
        res.end('Proxy Error');
    });

    req.pipe(proxyReq, { end: true });
};

const httpServer = http.createServer(requestHandler);

httpServer.on('connect', (req, clientSocket, head) => {
    // Proxy Authentication for tunnels
    if (AUTH) {
        const auth = req.headers['proxy-authorization'];
        if (auth !== HTTP_AUTH_HEADER) {
            clientSocket.write('HTTP/1.1 407 Proxy Authentication Required\r\n' +
                'Proxy-Authenticate: Basic realm="Proxy"\r\n\r\n');
            clientSocket.end();
            return;
        }
    }

    const { port, hostname } = url.parse(`//${req.url}`, false, true);

    const serverSocket = net.connect(port || 443, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node.js-Proxy\r\n\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err) => {
        console.error('HTTP Proxy Connect Error:', err.message);
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        console.error('HTTP Proxy Client Socket Error:', err.message);
        serverSocket.end();
    });
});

httpServer.listen(HTTP_PORT, () => {
    console.log(`HTTP Proxy listening on port ${HTTP_PORT}`);
});

// --- SOCKS5 Proxy ---

const socks5Server = net.createServer((socket) => {
    socket.once('data', (data) => {
        // SOCKS5 Version Identifier/Method Selection
        if (data[0] !== 0x05) {
            socket.end();
            return;
        }

        const nMethods = data[1];
        const methods = data.slice(2, 2 + nMethods);

        if (AUTH) {
            // Provide 0x02 (Username/Password Auth) if supported, else 0xFF (No Acceptable Methods)
            if (methods.includes(0x02)) {
                socket.write(Buffer.from([0x05, 0x02]));
                socket.once('data', (authData) => {
                    if (authData[0] !== 0x01) { // Auth version must be 1
                        socket.end();
                        return;
                    }

                    const ulen = authData[1];
                    const uname = authData.slice(2, 2 + ulen).toString();
                    const plen = authData[2 + ulen];
                    const passwd = authData.slice(3 + ulen, 3 + ulen + plen).toString();

                    if (uname === USER && passwd === PASSWORD) {
                        socket.write(Buffer.from([0x01, 0x00])); // Success
                        handleSocksRequest(socket);
                    } else {
                        socket.write(Buffer.from([0x01, 0x01])); // Failure
                        socket.end();
                    }
                });
            } else {
                socket.write(Buffer.from([0x05, 0xFF]));
                socket.end();
            }
        } else {
            // NO AUTHENTICATION REQUIRED
            socket.write(Buffer.from([0x05, 0x00]));
            handleSocksRequest(socket);
        }
    });
});

function handleSocksRequest(socket) {
    socket.once('data', (data) => {
        // Version 5, CMD 1 (CONNECT), RSV 0
        if (data[0] !== 0x05 || data[1] !== 0x01 || data[2] !== 0x00) {
            // We only support CONNECT
            socket.end();
            return;
        }

        let addrType = data[3];
        let host;
        let port;
        let addrLen = 0;

        if (addrType === 0x01) { // IPv4
            host = data.slice(4, 8).join('.');
            port = data.readUInt16BE(8);
            addrLen = 10;
        } else if (addrType === 0x03) { // Domain name
            const domainLen = data[4];
            host = data.slice(5, 5 + domainLen).toString();
            port = data.readUInt16BE(5 + domainLen);
            addrLen = 5 + domainLen + 2;
        } else if (addrType === 0x04) { // IPv6
            // Not implemented for this simple example, or you can implement it
            // socket.write(...) - Address type not supported
            socket.end();
            return;
        } else {
            socket.end();
            return;
        }

        const proxySocket = net.connect(port, host, () => {
            // Reply success
            const buffer = Buffer.alloc(addrLen);
            data.copy(buffer, 0, 0, addrLen);
            buffer[1] = 0x00; // Success reply
            socket.write(buffer);

            socket.pipe(proxySocket);
            proxySocket.pipe(socket);
        });

        proxySocket.on('error', (err) => {
            console.error('SOCKS5 Connect Error:', err.message);
            // Could send specific SOCKS5 error codes here
            socket.end();
        });

        socket.on('error', (err) => {
            console.error('SOCKS5 Client Error:', err.message);
            proxySocket.end();
        });
    });
}

socks5Server.listen(SOCKS5_PORT, () => {
    console.log(`SOCKS5 Proxy listening on port ${SOCKS5_PORT}`);
    printConnectionInfo();
});


function printConnectionInfo() {
    http.get('http://api.ipify.org', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const publicIp = data.trim();
            console.log('---------------------------------------------------------');
            if (AUTH) {
                console.log(`HTTP Proxy:   http://${USER}:${PASSWORD}@${publicIp}:${HTTP_PORT}`);
                console.log(`SOCKS5 Proxy: socks5://${USER}:${PASSWORD}@${publicIp}:${SOCKS5_PORT}`);
            } else {
                console.log(`HTTP Proxy:   http://${publicIp}:${HTTP_PORT}`);
                console.log(`SOCKS5 Proxy: socks5://${publicIp}:${SOCKS5_PORT}`);
            }
            console.log('---------------------------------------------------------');
        });
    }).on('error', (err) => {
        console.error('Failed to fetch public IP:', err.message);
        console.log('---------------------------------------------------------');
        if (AUTH) {
            console.log(`HTTP Proxy:   http://${USER}:${PASSWORD}@localhost:${HTTP_PORT}`);
            console.log(`SOCKS5 Proxy: socks5://${USER}:${PASSWORD}@localhost:${SOCKS5_PORT}`);
        } else {
            console.log(`HTTP Proxy:   http://localhost:${HTTP_PORT}`);
            console.log(`SOCKS5 Proxy: socks5://localhost:${SOCKS5_PORT}`);
        }
        console.log('---------------------------------------------------------');
    });
}

// --- Cloudflared Logic ---

const ARGO_PAT = process.env.ARGO_PAT || process.env.ARGO_AUTH;

if (ARGO_PAT) {
    downloadAndStartCloudflared();
}

function downloadAndStartCloudflared() {
    const platform = process.platform;
    const arch = process.arch;
    let url = '';
    let filename = 'cloudflared';

    if (platform === 'linux') {
        if (arch === 'x64') {
            url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
        } else if (arch === 'arm64') {
            url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64';
        } else {
            console.warn(`Unsupported architecture for cloudflared: ${arch}`);
            return;
        }
    } else if (platform === 'darwin') {
        if (arch === 'x64') {
            url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64';
        } else if (arch === 'arm64') {
            url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64';
        }
    } else if (platform === 'win32') {
        url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
        filename = 'cloudflared.exe';
    } else {
        console.warn(`Unsupported platform for cloudflared: ${platform}`);
        return;
    }

    if (!url) {
        console.warn('Could not determine cloudflared download URL.');
        return;
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, filename);
    const https = require('https');
    const { spawn } = require('child_process');

    if (fs.existsSync(filePath)) {
        console.log('Cloudflared binary already exists.');
        runCloudflared(filePath);
        return;
    }

    console.log(`Downloading cloudflared from ${url}...`);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
        if (response.statusCode !== 200) {
            console.error(`Failed to download cloudflared. Status Code: ${response.statusCode}`);
            return;
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log('Download completed.');
                if (platform !== 'win32') {
                    fs.chmodSync(filePath, '755');
                }
                runCloudflared(filePath);
            });
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => { });
        console.error('Error downloading cloudflared:', err.message);
    });

    function runCloudflared(binPath) {
        console.log('Starting Cloudflared Tunnel...');
        // ARGO_PAT is assumed to be the Token.
        const args = ['tunnel', '--no-autoupdate', 'run', '--token', ARGO_PAT];

        // Pass stdio to inherit to see output in main console
        const child = spawn(binPath, args);

        child.stdout.on('data', (data) => {
            console.log(`[Cloudflared] ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`[Cloudflared] ${data}`);
        });

        child.on('close', (code) => {
            console.log(`Cloudflared process exited with code ${code}`);
        });

        child.on('error', (err) => {
            console.error('Failed to start Cloudflared:', err);
        });
    }
}
