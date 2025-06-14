# Ejemplos de uso de los servidores API

## Iniciar los servidores

### Node.js Server (Puerto 3000)
```bash
npm install
npm start
```

### Python Server (Puerto 5000)
```bash
pip install -r requirements.txt
python server.py
```

## Endpoints OpenAI-Compatible

### 1. Obtener modelos disponibles

```bash
# Node.js server
curl http://localhost:3000/v1/models

# Python server
curl http://localhost:5000/v1/models
```

### 2. Chat Completions

```bash
# Node.js server
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a Python function to calculate factorial"}
    ],
    "max_tokens": 1000,
    "temperature": 0.3
  }'

# Python server
curl -X POST http://localhost:5000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Write a Python function to calculate factorial"}
    ],
    "max_tokens": 1000,
    "temperature": 0.3
  }'
```

## Compatibilidad con librerías OpenAI

### JavaScript/Node.js
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'dummy-key' // No se usa pero es requerido
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ]
});

console.log(completion.choices[0].message.content);
```

### Python
```python
import openai

# Configurar cliente para usar nuestro servidor local
openai.api_base = "http://localhost:5000/v1"
openai.api_key = "dummy-key"  # No se usa pero es requerido

response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello, how are you?"}
    ]
)

print(response.choices[0].message.content)
```

### Python con requests directamente
```python
import requests

response = requests.post('http://localhost:5000/v1/chat/completions', 
    headers={'Content-Type': 'application/json'},
    json={
        'messages': [
            {'role': 'user', 'content': 'Hello, how are you?'}
        ],
        'max_tokens': 1000,
        'temperature': 0.3
    }
)

print(response.json()['choices'][0]['message']['content'])
```

## Health Check

```bash
# Node.js server
curl http://localhost:3000/health

# Python server
curl http://localhost:5000/health
```

## Características

- ✅ **Endpoints OpenAI-compatible**: `/v1/models` y `/v1/chat/completions`
- ✅ **Auto-refresh de tokens**: Los servidores manejan automáticamente la renovación de tokens
- ✅ **CORS habilitado**: Permite requests desde navegadores web
- ✅ **Manejo de errores**: Respuestas de error en formato OpenAI
- ✅ **Logging**: Registro de todas las requests
- ✅ **Health checks**: Endpoint para verificar el estado del servicio

## Configuración de producción

### Variables de entorno
```bash
# Puerto personalizado
PORT=8080 node server.js
PORT=8080 python server.py
```

### Docker (opcional)
```dockerfile
# Dockerfile para Node.js
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Dockerfile para Python
FROM python:3.9-alpine
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "server.py"]
```
