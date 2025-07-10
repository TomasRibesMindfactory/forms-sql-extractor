#!/usr/bin/env node

/**
 * demo.js - Script de demostración para probar el extractor interactivo
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Demostración del Extractor de SQL desde Oracle Forms XML');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📋 Opciones disponibles:');
console.log('  1. Ejecutar en modo interactivo');
console.log('  2. Ejecutar con argumentos de línea de comandos');
console.log('  3. Ver ayuda\n');

const choice = process.argv[2] || '1';

switch (choice) {
  case '1':
    console.log('🚀 Iniciando modo interactivo...\n');
    const interactive = spawn('node', ['extract_forms_sql.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    break;
    
  case '2':
    console.log('🚀 Ejemplo con argumentos de línea de comandos...\n');
    const withArgs = spawn('node', ['extract_forms_sql.js', 'mi_entrada.xml', 'output_demo.sql'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    break;
    
  case '3':
  default:
    console.log('📖 Ayuda:');
    console.log('');
    console.log('  Modo interactivo:');
    console.log('    node extract_forms_sql.js');
    console.log('');
    console.log('  Modo con argumentos:');
    console.log('    node extract_forms_sql.js <archivo_xml> [archivo_sql_salida]');
    console.log('');
    console.log('  Ejemplos:');
    console.log('    node extract_forms_sql.js mi_entrada.xml');
    console.log('    node extract_forms_sql.js mi_entrada.xml mi_salida.sql');
    console.log('');
    console.log('  Ejecutar demo:');
    console.log('    node demo.js 1  # Modo interactivo');
    console.log('    node demo.js 2  # Con argumentos');
    console.log('    node demo.js 3  # Esta ayuda');
    break;
}
