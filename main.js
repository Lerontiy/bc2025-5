import { Command } from 'commander';
import request from 'superagent';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises'; 
import http from 'http';
import path from 'path'; 

const program = new Command();
program
    .option('-h, --host [port]', 'Хост сервера')
    .option('-p, --port [port]', 'Порт сервера')
    .option('-c, --cache [cache]', 'Шлях до директорії');
program.parse(process.argv);
const options = program.opts();

const HOST = options.host;
const PORT = options.port;
const CACHE = options.cache;

function check(var1) {
    return (!var1 || var1==true) 
}

if (check(CACHE) || check(PORT) || check(HOST)) {
    console.error('Помилка: Необхідно вказати усі обов\'язкові параметри (--host --port --cache ).');
    process.exit();
}

const SERVER_URL = `http://${HOST}:${PORT}`;

const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    const fileName = url.substring(1);

    if (!fileName) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: File code is missing in URL.');
        return;
    }

    await mkdir(CACHE, { recursive: true });

    const filePath = path.join(CACHE, fileName+'.jpg');

    try {
        if (method === 'GET') {
            let data;
            try {
                data = await readFile(filePath);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    const fileBuffer = (await request.get(`https://http.cat/${fileName}`)).body;
                    await request.put(`${SERVER_URL}/${fileName}`).send(fileBuffer);
                    data = (await request.get(`${SERVER_URL}/${fileName}`)).body;
                }
            }
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(data);
        } else if (method === 'PUT') {
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const data = Buffer.concat(chunks);

            await writeFile(filePath, data);
            
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end('Created');

        } else if (method === 'DELETE') {
            await unlink(filePath);
            
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');

        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }

    } catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        } else {
            console.error(error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Сервер запущено: ${SERVER_URL}`);
    console.log(`Кеш знаходиться тут: ${path.resolve(CACHE)}`);
    console.log('Натисни Ctrl+C для зупинки.');
});
