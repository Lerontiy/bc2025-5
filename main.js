import { Command } from 'commander';
import http from 'http';

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

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
    const queryParams = requestUrl.searchParams;

    //console.log(queryParams);

    let passengers;

    try {
        const data = await readFile(INPUT_FILE, 'utf-8');
        passengers = JSON.parse(data);
    } catch (error) {
        res.end(`Cannot find input file.`); 
        return;
    }

    //console.log(typeof(passengers));

    const processedData = processData(passengers, queryParams);

    const xmlResponse = buildXmlResponse(processedData);

    res.writeHead(200, { 'Content-Type': 'application/xml' }); 
    res.end(xmlResponse);
});

server.listen(PORT, HOST, () => {
    console.log(`Сервер запущено: http://${HOST}:${PORT}`);
    console.log('Натисни Ctrl+C для зупинки.');
});