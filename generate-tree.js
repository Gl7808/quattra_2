const fs = require('fs');
const path = require('path');

// ============ НАСТРОЙКИ ИСКЛЮЧЕНИЙ ============
// Здесь вы можете указать папки и файлы, которые нужно игнорировать.
// Поддерживаются как точные имена, так и маски (через *).
const IGNORE_PATTERNS = [
    // Папки
    'node_modules',
    '.git',
    'dist',
    'build',
    '.cache',
    '.next',
    '.nuxt',
    '.vscode',
    '.idea',


    // Файлы и маски
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'tree.txt',           // игнорируем сам файл с деревом
    'generate-tree.js',   // игнорируем сам скрипт
    '.env',
    '.env.local',
];

// ============ КОРНЕВАЯ ПАПКА ============
const ROOT_DIR = process.cwd(); // текущая папка, откуда запущен скрипт
const OUTPUT_FILE = path.join(ROOT_DIR, 'tree.txt');

// ============ ЛОГИКА ============

/**
 * Проверяет, попадает ли имя файла/папки под исключение
 */
function isIgnored(name) {
    return IGNORE_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            // Простая поддержка маски *.log
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(name);
        }
        return name === pattern;
    });
}

/**
 * Рекурсивно строит строку дерева
 */
function buildTree(dirPath, prefix = '') {
    let result = '';

    let entries;
    try {
        entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
        return result + prefix + '[ошибка чтения]\n';
    }

    // Фильтруем игнорируемые и сортируем: сначала папки, потом файлы, по алфавиту
    entries = entries
        .filter(entry => !isIgnored(entry.name))
        .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

    entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const entryPath = path.join(dirPath, entry.name);

        result += prefix + connector + entry.name + '\n';

        if (entry.isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            result += buildTree(entryPath, newPrefix);
        }
    });

    return result;
}

// ============ ЗАПУСК ============
function main() {
    const rootName = path.basename(ROOT_DIR);
    let tree = rootName + '/\n';
    tree += buildTree(ROOT_DIR);

    fs.writeFileSync(OUTPUT_FILE, tree, 'utf-8');

    const linesCount = tree.split('\n').length;
    console.log(`✅ Дерево проекта успешно сохранено в: ${OUTPUT_FILE}`);
    console.log(`📊 Всего строк: ${linesCount}`);
}

main();