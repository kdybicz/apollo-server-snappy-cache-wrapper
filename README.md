## SnappyCacheWrapper

This package exports an implementation of `KeyValueCache` that allows wrapping any other `KeyValueCache` with an configurable [Snappy](https://github.com/kesla/node-snappy) compression layer.

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

- **minimumCompressionSize** (default: 262144) - defines minimal length of the data _string_, after exceeding which data proxied to wrapped cache are compressed by [Snappy](https://github.com/kesla/node-snappy) before being passed forward.
