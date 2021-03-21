import { KeyValueCacheSetOptions, TestableKeyValueCache } from 'apollo-server-caching';
import snappy from 'snappy';

export interface SnappyOptions {
  minimumCompressionSize?: number;
}

export class SnappyCacheWrapper implements TestableKeyValueCache<string>  {

  readonly defaultSnappyOptions: SnappyOptions = {
    minimumCompressionSize: 262144,
  };
  readonly prefix = 'snappy:';

  private cache;

  constructor(cache: TestableKeyValueCache<string>, private readonly snappyOptions?: SnappyOptions) {
    this.cache = cache;
  }

  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions,
  ): Promise<void> {
    const { minimumCompressionSize } = Object.assign({}, this.defaultSnappyOptions, this.snappyOptions);

    if (minimumCompressionSize === undefined || value.length > minimumCompressionSize) {
      value = this.prefix + snappy.compressSync(value).toString('base64');
    }

    await this.cache.set(key, value, options);
  }

  async get(key: string): Promise<string | undefined> {
    const reply = await this.cache.get(key);

    if (reply !== undefined) {
      if (reply.startsWith(this.prefix)) {
        return snappy.uncompressSync(Buffer.from(reply.slice(this.prefix.length), 'base64'), { asBuffer: false }) as string;
      }

      return reply
    }

    return;
  }

  async delete(key: string): Promise<boolean | void> {
    await this.cache.delete(key);
  }

  // Drops all data from the cache. This should only be used by test suites ---
  // production code should never drop all data from an end user cache (and
  // notably, PrefixingKeyValueCache intentionally doesn't implement this).
  async flush(): Promise<void> {
    if (typeof this.cache.flush === 'function') {
      await this.cache.flush();
    }
  }

  // Close connections associated with this cache.
  async close(): Promise<void> {
    if (typeof this.cache.close === 'function') {
      await this.cache.close();
    }
  }
}
