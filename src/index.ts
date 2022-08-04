import { KeyValueCacheSetOptions, TestableKeyValueCache } from 'apollo-server-caching';
import Debug from 'debug';
import snappy from 'snappy';

const debug = Debug('snappy-wrapper');

export interface SnappyOptions {
  minimumCompressionSize?: number;
}

export class SnappyCacheWrapper implements TestableKeyValueCache<string>  {

  readonly defaultSnappyOptions: SnappyOptions = {
    minimumCompressionSize: 262144,
  };
  readonly prefix = 'snappy:';

  constructor(
    private readonly cache: TestableKeyValueCache<string>,
    private readonly snappyOptions?: SnappyOptions,
  ) {
    debug(`Creating a Snappy Wrapper for ${cache.constructor.name} with options: %j`, snappyOptions);
  }

  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions,
  ): Promise<void> {
    const { minimumCompressionSize } = Object.assign({}, this.defaultSnappyOptions, this.snappyOptions);

    if (minimumCompressionSize === undefined || value.length > minimumCompressionSize) {
      try {
        debug(`[SET] Compression start for key: ${key}`);

        value = this.prefix + snappy.compressSync(value).toString('base64');
      } finally {
        debug(`[SET] Compression ended`);
      }
    } else {
      debug(`[SET] No data compression needed for key: ${key}`);
    }

    await this.cache.set(key, value, options);
  }

  async get(key: string): Promise<string | undefined> {
    const reply = await this.cache.get(key);

    if (reply !== undefined) {
      if (reply.startsWith(this.prefix)) {
        try {
          debug(`[GET] Decompression start for key: ${key}`);
          return snappy.uncompressSync(Buffer.from(reply.slice(this.prefix.length), 'base64'), { asBuffer: false }) as string;
        } finally {
          debug(`[GET] Decompression ended`);
        }
      }

      debug(`[GET] Data not compressed for key: ${key}`);
      return reply
    }

    debug(`[GET] No data found for key: ${key}`);
    return;
  }

  async delete(key: string): Promise<boolean | void> {
    debug(`[DELETE] Removing data for key: ${key}`);
    await this.cache.delete(key);
  }

  // Drops all data from the cache. This should only be used by test suites ---
  // production code should never drop all data from an end user cache (and
  // notably, PrefixingKeyValueCache intentionally doesn't implement this).
  async flush(): Promise<void> {
    if (typeof this.cache.flush === 'function') {
      debug(`[FLUSH] Flushing cache`);
      await this.cache.flush();
    }
  }

  // Close connections associated with this cache.
  async close(): Promise<void> {
    if (typeof this.cache.close === 'function') {
      debug(`[CLOSE] Closing connection`);
      await this.cache.close();
    }
  }
}
