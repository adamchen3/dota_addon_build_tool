import * as fs from "fs";

import { readAsByteArray } from './lua-simple-encrypt/src/LocalFileLoader.js';
import luaSimpleXorEncrypt from './lua-simple-encrypt/src/LuaSimpleXorEncrypt.js';

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

async function main() {
    let source_dir = CONFIG.source_dir;
    let target_dir = CONFIG.target_dir;

    if (!fs.existsSync(source_dir)) {
        console.log(`Source Dir(${source_dir}) is not existed!`);
        return;
    }

    if (!fs.existsSync(target_dir)) {
        console.log(`Target Dir is not existed. \nCreate dir:${target_dir}`);
        fs.mkdirSync(target_dir, { recursive: true });
        console.log("Create Dir Succ!");
    }

    await processDir(source_dir, target_dir);

}

async function processDir(source_dir, target_dir) {
    const stats = await fs.promises.stat(source_dir);
    if (!stats.isDirectory()) {
        console.log(`${source_dir} is not a directory.`);
        return;
    }

    await fs.promises.readdir(source_dir)
        .then(async filenames => {
            for (let filename of filenames) {
                const source_path = source_dir + "/" + filename;
                const target_path = target_dir + '/' + filename;
                const stats = await fs.promises.stat(source_path);
                if (stats.isDirectory()) {
                    createDir(target_path);
                    await processDir(source_path, target_path);
                } else if (stats.isFile()) {
                    if (isIgnoreFile(source_path)) {
                        continue;
                    }

                    if (isEncryptFile(source_path)) {
                        encryptFile(source_path, target_path);
                        continue;
                    }

                    fs.copyFile(source_path, target_path, (err) => { if (err) { console.log(err) } });
                }
            }
        })
        .catch(err => {
            console.log(err);
        });
}


function encryptFile(source_path, target_path) {
    readAsByteArray(source_path, (bytes, file) => {
        const options = {
            isGG: false,
            isLua52: false
        }
        let encrypted = luaSimpleXorEncrypt(bytes, CONFIG.encrypt_key, options);
        encrypted = encrypted.replace(`DECRYPT_KEY`, CONFIG.decrypt_key);
        fs.writeFile(target_path, encrypted, (err) => { if (err) { console.log(err) } });
    });
}

function isIgnoreFile(path) {
    let isIgnored = false;
    for (let name of CONFIG.ignore_files) {
        if (CONFIG.source_dir + "/" + name === path) {
            isIgnored = true;
            break;
        }
    }
    return isIgnored;
}

function isEncryptFile(path) {
    let isEncrypted = false;
    for (let name of CONFIG.encrypt_files) {
        if (CONFIG.source_dir + "/" + name === path) {
            isEncrypted = true;
            break;
        }
    }
    return isEncrypted;
}

function createDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

main();

