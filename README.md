# Nerve
Nerve is a full stack framework for building fast and modern web applications.

## Installations
```bash
$ npm install nerve-cli -g
```

## Quick Start

Create directory:
```bash
$ mkdir example-app
$ cd example-app
```

Create application:
```bash
$ nervejs create app
```

Start service:
```bash
$ npm run app
```

By default application start with development environment.

For start with production environment:
```bash
$ npm run app -- --env=prod
```

In production mode the application uses the compiled templates and does not clear the cache for required templates.

Compile templates:
```bash
$ npm run templates
```
