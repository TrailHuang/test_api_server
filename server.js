const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, originalName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传JSON文件'), false);
        }
    }
});

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FILENAME');
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: 'JSON文件管理API服务器',
        endpoints: {
            'GET /files': '获取所有上传的文件列表',
            'GET /files/:filename': '获取指定文件的内容',
            'POST /upload': '上传JSON文件',
            'DELETE /files/:filename': '删除指定文件'
        },
        usage: {
            '其他路由': '通过X-FILENAME头指定文件名，返回对应文件内容',
            '示例': 'curl -H "X-FILENAME: example.json" http://localhost:3000/any/path'
        }
    });
});

app.get('/files', (req, res) => {
    try {
        const files = fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(UPLOADS_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    uploadTime: stats.mtime,
                    path: `/files/${file}`
                };
            });

        res.json({
            success: true,
            count: files.length,
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '读取文件列表失败',
            message: error.message
        });
    }
});

app.get('/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(UPLOADS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }

        if (!filename.endsWith('.json')) {
            return res.status(400).json({
                success: false,
                error: '只支持JSON文件'
            });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
            success: true,
            filename: filename,
            data: jsonData
        });

    } catch (error) {
        if (error instanceof SyntaxError) {
            res.status(400).json({
                success: false,
                error: '文件内容不是有效的JSON格式'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '读取文件失败',
                message: error.message
            });
        }
    }
});

app.post('/upload', upload.any(), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请选择要上传的JSON文件'
            });
        }

        const file = req.files[0];

        const filePath = file.path;
        const fileContent = fs.readFileSync(filePath, 'utf8');

        JSON.parse(fileContent);

        res.status(201).json({
            success: true,
            message: '文件上传成功',
            fileInfo: {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                path: `/files/${file.filename}`
            }
        });

    } catch (error) {
        if (file) {
            fs.unlinkSync(file.path);
        }

        if (error instanceof SyntaxError) {
            res.status(400).json({
                success: false,
                error: '上传的文件不是有效的JSON格式'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '文件上传失败',
                message: error.message
            });
        }
    }
});

app.delete('/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(UPLOADS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }

        if (!filename.endsWith('.json')) {
            return res.status(400).json({
                success: false,
                error: '只支持删除JSON文件'
            });
        }

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: '文件删除成功',
            filename: filename
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '文件删除失败',
            message: error.message
        });
    }
});

app.options('*', (req, res) => {
    res.status(200).end();
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: '文件大小超过限制（最大10MB）'
            });
        }
    }

    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

app.use((req, res, next) => {
    const filename = req.headers['x-filename'];

    if (!filename) {
        return res.status(400).json({
            success: false,
            error: '缺少X-FILENAME头，请指定要访问的文件名'
        });
    }

    if (!filename.endsWith('.json')) {
        return res.status(400).json({
            success: false,
            error: '只支持JSON文件，文件名必须以.json结尾'
        });
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: `文件不存在: ${filename}`,
            availableFiles: getAvailableFiles()
        });
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(jsonData);
    } catch (error) {
        if (error instanceof SyntaxError) {
            res.status(400).json({
                success: false,
                error: '文件内容不是有效的JSON格式'
            });
        } else {
            res.status(500).json({
                success: false,
                error: '读取文件失败',
                message: error.message
            });
        }
    }
});

function getAvailableFiles() {
    try {
        return fs.readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                filename: file,
                path: `/files/${file}`
            }));
    } catch (error) {
        return [];
    }
}

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.path
    });
});

app.listen(PORT, () => {
    console.log(`JSON文件管理服务器运行在 http://localhost:${PORT}`);
    console.log('上传目录:', UPLOADS_DIR);
    console.log('可用接口:');
    console.log('  GET  /          - 服务器信息');
    console.log('  GET  /files     - 获取文件列表');
    console.log('  GET  /files/:filename - 获取指定文件内容');
    console.log('  POST /upload    - 上传JSON文件');
    console.log('  DELETE /files/:filename - 删除文件');
});

process.on('SIGINT', () => {
    console.log('\n服务器正在关闭...');
    process.exit(0);
});