## SnappyCacheWrapper

[![npm version](https://badge.fury.io/js/apollo-server-snappy-cache-wrapper.svg)](https://badge.fury.io/js/apollo-server-snappy-cache-wrapper)
[![npm downloads](https://img.shields.io/npm/dw/apollo-server-snappy-cache-wrapper)](https://www.npmjs.com/package/apollo-server-snappy-cache-wrapper)

This package exports an implementation of `KeyValueCache` that allows wrapping any other
[Apollo](https://github.com/apollographql/apollo-server) `KeyValueCache` implementation with an
configurable [Snappy](https://github.com/kesla/node-snappy) compression layer. Its main goal is
to limit the amount of memory used by the caching environment and at the same time the amount of
data being in-transit from and to the caching environment.

## Usage

```js
const { RedisCache } = require('apollo-server-cache-redis');
const { SnappyCacheWrapper } = require('apollo-server-snappy-cache-wrapper');

const redisCache = new RedisCache({
  host: 'redis-server',
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new SnappyCacheWrapper(redisCache, {
    minimumCompressionSize: 262144,
  }),
  dataSources: () => ({
    moviesAPI: new MoviesAPI(),
  }),
});
```

## Options

- **minimumCompressionSize** (default: 262144) - defines minimal length of the data _string_, after
  exceeding which data proxied to wrapped cache are compressed by
  [Snappy](https://github.com/kesla/node-snappy) before being passed forward.

## Debug

For better performance  monitor of **SnappyCacheWrapper** module in your app, run your app with
_DEBUG_ env.

To get all debug messages from all modules:
```
DEBUG=* npm run start
```

To get debug messages only from _snappy-wrapper_ module:
```
DEBUG=snappy-wrapper npm run start
```

## Troubleshooting

### invalid ELF header

One of the issues you can encounter when using [Snappy](https://github.com/kesla/node-snappy) in
your projects is **invalid ELF header** error. From my experience it's happening when you're
building your package (including _node_modules_) on one operating system and try use it on a
different operating system, ie. deploying [Serverless](https://github.com/serverless/serverless)
app into **AWS** linux-based Lambda environment from a macOS-based machine.

Example error message:
```
2021-03-14T13:39:14.674Z	undefined	ERROR	Uncaught Exception 	
{
    "errorType": "Error",
    "errorMessage": "/var/task/node_modules/snappy/build/Release/binding.node: invalid ELF header",
    "stack": [
        "Error: /var/task/node_modules/snappy/build/Release/binding.node: invalid ELF header",
        "    at Object.Module._extensions..node (internal/modules/cjs/loader.js:1057:18)",
        "    at Module.load (internal/modules/cjs/loader.js:863:32)",
        "    at Function.Module._load (internal/modules/cjs/loader.js:708:14)",
        "    at Module.require (internal/modules/cjs/loader.js:887:19)",
        "    at require (internal/modules/cjs/helpers.js:74:18)",
        "    at bindings (/var/task/node_modules/bindings/bindings.js:112:48)",
        "    at Object.<anonymous> (/var/task/node_modules/snappy/snappy.js:2:34)",
        "    at Module._compile (internal/modules/cjs/loader.js:999:30)",
        "    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)",
        "    at Module.load (internal/modules/cjs/loader.js:863:32)"
    ]
}
```

**Solution?:**
- One of the ways for dealing with that issue in **Serverless** environment would be a solution proposed
in [here](https://github.com/serverless/serverless/issues/308#issuecomment-685149964). It boils
down to adding `packagerOptions` to the webpack section of your `serverless.yml` file:

```yaml
custom:
  webpack:
    includeModules: true
    packagerOptions:
      scripts:
        - npm_config_platform=linux npm_config_arch=x64 yarn add sharp
```

- Another approach would be to have a build script that starts and works in a **Docker** container,
that uses the same operating system and configuration as the target platform. Deployment should
happens inside of the **Docker** container as well.
