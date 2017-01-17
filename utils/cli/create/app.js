'use strict';

let path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    cwd = process.cwd();

function npmInit() {
    return new Promise((resolve, reject) => {
        let child;

        if (fs.existsSync(path.resolve(cwd, 'package.json'))) {
            resolve();
        } else {
            child = spawn('npm', ['init'], {
                cwd: process.cwd(),
                stdio: 'inherit'
            });

            child.on('exit', resolve);
            child.on('error', reject);
        }
    });
}

function setScripts() {
    return new Promise((resolve, reject) => {
        var pkgPath = path.resolve(cwd, 'package.json');

        fs.readFile(pkgPath, (err, content) => {
            var pkg;

            if (err) {
                reject(err);
            } else {
                pkg = JSON.parse(content.toString());

                pkg.scripts = {
                    app: './bin/run',
                    build: './node_modules/grunt-cli/bin/grunt',
                    templates: './node_modules/grunt-cli/bin/grunt nerve-handlebars'
                };

                fs.writeFile(pkgPath, JSON.stringify(pkg, ' ', 2), (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

function npmInstall(pkg, version, args) {
    args = args || [];

    return new Promise((resolve, reject) => {
        let child = spawn('npm', [
            'install',
            pkg + '@' + version
        ].concat(args), {
            cwd: path.resolve(cwd)
        });

        child.stdout.pipe(process.stdout);
        child.stdout.on('end', resolve);
    });
}

function copy(src, dst) {
    fs
        .createReadStream(path.resolve(__dirname, src))
        .pipe(fs.createWriteStream(path.resolve(cwd, dst)));
}

module.exports = function () {
    npmInit()
        .then(() => {
            fs.mkdirSync(path.resolve(cwd, 'bin'));
            fs.mkdirSync(path.resolve(cwd, 'src'));
            fs.mkdirSync(path.resolve(cwd, 'src/lib'));
            fs.mkdirSync(path.resolve(cwd, 'src/pages'));
            fs.mkdirSync(path.resolve(cwd, 'src/pages/index'));
            fs.mkdirSync(path.resolve(cwd, 'templates'));
            fs.mkdirSync(path.resolve(cwd, 'templates/common'));
            fs.mkdirSync(path.resolve(cwd, 'templates/pages'));
            fs.mkdirSync(path.resolve(cwd, 'frontend'));
            fs.mkdirSync(path.resolve(cwd, 'frontend/js'));
            fs.mkdirSync(path.resolve(cwd, 'frontend/css'));
            fs.mkdirSync(path.resolve(cwd, 'dist'));

            copy('data/nerve.json', 'nerve.json');
            copy('data/run', 'bin/run');
            copy('data/app.js', 'src/app.js');
            copy('data/routes.js', 'src/routes.js');
            copy('data/active-user.js', 'src/lib/active-user.js');
            copy('data/page.js', 'src/lib/page.js');
            copy('data/IndexPage.js', 'src/pages/index/IndexPage.js');
            copy('data/templates/head.hbs', 'templates/common/head.hbs');
            copy('data/templates/footer.hbs', 'templates/common/footer.hbs');
            copy('data/templates/error404.hbs', 'templates/common/error404.hbs');
            copy('data/templates/error500.hbs', 'templates/common/error500.hbs');
            copy('data/templates/index.hbs', 'templates/pages/index.hbs');
            copy('data/Gruntfile.js', 'Gruntfile.js');
            copy('data/frontend/main.styl', 'frontend/css/main.styl');

            fs.chmodSync(path.resolve(cwd, 'bin/run'), '755');

            setScripts()
                .then(() => {
                    Promise.all([
                        npmInstall('grunt', '0.4.5', '--save-dev'),
                        npmInstall('grunt-contrib-stylus', '1.2.0', '--save-dev'),
                        npmInstall('grunt-nerve-handlebars', '0.0.6', '--save-dev'),
                    ])
                        .then(() => {
                            let child = spawn('./node_modules/grunt-cli/bin/grunt', {
                                cwd: path.resolve(cwd)
                            });

                            child.stdout.pipe(process.stdout);
                        })
                        .catch((err) => console.error(err));
                })
                .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
};