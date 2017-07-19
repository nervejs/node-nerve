module.exports = function (projectOptions) {
    var cluster = require('cluster'),
        path = require('path'),
        cpuCount = require('os').cpus().length - 1,
        app,
        options,
        socket,
        host,
        port,
        terminating = false,
        workersNum,
        workerFailed,
        server,
        worker,
        pathToProject;

    projectOptions = projectOptions || {};
    port = projectOptions.port || 3000;
    pathToProject = projectOptions.pathToProject || 'src';

    options = require('commander')
        .option('-s, --socket [<host>]:<port>', 'socket to listen on')
        .option('-p, --port <port>', 'port to listen on')
        .option('-w, --workers <n>', 'number of workers to start (default: Ncpu - 1)')
        .option('-r, --routes <file>', 'template routes file')
        .option('-t, --templates <dir>', 'templates directory')
        .option('-e, --env <env>', 'environment')
        .parse(process.argv);

    if (options.socket) {
        socket = options.socket.match(/^([\d\.]+)?:(\d+)$/);

        if (!socket) {
            invalidArguments('--socket option is in invalid format');
        }

        host = socket[1] || '0.0.0.0';
        port = socket[2];
    } else {
        host = '0.0.0.0';
    }

    if (options.port) {
        port = options.port;
    }

    if (cluster.isMaster) {
        workersNum = options.workers || cpuCount;

        console.log('Starting %d workers', workersNum);

        for (var i = 0; i < workersNum; i++) {
            worker = cluster.fork();
            worker.index = i + 1;
            worker.send({
                msg: 'setIndex',
                data: {
                    index: i + 1
                }
            });
        }

        cluster.on('listening', function (worker, address) {
            console.log('Worker #%d [%d] is listening on %s:%d', worker.id, worker.process.pid, address.address, address.port);
        });

        workerFailed = function (worker, code, signal) {
            console.error('Failed to start worker [%d] (%s), exiting', worker.process.pid, signal || code);
            process.exit(1);
        };

        cluster.once('exit', workerFailed);
        cluster.once('listening', function (worker, address) {
            console.log('Listening on %s:%d', address.address, address.port);
            cluster.removeListener('exit', workerFailed);
            cluster.on('exit', function (worker, code, signal) {
                var newWorker;

                if (terminating) {
                    return;
                }
                console.log('Worker #%d [%d] (index: %d) died (%s), restarting...', worker.id, worker.process.pid, worker.index, signal || code);
                newWorker = cluster.fork();
                newWorker.index = worker.index;
                newWorker.send({
                    msg: 'setIndex',
                    data: {
                        index: newWorker.index
                    }
                });
            });
        });

        process.on('SIGTERM', function () {
            console.log('SIGTERM received, terminating all workers');
            terminating = true;

            for (var id in cluster.workers) {
                cluster.workers[id].send({
                    msg: 'kill'
                });
            }

            console.log('All workers have terminated, exiting');
            process.exit(0);
        });
    } else {
        app = require(path.resolve(process.cwd(), pathToProject, 'app')).app;

        if (options.env) {
            app.env(options.env);
        }

        server = app.listen(port, host, function () {
            const listen = server.address();

            console.log(`Listening on http://${listen.address}:${listen.port}`);
        });

        app.route(require(path.resolve(process.cwd(), pathToProject, 'routes')));

        server.on('error', function (error) {
            if (error.syscall !== 'listen')
                throw error;

            switch (error.code) {
            case 'EACCES':
                console.error(options.socket + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(options.socket + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
            }
        });

        process.on('message', function (event) {
            if (event.msg === 'kill') {
                console.log('worker ' + process.pid + ' terminated');
                process.exit(0);
            } else if (event.msg === 'setIndex') {
                app.setWorkerIndex(event.data.index);
            }
        });
    }

    function invalidArguments(message) {
        console.log(message);
        options.outputHelp();
        process.exit(1);
    }
};