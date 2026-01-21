const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const JSON_FILE_PATH = path.join(__dirname, 'CEACABCF98FDD0193E7342A528AF9A0D');

let cachedResponse = null;

function loadJsonResponse() {
    try {
        if (fs.existsSync(JSON_FILE_PATH)) {
            const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
            cachedResponse = JSON.parse(fileContent);
            console.log('JSON文件加载成功');
        } else {
            console.error('JSON文件不存在:', JSON_FILE_PATH);
            cachedResponse = { error: 'JSON文件不存在' };
        }
    } catch (error) {
        console.error('加载JSON文件时出错:', error.message);
        cachedResponse = { error: '无法解析JSON文件' };
    }
}

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

app.all('*', (req, res) => {
    if (!cachedResponse) {
        loadJsonResponse();
    }
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    res.json(cachedResponse);
});

app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ 
        error: '服务器内部错误',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('所有API请求都将返回指定的JSON内容');
    
    loadJsonResponse();
});

process.on('SIGINT', () => {
    console.log('\n服务器正在关闭...');
    process.exit(0);
});