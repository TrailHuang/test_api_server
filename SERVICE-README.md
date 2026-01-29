# Test API Server - Systemd 服务管理

本文档说明如何使用systemd来管理Test API Server服务。

## 文件说明

- `test-api-server.service` - systemd服务配置文件
- `install-service.sh` - 自动安装脚本（需要sudo）
- `manage-service.sh` - 服务管理脚本
- `SERVICE-README.md` - 本文档

## 快速开始

### 方法1：使用管理脚本（推荐）

```bash
# 安装服务（需要sudo）
sudo ./manage-service.sh install

# 启动服务
sudo ./manage-service.sh start

# 查看服务状态
sudo ./manage-service.sh status

# 查看服务日志
sudo ./manage-service.sh logs

# 实时查看日志
sudo ./manage-service.sh logs -f
```

### 方法2：手动安装

```bash
# 1. 复制服务文件到systemd目录
sudo cp test-api-server.service /etc/systemd/system/

# 2. 重新加载systemd配置
sudo systemctl daemon-reload

# 3. 启用服务（开机自启）
sudo systemctl enable test-api-server

# 4. 启动服务
sudo systemctl start test-api-server

# 5. 检查服务状态
sudo systemctl status test-api-server
```

## 服务管理命令

### 基本操作

```bash
# 启动服务
sudo systemctl start test-api-server

# 停止服务
sudo systemctl stop test-api-server

# 重启服务
sudo systemctl restart test-api-server

# 查看服务状态
sudo systemctl status test-api-server

# 启用开机自启
sudo systemctl enable test-api-server

# 禁用开机自启
sudo systemctl disable test-api-server
```

### 日志管理

```bash
# 查看最近50条日志
sudo journalctl -u test-api-server -n 50

# 实时查看日志
sudo journalctl -u test-api-server -f

# 查看特定时间段的日志
sudo journalctl -u test-api-server --since "2024-01-01 00:00:00" --until "2024-01-02 00:00:00"

# 查看错误日志
sudo journalctl -u test-api-server -p err
```

### 使用管理脚本

```bash
# 查看所有可用命令
./manage-service.sh

# 安装服务
sudo ./manage-service.sh install

# 卸载服务
sudo ./manage-service.sh uninstall

# 启动服务
sudo ./manage-service.sh start

# 停止服务
sudo ./manage-service.sh stop

# 重启服务
sudo ./manage-service.sh restart

# 查看状态
sudo ./manage-service.sh status

# 查看日志
sudo ./manage-service.sh logs

# 启用开机自启
sudo ./manage-service.sh enable

# 禁用开机自启
sudo ./manage-service.sh disable
```

## 服务配置说明

### 服务文件参数

- **Description**: 服务描述
- **User/Group**: 运行服务的用户和组
- **WorkingDirectory**: 应用目录
- **ExecStart**: 启动命令（npm start）
- **Environment**: 环境变量（NODE_ENV=production, PORT=3000）
- **Restart**: 失败时自动重启
- **RestartSec**: 重启间隔（10秒）

### 安全设置

- **NoNewPrivileges**: 禁止获取新权限
- **PrivateTmp**: 使用私有临时目录
- **LimitNOFILE**: 文件描述符限制（65536）

## 故障排除

### 服务启动失败

1. 检查服务状态：`sudo systemctl status test-api-server`
2. 查看详细日志：`sudo journalctl -u test-api-server`
3. 检查端口是否被占用：`sudo netstat -tlnp | grep 3000`
4. 检查应用目录权限：`ls -la /mnt/d/BaiduSyncdisk/my_code/nodejs/test_api_server`

### 权限问题

如果遇到权限问题，确保：
- 应用目录对运行用户可读写
- uploads目录存在且有写权限
- Node.js和npm已正确安装

### 网络问题

如果无法访问服务：
- 检查防火墙设置：`sudo ufw status`
- 确认服务监听的IP地址
- 检查端口是否开放

## 服务信息

- **服务名称**: test-api-server
- **应用目录**: /mnt/d/BaiduSyncdisk/my_code/nodejs/test_api_server
- **运行端口**: 3000
- **日志位置**: systemd journal（使用journalctl查看）

## 注意事项

1. 安装服务需要root权限
2. 确保Node.js和npm已正确安装
3. 应用目录路径需要与实际路径一致
4. 服务运行用户需要有应用目录的读写权限
5. 修改服务配置后需要重新加载：`sudo systemctl daemon-reload`