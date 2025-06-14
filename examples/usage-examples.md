# Ejemplo de uso de los scripts de automatización

## Setup inicial

1. **Configurar el access token** en `config.json`:
   ```json
   {
     "access_token": "tu_access_token_aqui",
     "client_id": "Iv1.b507a08c87ecfe98"
   }
   ```

2. **Para Python**, instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

## Ejemplos de uso

### Node.js

```bash
# Ver modelos disponibles
node copilot-client.js models

# Hacer una pregunta
node copilot-client.js chat "Write a function to calculate fibonacci numbers"

# Con opciones personalizadas
node copilot-client.js chat "Explain machine learning" --max-tokens 500 --temperature 0.7

# Enviar contenido de un archivo
echo "How can I optimize this code?" > prompt.txt
node copilot-client.js chat-file prompt.txt
```

### Python

```bash
# Ver modelos disponibles
python copilot_client.py models

# Hacer una pregunta
python copilot_client.py chat "Write a function to calculate fibonacci numbers"

# Con opciones personalizadas
python copilot_client.py chat "Explain machine learning" --max-tokens 500 --temperature 0.7

# Enviar contenido de un archivo
echo "How can I optimize this code?" > prompt.txt
python copilot_client.py chat-file prompt.txt
```

## Características principales

- ✅ **Auto-refresh del token**: Los scripts detectan automáticamente cuando el token expira (cada 25 minutos) y lo renuevan
- ✅ **Gestión de errores**: Manejo robusto de errores de red y autenticación
- ✅ **Múltiples comandos**: Soporte para obtener modelos y hacer chat completions
- ✅ **Opciones configurables**: max_tokens, temperature, streaming
- ✅ **Entrada desde archivo**: Permite enviar prompts desde archivos de texto
- ✅ **Información de uso**: Muestra tokens utilizados en cada request

## Notas importantes

- Los tokens expiran cada 25 minutos, pero los scripts los renuevan automáticamente
- Se recomienda hacer máximo 1 request cada 2 segundos para evitar rate limits
- Los scripts guardan el tiempo de expiración del token para optimizar las renovaciones
