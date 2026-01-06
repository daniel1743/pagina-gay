/**
 * Plugin de Vite para generar version.json antes del build
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

export default function generateVersionPlugin() {
  return {
    name: 'generate-version',
    buildStart() {
      try {
        const timestamp = Date.now();
        let gitHash = 'unknown';
        
        try {
          gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
        } catch (error) {
          // Si git no está disponible, usar solo timestamp
          console.warn('⚠️ Git no disponible, usando solo timestamp para versión');
        }

        const version = {
          version: `${timestamp}-${gitHash}`,
          timestamp,
          gitHash,
          buildDate: new Date().toISOString()
        };

        // Escribir version.json en la carpeta public
        writeFileSync(
          './public/version.json',
          JSON.stringify(version, null, 2),
          'utf-8'
        );

        console.log('✅ [VERSION] Versión generada:', version.version);
      } catch (error) {
        console.error('❌ [VERSION] Error generando versión:', error);
        // No fallar el build si hay error
      }
    }
  };
}

