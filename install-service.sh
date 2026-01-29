#!/bin/bash

# 安装脚本：设置test-api-server的systemd服务

echo "=== 安装Test API Server系统服务 ==="
echo

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

# 服务配置
SERVICE_NAME="test-api-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
APP_DIR="$(pwd)"
USER_NAME="$SUDO_USER"

# 检查应用目录是否存在
if [ ! -d "$APP_DIR" ]; then
    echo "错误: 应用目录不存在: $APP_DIR"
    echo "请确保路径正确"
    exit 1
fi

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装"
    exit 1
fi

# 创建systemd服务文件
echo "创建systemd服务文件..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Test API Server - JSON文件管理API服务器
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER_NAME
Group=$USER_NAME
WorkingDirectory=$APP_DIR
ExecStart=$(which npm) start
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=10

# 环境变量
Environment=NODE_ENV=production
Environment=PORT=3000

# 安全设置
NoNewPrivileges=true
PrivateTmp=true

# 资源限制
LimitNOFILE=65536

# 日志设置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

echo "✓ 服务文件创建完成: $SERVICE_FILE"

# 重新加载systemd配置
echo "重新加载systemd配置..."
systemctl daemon-reload
echo "✓ systemd配置已重新加载"

# 启用服务
echo "启用服务..."
systemctl enable $SERVICE_NAME
echo "✓ 服务已启用"

# 启动服务
echo "启动服务..."
systemctl start $SERVICE_NAME
echo "✓ 服务已启动"

# 显示服务状态
echo "服务状态:"
systemctl status $SERVICE_NAME --no-pager

echo
echo "=== 安装完成 ==="
echo "服务名称: $SERVICE_NAME"
echo "应用目录: $APP_DIR"
echo "运行用户: $USER_NAME"
echo
echo "常用命令:"
echo "  sudo systemctl start $SERVICE_NAME    # 启动服务"
echo "  sudo systemctl stop $SERVICE_NAME     # 停止服务"
echo "  sudo systemctl restart $SERVICE_NAME  # 重启服务"
echo "  sudo systemctl status $SERVICE_NAME   # 查看状态"
echo "  sudo journalctl -u $SERVICE_NAME -f   # 查看日志"
echo
echo "服务将在系统启动时自动运行"