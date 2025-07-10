#!/usr/bin/env node

/**
 * extract_forms_sql.js
 *
 * Uso: node extract_forms_sql.js <input_xml> [output_sql]
 * Genera un .sql con:
 *   1) ModuleParameters
 *   2) ProgramUnits (limpia comentarios y cabeceras internas)
 *   3) Triggers (con DDL completo y FOR EACH ROW si aplica)
 *   4) ObjectGroups (comentarios)
 *
 * Decodifica entidades XML/HTML y normaliza sintaxis Oracle.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const xml2js = require('xml2js');

// ————— Función para decodificar entidades HTML/XML —————
function decodeHtmlEntities(str) {
  return str
    // saltos de línea y retorno de carro
    .replace(/&amp;#10;/g, '\n')
    .replace(/&#10;/g, '\n')
    .replace(/&#x9;/gi, '\t')
    .replace(/&#x13;/gi, '\r')
    // comillas y ampersand
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// ————— Quita comentario de cabecera /* … */ al principio del código —————
function stripOuterComment(code) {
  return code.replace(/^\s*\/\*[\s\S]*?\*\/\s*/,'');
}

// ————— Limpia cabecera interna PROCEDURE/FUNCTION name (…) IS —————
function stripInnerHeader(code) {
  return code.replace(
    /^\s*(PROCEDURE|FUNCTION)\s+\w+[^(]*(\([^)]*\))?(\s+RETURN\s+\w+)?\s+IS\s*/i,
    ''
  );
}

// ————— Función para encontrar archivos XML —————
function findXmlFiles(directory = '.') {
  try {
    const files = fs.readdirSync(directory);
    return files.filter(file => file.toLowerCase().endsWith('.xml'));
  } catch (error) {
    console.error('Error leyendo directorio:', error.message);
    return [];
  }
}

// ————— Función para mostrar menú interactivo —————
function showInteractiveMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const xmlFiles = findXmlFiles();
  
  if (xmlFiles.length === 0) {
    console.log('❌ No se encontraron archivos XML en el directorio actual.');
    rl.close();
    process.exit(1);
  }

  console.log('\n🔍 Archivos XML disponibles:');
  xmlFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  console.log(`  ${xmlFiles.length + 1}. Especificar ruta personalizada`);
  console.log('  0. Salir');

  rl.question('\n📁 Selecciona un archivo XML (número): ', (answer) => {
    const choice = parseInt(answer);
    
    if (choice === 0) {
      console.log('👋 Saliendo...');
      rl.close();
      process.exit(0);
    }
    
    if (choice > 0 && choice <= xmlFiles.length) {
      const selectedFile = xmlFiles[choice - 1];
      console.log(`✅ Seleccionado: ${selectedFile}`);
      
      rl.question('\n📄 Nombre del archivo SQL de salida (Enter para usar el nombre por defecto): ', (outputAnswer) => {
        const outputFile = outputAnswer.trim() || selectedFile.replace(/\.xml$/i, '.sql');
        rl.close();
        processXmlFile(selectedFile, outputFile);
      });
    } else if (choice === xmlFiles.length + 1) {
      rl.question('\n📂 Ingresa la ruta completa del archivo XML: ', (customPath) => {
        if (!fs.existsSync(customPath)) {
          console.log('❌ El archivo especificado no existe.');
          rl.close();
          process.exit(1);
        }
        
        if (!customPath.toLowerCase().endsWith('.xml')) {
          console.log('❌ El archivo debe tener extensión .xml');
          rl.close();
          process.exit(1);
        }
        
        const defaultOutput = customPath.replace(/\.xml$/i, '.sql');
        rl.question(`\n📄 Nombre del archivo SQL de salida (Enter para: ${path.basename(defaultOutput)}): `, (outputAnswer) => {
          const outputFile = outputAnswer.trim() || defaultOutput;
          rl.close();
          processXmlFile(customPath, outputFile);
        });
      });
    } else {
      console.log('❌ Opción no válida. Intenta de nuevo.');
      rl.close();
      showInteractiveMenu();
    }
  });
}

// ————— Función principal de procesamiento —————
function processXmlFile(inputFile, outputFile) {
  try {
    console.log(`\n🔄 Procesando: ${inputFile}`);
    const xml = fs.readFileSync(inputFile, 'utf8');

    xml2js.parseString(xml, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) {
        console.error('❌ Error parsing XML:', err.message);
        process.exit(1);
      }

      const form = result.Module.FormModule;
      let output = '';

      // 1) ModuleParameters
      if (form.ModuleParameter) {
        output += '-- MODULE PARAMETERS\n';
        const params = Array.isArray(form.ModuleParameter)
          ? form.ModuleParameter
          : [form.ModuleParameter];
        params.forEach(p => {
          const val = decodeHtmlEntities(p.ParameterInitializeValue || '');
          output += `-- ${p.Name} = ${val}\n`;
        });
        output += '\n';
      }

      // 2) ProgramUnits (PROCEDURES & FUNCTIONS)
      if (form.ProgramUnit) {
        output += '-- PROGRAM UNITS (FUNCTIONS & PROCEDURES)\n';
        const units = Array.isArray(form.ProgramUnit)
          ? form.ProgramUnit
          : [form.ProgramUnit];

        units.forEach(u => {
          // decodifica y limpia comentarios y cabecera duplicada
          const raw = u.ProgramUnitText || '';
          const decoded = decodeHtmlEntities(raw);
          const noComment = stripOuterComment(decoded);
          const body = stripInnerHeader(noComment).trim();
          const name = u.Name;
          const type = u.ProgramUnitType === 'Función' ? 'FUNCTION' : 'PROCEDURE';

          output += `CREATE OR REPLACE ${type} ${name} IS\n`;
          output += body + '\n';
          output += '/\n\n';
        });
      }

      // 3) Triggers
      function collectTriggers(node, parentModule = form.ModuleName || 'FORM') {
        if (!node || typeof node !== 'object') return [];
        let list = [];

        if (node.Trigger) {
          const arr = Array.isArray(node.Trigger) ? node.Trigger : [node.Trigger];
          arr.forEach(t => {
            const raw = t.TriggerText || '';
            const code = decodeHtmlEntities(raw).trim();
            if (!code) return; // omitir triggers vacíos

            const timing = t.TimingPoint || 'BEFORE';
            const event = t.TriggerEvent || 'WHEN-NEW-ITEM-INSTANCE';
            const onObj = t.TriggerObject || parentModule;
            const rowLevel = (t.TriggerType || '').toLowerCase() === 'row';

            let ddl = `CREATE OR REPLACE TRIGGER ${t.Name}\n`;
            ddl += `${timing} ${event} ON ${onObj}\n`;
            if (rowLevel) ddl += 'FOR EACH ROW\n';
            ddl += 'BEGIN\n';
            ddl += code + '\n';
            ddl += 'END;\n';
            ddl += '/';

            list.push(ddl);
          });
        }

        // recursión en subnodos
        Object.keys(node).forEach(key => {
          if (typeof node[key] === 'object') {
            const ctx = node.Name || parentModule;
            list = list.concat(collectTriggers(node[key], ctx));
          }
        });
        return list;
      }

      const triggerDdls = collectTriggers(form);
      if (triggerDdls.length) {
        output += '-- FORM TRIGGERS\n';
        output += triggerDdls.join('\n') + '\n\n';
      }

      // 4) ObjectGroups
      if (form.ObjectGroup) {
        output += '-- OBJECT GROUPS (lista de objetos)\n';
        const groups = Array.isArray(form.ObjectGroup)
          ? form.ObjectGroup
          : [form.ObjectGroup];
        groups.forEach(g => {
          output += `-- ObjectGroup ${g.Name}\n`;
          if (g.ObjectGroupChild) {
            const items = Array.isArray(g.ObjectGroupChild)
              ? g.ObjectGroupChild
              : [g.ObjectGroupChild];
            items.forEach(it => {
              output += `--   • ${it.Name}\n`;
            });
          }
          output += '\n';
        });
      }

      // escribir SQL final
      fs.writeFileSync(outputFile, output, 'utf8');
      console.log(`✅ SQL generado exitosamente en: ${outputFile}`);
      console.log(`📊 Tamaño del archivo: ${fs.statSync(outputFile).size} bytes`);
    });
    
  } catch (error) {
    console.error('❌ Error procesando el archivo:', error.message);
    process.exit(1);
  }
}

// ————— Punto de entrada principal —————
function main() {
  console.log('\n🚀 Extractor de SQL desde Oracle Forms XML');
  console.log('═══════════════════════════════════════════\n');
  
  // Si se pasaron argumentos por línea de comandos, usar el modo tradicional
  if (process.argv.length >= 3) {
    const inputFile = process.argv[2];
    const outputFile = process.argv[3] || inputFile.replace(/\.xml$/i, '.sql');
    
    if (!fs.existsSync(inputFile)) {
      console.error('❌ El archivo especificado no existe:', inputFile);
      process.exit(1);
    }
    
    processXmlFile(inputFile, outputFile);
  } else {
    // Modo interactivo
    showInteractiveMenu();
  }
}

// Ejecutar el script
main();
