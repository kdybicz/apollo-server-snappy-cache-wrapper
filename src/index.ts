import { KeyValueCacheSetOptions, KeyValueCache } from 'apollo-server-caching';
import Debug from 'debug';
import snappy from 'snappy';
import { StringDecoder } from 'string_decoder';

const debug = Debug('snappy-wrapper');

export interface SnappyOptions {
  minimumCompressionSize?: number;
}

export class SnappyCacheWrapper implements KeyValueCache<string>  {

  readonly defaultSnappyOptions: SnappyOptions = {
    minimumCompressionSize: 262144,
  };
  readonly prefix = 'snappy:';

  constructor(
    private readonly cache: KeyValueCache<string>,
    private readonly snappyOptions: SnappyOptions = {},
  ) {
    debug(`Creating a Snappy Wrapper for ${cache.constructor.name} with options: %j`, snappyOptions);
  }

  async set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions,
  ): Promise<void> {
    debug(`[SET] Storing data in cache for key: ${key}`);

    const { minimumCompressionSize } = Object.assign({}, this.defaultSnappyOptions, this.snappyOptions);

    const uncompressedSize = value.length;
    if (minimumCompressionSize === undefined || uncompressedSize > minimumCompressionSize) {
      try {
        debug(`[SET] Compression start for key: ${key}`);

        const buff = Buffer.from(value);
        value = this.prefix + snappy.compressSync(buff).toString('base64');
      } finally {
        const compressedSize = value.length;
        debug(`[SET] Compression ended - reduced size from: ${uncompressedSize}, to: ${compressedSize}, compression level: ${(1-(compressedSize/uncompressedSize)).toFixed(2)}`);
      }
    } else {
      debug(`[SET] No data compression needed for key: ${key}`);
    }

    await this.cache.set(key, value, options);
    debug(`[SET] Data stored in cached for key: ${key}`);
  }

  async get(key: string): Promise<string | undefined> {
    debug(`[GET] Getting data from cache for key: ${key}`);
    const reply = await this.cache.get(key);

    if (reply !== undefined) {
      if (reply.startsWith(this.prefix)) {
        try {
          debug(`[GET] Decompression start for key: ${key}`);
          const buff = snappy.uncompressSync(Buffer.from(reply.slice(this.prefix.length), 'base64'));
          return new StringDecoder('utf8').end(buff);
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
}
