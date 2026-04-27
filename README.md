# Test API Server - JSON文件管理API服务器

一个基于Node.js和Express.js构建的RESTful API服务器，专门用于管理JSON文件。提供文件上传、下载、列表查看和删除等功能。

## 功能特性

- ✅ JSON文件上传（支持多文件）
- ✅ 文件列表查看
- ✅ 文件内容获取
- ✅ 文件删除
- ✅ 动态文件访问（通过X-FILENAME头）
- ✅ CORS跨域支持
- ✅ 文件大小限制（10MB）
- ✅ 错误处理和日志记录
- ✅ Systemd服务管理

## 技术栈

- **运行时**: Node.js >= 14.0.0
- **框架**: Express.js 4.18.2
- **文件上传**: Multer 2.0.2
- **服务管理**: Systemd

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm (Node.js包管理器)

### 安装依赖

```bash
npm install
```

### 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器默认运行在 `http://localhost:3000`

## API接口文档

### 1. 服务器信息

**GET /**

获取服务器信息和可用接口列表。

**响应示例:**
```json
{
    "message": "JSON文件管理API服务器",
    "endpoints": {
        "GET /files": "获取所有上传的文件列表",
        "GET /files/:filename": "获取指定文件的内容",
        "POST /upload": "上传JSON文件",
        "DELETE /files/:filename": "删除指定文件"
    },
    "usage": {
        "其他路由": "通过X-FILENAME头指定文件名，返回对应文件内容",
        "示例": "curl -H \"X-FILENAME: example.json\" http://localhost:3000/any/path"
    }
}
```

### 2. 获取文件列表

**GET /files**

获取所有已上传的JSON文件列表。

**响应示例:**
```json
{
    "success": true,
    "count": 2,
    "files": [
        {
            "filename": "test.json",
            "size": 1024,
            "uploadTime": "2024-01-01T10:00:00.000Z",
            "path": "/files/test.json"
        }
    ]
}
```

### 3. 获取文件内容

**GET /files/:filename**

获取指定JSON文件的内容。

**参数:**
- `filename`: 文件名（必须以.json结尾）

**响应示例:**
```json
{
    "success": true,
    "filename": "test.json",
    "data": {
        "key": "value"
    }
}
```

### 4. 上传文件

**POST /files**

上传JSON文件到服务器。

**请求头:**
```
Content-Type: multipart/form-data
```

**请求体:**
- `file`: JSON文件（支持多文件）

**响应示例:**
```json
{
    "success": true,
    "message": "文件上传成功",
    "fileInfo": {
        "filename": "test.json",
        "originalName": "test.json",
        "size": 1024,
        "path": "/files/test.json"
    }
}
```

### 5. 删除文件

**DELETE /files/:filename**

删除指定的JSON文件。

**参数:**
- `filename`: 文件名（必须以.json结尾）

**响应示例:**
```json
{
    "success": true,
    "message": "文件删除成功",
    "filename": "test.json"
}
```

### 6. 动态文件访问

**任意路由 + X-FILENAME头**

通过设置HTTP头动态访问文件内容。

**请求头:**
```
X-FILENAME: example.json
```

**示例:**
```bash
curl -H "X-FILENAME: example.json" http://localhost:3000/api/data
```

**响应:** 直接返回JSON文件内容

## 使用示例

### 使用cURL测试接口

```bash
# 获取服务器信息
curl http://localhost:3000/

# 获取文件列表
curl http://localhost:3000/files

# 获取指定文件内容
curl http://localhost:3000/files/test.json

# 上传文件
curl -X POST -F "file=@/path/to/your/file.json" http://localhost:3000/files

# 删除文件
curl -X DELETE http://localhost:3000/files/test.json

# 动态访问文件
curl -H "X-FILENAME: test.json" http://localhost:3000/any/path
```

### 使用JavaScript/Fetch

```javascript
// 获取文件列表
const response = await fetch('http://localhost:3000/files');
const data = await response.json();

// 上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:3000/files', {
    method: 'POST',
    body: formData
});

// 动态访问文件
const dynamicResponse = await fetch('http://localhost:3000/api/data', {
    headers: {
        'X-FILENAME': 'example.json'
    }
});
```

## 系统服务管理

### 安装为Systemd服务

使用提供的脚本自动安装为系统服务：

```bash
# 需要sudo权限
sudo ./install-service.sh
```

### 手动安装Systemd服务

```bash
# 1. 创建服务文件
sudo cp test-api-server.service /etc/systemd/system/

# 2. 重新加载配置
sudo systemctl daemon-reload

# 3. 启用服务
sudo systemctl enable test-api-server

# 4. 启动服务
sudo systemctl start test-api-server

# 5. 检查状态
sudo systemctl status test-api-server
```

### 服务管理命令

```bash
# 启动服务
sudo systemctl start test-api-server

# 停止服务
sudo systemctl stop test-api-server

# 重启服务
sudo systemctl restart test-api-server

# 查看状态
sudo systemctl status test-api-server

# 查看日志
sudo journalctl -u test-api-server -f

# 启用开机自启
sudo systemctl enable test-api-server

# 禁用开机自启
sudo systemctl disable test-api-server
```

## 配置说明

### 环境变量

- `PORT`: 服务器端口（默认: 3000）
- `NODE_ENV`: 运行环境（默认: production）

### 文件存储

- 上传文件存储在 `./uploads/` 目录
- 只支持JSON文件格式
- 单个文件大小限制：10MB
- 文件名会自动清理特殊字符

### 安全特性

- CORS跨域支持
- 文件类型验证
- 文件大小限制
- 错误处理和日志记录
- Systemd安全配置

## 错误处理

服务器提供统一的错误响应格式：

```json
{
    "success": false,
    "error": "错误描述",
    "message": "详细错误信息"
}
```

### 常见错误码

- `400`: 请求参数错误
- `404`: 文件不存在
- `413`: 文件大小超限
- `500`: 服务器内部错误

## 开发说明

### 项目结构

```
test-api-server/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── package-lock.json      # 依赖锁定
├── uploads/               # 文件存储目录
├── install-service.sh     # 服务安装脚本
├── SERVICE-README.md      # 服务管理文档
└── README.md             # 本文档
```

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产部署

```bash
# 安装依赖
npm install --production

# 启动生产服务器
npm start

# 或使用PM2等进程管理器
pm2 start server.js --name "test-api-server"
```

## 许可证

MIT License

## 支持与贡献

如有问题或建议，请提交Issue或Pull Request。