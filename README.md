# 🚀 Extractor de SQL desde Oracle Forms XML

## Descripción
Este script extrae código SQL de archivos XML de Oracle Forms y genera archivos .sql con:
- ModuleParameters
- ProgramUnits (PROCEDURES & FUNCTIONS)
- Triggers con DDL completo
- ObjectGroups

## 🎯 Nuevas Funcionalidades

### Modo Interactivo
El script ahora incluye un menú interactivo que permite:
- ✅ Seleccionar archivos XML del directorio actual
- ✅ Especificar rutas personalizadas
- ✅ Configurar nombres de archivo de salida
- ✅ Navegación intuitiva con emojis

### Modo de Línea de Comandos
También mantiene la compatibilidad con argumentos de línea de comandos.

## 📋 Uso

### Modo Interactivo (Recomendado)
```bash
node extract_forms_sql.js
```

### Modo con Argumentos
```bash
node extract_forms_sql.js <archivo_xml> [archivo_sql_salida]
```

### Scripts NPM
```bash
npm start           # Ejecuta en modo interactivo
npm run demo        # Ejecuta script de demostración
npm run help        # Muestra ayuda
npm test            # Ejecuta con archivo de prueba
```

## 🔧 Ejemplos

### Ejemplo 1: Modo Interactivo
```bash
node extract_forms_sql.js
```
Salida:
```
🚀 Extractor de SQL desde Oracle Forms XML
═══════════════════════════════════════════

🔍 Archivos XML disponibles:
  1. mi_entrada.xml
  2. Especificar ruta personalizada
  0. Salir

📁 Selecciona un archivo XML (número):
```

### Ejemplo 2: Con Argumentos
```bash
node extract_forms_sql.js mi_entrada.xml mi_salida.sql
```

### Ejemplo 3: Auto-detección de nombre de salida
```bash
node extract_forms_sql.js mi_entrada.xml
# Genera: mi_entrada.sql
```

## 📂 Estructura del Proyecto
```
forms-sql-extractor/
├── extract_forms_sql.js  # Script principal
├── demo.js              # Script de demostración
├── package.json         # Configuración NPM
├── README.md           # Este archivo
└── *.xml               # Archivos XML de entrada
```

## 🎨 Características
- 🎯 **Menú interactivo**: Selección visual de archivos
- 🔍 **Auto-detección**: Encuentra automáticamente archivos XML
- 📁 **Rutas personalizadas**: Permite especificar archivos fuera del directorio
- ✅ **Validación**: Verifica existencia de archivos y extensiones
- 🎨 **Interfaz amigable**: Usa emojis y colores para mejor UX
- 📊 **Información detallada**: Muestra tamaño del archivo generado

## 🔧 Dependencias
- Node.js
- xml2js (para parsing XML)
- readline (incluido en Node.js)
- path (incluido en Node.js)
- fs (incluido en Node.js)

## 🚀 Instalación
```bash
npm install
```

## 🎯 Compatibilidad
- ✅ Mantiene compatibilidad con versión anterior
- ✅ Funciona en Windows, macOS y Linux
- ✅ Soporta rutas absolutas y relativas
- ✅ Manejo de errores mejorado
