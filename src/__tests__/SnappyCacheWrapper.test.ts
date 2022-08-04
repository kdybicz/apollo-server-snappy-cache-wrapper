import { InMemoryLRUCache } from "apollo-server-caching";

import {
  testKeyValueCache_Basics,
  testKeyValueCache_Expiration,
} from "./testsuite";

import { SnappyCacheWrapper } from "../index";

describe("SnappyCacheWrapper", () => {
  const cache = new SnappyCacheWrapper(new InMemoryLRUCache());

  testKeyValueCache_Basics(cache);
  testKeyValueCache_Expiration(cache);
});

describe("SnappyCacheWrapper - Compression", () => {
  const wrappedCache = new InMemoryLRUCache();
  const cache = new SnappyCacheWrapper(wrappedCache, {
    minimumCompressionSize: 11,
  });

  beforeEach(() => {
    cache.flush();
  });

  it("Values smaller that minimumCompressionSize are not compressed", async () => {
    // given:
    const testKey = "test-key";
    const testValue = "test value";

    // when:
    await cache.set(testKey, testValue);
    // then:
    expect(await wrappedCache.get(testKey)).toEqual(testValue);
  });

  it("Values greater that the set minimumCompressionSize are compressed and prefixed", async () => {
    // given:
    const testKey = "test-key";
    const testValue = "one big test value";

    // when:
    await cache.set(testKey, testValue);
    // then:
    expect(await wrappedCache.get(testKey)).toMatch(/snappy\:.*/);
  });

  it("Values greater that the default minimumCompressionSize are compressed and prefixed", async () => {
    // given:
    const cache = new SnappyCacheWrapper(wrappedCache);
    // and:
    const testKey = "test-key";
    let testValue = '';
    for (let i = 0; i < 262144 + 1; i++) {
      testValue += 'a';
    }
    // and:
    await cache.set(testKey, testValue);

    // when:
    const result = await wrappedCache.get(testKey);
    // then:
    expect(result).toMatch(/snappy\:.*/);
    // and:
    expect(result.length).toBeLessThan(testValue.length);
  });

  it("Not compressed values are returned as is", async () => {
    // given:
    const testKey = "test-key";
    const testValue = "test value";
    // and
    await wrappedCache.set(testKey, testValue);

    // when:
    const result = await cache.get(testKey);
    // then:
    expect(result).toEqual(testValue);
  });

  it("Compressed values are decompresses before are returned", async () => {
    // given:
    const testKey = "test-key";
    const testValue = "one big test value";
    // and
    await wrappedCache.set(testKey, "snappy:EkRvbmUgYmlnIHRlc3QgdmFsdWU=");

    // when:
    const result = await cache.get(testKey);
    // then:
    expect(result).toEqual(testValue);
  });
});
