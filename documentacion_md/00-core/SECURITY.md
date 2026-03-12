# Seguridad del Proyecto

## Configuración de Variables de Entorno

Este proyecto usa variables de entorno para configuración sensible.

### Instalación

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` con tus configuraciones locales (nunca compartas este archivo)

### Importante

- **NUNCA** subas el archivo `.env` a GitHub
- **NUNCA** incluyas API keys en el código fuente
- **SIEMPRE** usa variables de entorno para datos sensibles
- El archivo `.gitignore` ya está configurado para proteger `.env`

## APIs Utilizadas

Actualmente el proyecto usa APIs públicas:
- **DiceBear** - Generación de avatares (gratuita, sin API key)
- **ImageDelivery** - CDN de imágenes

Si agregas servicios que requieren API keys en el futuro:
1. Agrégalas al archivo `.env`
2. Usa el prefijo `VITE_` para variables accesibles en el cliente
3. Actualiza `.env.example` con la plantilla

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor reporta a:
**falcondaniel37@gmail.com**
