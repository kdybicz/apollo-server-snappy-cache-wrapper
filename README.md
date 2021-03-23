## SnappyCacheWrapper

[![npm version](https://badge.fury.io/js/apollo-server-snappy-cache-wrapper.svg)](https://badge.fury.io/js/apollo-server-snappy-cache-wrapper)

This package exports an implementation of `KeyValueCache` that allows wrapping any other
[Apollo](https://github.com/apollographql/apollo-server) `KeyValueCache` implementation with an
configurable [Snappy](https://github.com/kesla/node-snappy) compression layer. It's main goal is
to limit the amount of memory used by the caching environment and the amount of data being
in-transit from and to the cache environment.

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
