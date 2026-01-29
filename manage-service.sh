#!/bin/bash

# 服务管理脚本
SERVICE_NAME="test-api-server"

# 显示使用说明
show_help() {
    echo "用法: $0 {start|stop|restart|status|logs|enable|disable|install|uninstall}"
    echo
    echo "命令说明:"
    echo "  start     - 启动服务"
    echo "  stop      - 停止服务"
    echo "  restart   - 重启服务"
    echo "  status    - 查看服务状态"
    echo "  logs      - 查看服务日志"
    echo "  enable    - 启用开机自启"
    echo "  disable   - 禁用开机自启"
    echo "  install   - 安装服务（需要sudo）"
    echo "  uninstall - 卸载服务（需要sudo）"
}

# 检查权限
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        echo "错误: 此操作需要root权限，请使用sudo"
        exit 1
    fi
}

# 检查服务文件是否存在
check_service() {
    if [ ! -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
        echo "错误: 服务文件不存在，请先运行 'sudo $0 install'"
        exit 1
    fi
}

# 安装服务
install_service() {
    check_root
    
    echo "正在安装 $SERVICE_NAME 服务..."
    
    # 创建服务文件
    cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=Test API Server - JSON文件管理API服务器
After=network.target
Wants=network.target

[Service]
Type=simple
User=$SUDO_USER
Group=$SUDO_USER
WorkingDirectory=/mnt/d/BaiduSyncdisk/my_code/nodejs/test_api_server
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

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    echo "✓ 服务安装完成"
    echo "运行 'sudo $0 start' 启动服务"
}

# 卸载服务
uninstall_service() {
    check_root
    
    echo "正在卸载 $SERVICE_NAME 服务..."
    
    systemctl stop $SERVICE_NAME 2>/dev/null || true
    systemctl disable $SERVICE_NAME 2>/dev/null || true
    rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
    systemctl daemon-reload
    systemctl reset-failed
    
    echo "✓ 服务卸载完成"
}

# 启动服务
start_service() {
    check_service
    sudo systemctl start $SERVICE_NAME
    echo "服务启动命令已发送"
    sleep 2
    status_service
}

# 停止服务
stop_service() {
    check_service
    sudo systemctl stop $SERVICE_NAME
    echo "服务停止命令已发送"
    sleep 1
    status_service
}

# 重启服务
restart_service() {
    check_service
    sudo systemctl restart $SERVICE_NAME
    echo "服务重启命令已发送"
    sleep 2
    status_service
}

# 查看状态
status_service() {
    check_service
    sudo systemctl status $SERVICE_NAME --no-pager
}

# 查看日志
logs_service() {
    check_service
    if [ "$1" = "-f" ]; then
        sudo journalctl -u $SERVICE_NAME -f
    else
        sudo journalctl -u $SERVICE_NAME --no-pager -n 50
    fi
}

# 启用开机自启
enable_service() {
    check_service
    sudo systemctl enable $SERVICE_NAME
    echo "✓ 开机自启已启用"
}

# 禁用开机自启
disable_service() {
    check_service
    sudo systemctl disable $SERVICE_NAME
    echo "✓ 开机自启已禁用"
}

# 主程序
case "$1" in
    install)
        install_service
        ;;
    uninstall)
        uninstall_service
        ;;
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        status_service
        ;;
    logs)
        logs_service "$2"
        ;;
    enable)
        enable_service
        ;;
    disable)
        disable_service
        ;;
    *)
        show_help
        exit 1
        ;;
esac