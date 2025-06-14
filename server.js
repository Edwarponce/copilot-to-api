const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

class CopilotAPI {
    constructor(configPath = './config.json') {
        this.configPath = configPath;
        this.config = this.loadConfig();
        this.copilotToken = null;
        this.tokenExpiry = null;
    }

    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('Error loading config:', error.message);
            process.exit(1);
        }
    }

    async makeRequest(options, data = null) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve({ status: res.statusCode, data: response });
                    } catch (error) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', reject);
            
            if (data) {
                req.write(typeof data === 'string' ? data : JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async refreshCopilotToken() {
        console.log('🔄 Refreshing Copilot token...');
        
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path: '/copilot_internal/v2/token',
            method: 'GET',
            headers: {
                'authorization': `token ${this.config.access_token}`,
                'user-agent': 'GithubCopilot/1.155.0'
            }
        };

        try {
            const response = await this.makeRequest(options);
            
            if (response.status === 200) {
                this.copilotToken = response.data.token;
                this.tokenExpiry = Date.now() + (24 * 60 * 1000); // 24 minutos
                console.log('✅ Copilot token refreshed successfully');
                return true;
            } else {
                console.error('❌ Error refreshing token:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ Network error refreshing token:', error.message);
            return false;
        }
    }

    async ensureValidToken() {
        if (!this.copilotToken || !this.tokenExpiry || Date.now() > this.tokenExpiry) {
            const success = await this.refreshCopilotToken();
            if (!success) {
                throw new Error('Failed to obtain valid Copilot token');
            }
        }
    }

    async getModels() {
        await this.ensureValidToken();
        
        const options = {
            hostname: 'api.githubcopilot.com',
            port: 443,
            path: '/models',
            method: 'GET',
            headers: {
                'authorization': `Bearer ${this.copilotToken}`,
                'Copilot-Integration-Id': 'vscode-chat'
            }
        };

        const response = await this.makeRequest(options);
        return response;
    }

    async chatCompletion(messages, options = {}) {
        await this.ensureValidToken();
        
        const requestData = {
            messages: messages,
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.3,
            stream: options.stream || false,
            model: options.model || 'gpt-4o' // OpenAI compatibility
        };

        const httpOptions = {
            hostname: 'api.githubcopilot.com',
            port: 443,
            path: '/chat/completions',
            method: 'POST',
            headers: {
                'authorization': `Bearer ${this.copilotToken}`,
                'Copilot-Integration-Id': 'vscode-chat',
                'content-type': 'application/json'
            }
        };

        const response = await this.makeRequest(httpOptions, requestData);
        return response;
    }
}

// Crear servidor Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Crear instancia de CopilotAPI
const copilot = new CopilotAPI();

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Endpoint de salud
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'copilot-api-server' 
    });
});

// Endpoint para obtener modelos (OpenAI compatible)
app.get('/v1/models', async (req, res) => {
    try {
        const response = await copilot.getModels();
        
        if (response.status === 200) {
            res.json(response.data);
        } else {
            res.status(response.status).json({
                error: {
                    message: response.data,
                    type: 'api_error',
                    code: response.status
                }
            });
        }
    } catch (error) {
        console.error('Error in /v1/models:', error);
        res.status(500).json({
            error: {
                message: error.message,
                type: 'internal_error',
                code: 500
            }
        });
    }
});

// Endpoint para chat completions (OpenAI compatible)
app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { messages, max_tokens, temperature, stream, model } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: {
                    message: 'messages field is required and must be an array',
                    type: 'invalid_request_error',
                    code: 400
                }
            });
        }

        const options = {
            max_tokens: max_tokens || 1000,
            temperature: temperature || 0.3,
            stream: stream || false,
            model: model || 'gpt-4o'
        };

        const response = await copilot.chatCompletion(messages, options);
        
        if (response.status === 200) {
            res.json(response.data);
        } else {
            res.status(response.status).json({
                error: {
                    message: response.data,
                    type: 'api_error',
                    code: response.status
                }
            });
        }
    } catch (error) {
        console.error('Error in /v1/chat/completions:', error);
        res.status(500).json({
            error: {
                message: error.message,
                type: 'internal_error',
                code: 500
            }
        });
    }
});

// Endpoint raíz con información de la API
app.get('/', (req, res) => {
    res.json({
        service: 'GitHub Copilot to OpenAI API Bridge',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            models: 'GET /v1/models',
            chat_completions: 'POST /v1/chat/completions'
        },
        documentation: 'https://platform.openai.com/docs/api-reference',
        note: 'This service provides OpenAI-compatible endpoints for GitHub Copilot'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            message: `Route ${req.method} ${req.originalUrl} not found`,
            type: 'not_found_error',
            code: 404
        }
    });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: {
            message: 'Internal server error',
            type: 'internal_error',
            code: 500
        }
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Copilot API Server running on port ${port}`);
    console.log(`📖 OpenAI-compatible endpoints:`);
    console.log(`   GET  http://localhost:${port}/v1/models`);
    console.log(`   POST http://localhost:${port}/v1/chat/completions`);
    console.log(`💡 Health check: http://localhost:${port}/health`);
});

module.exports = { app, CopilotAPI };
