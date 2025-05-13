# Cache Package

A flexible caching utility library for the GTR Services ecosystem. This package provides a consistent API for caching data across different storage backends.

## Features

- **Adapter Pattern**: Pluggable storage backends with a unified interface
- **Multiple Storage Options**: Support for memory and filesystem storage
- **Type Safety**: Full TypeScript support with proper typing
- **Async/Await API**: Modern promise-based interface
- **TTL Support**: Time-to-live functionality for cached items

## Project Structure

- `src/`
  - `adapters/` - Storage backend implementations
  - `cache-adapter.ts` - Interface for cache adapters
  - `cache.ts` - Main cache implementation
  - `index.ts` - Package exports

## Installation

```sh
# From the monorepo root
npm install
# Or from the package directory
cd workspaces/typescript/packages/cache
npm install
```

## Usage

```typescript
import { Cache, MemoryAdapter, FileSystemAdapter } from '@repo/cache';

// Create a cache with memory adapter
const memoryCache = new Cache({
  adapter: new MemoryAdapter()
});

// Create a cache with filesystem adapter
const fileCache = new Cache({
  adapter: new FileSystemAdapter({ directory: './cache' })
});

// Set cache item
await cache.set('user:123', { name: 'John', role: 'admin' }, { ttl: 3600 });

// Get cache item
const user = await cache.get('user:123');

// Check if item exists
const exists = await cache.has('user:123');

// Delete cache item
await cache.delete('user:123');

// Clear all cache
await cache.clear();
```

## API Reference

### Cache

Main class that provides caching functionality:

- `constructor(options)`: Create a new cache instance
- `get(key)`: Retrieve a cached value
- `set(key, value, options)`: Store a value in the cache
- `has(key)`: Check if a key exists in the cache
- `delete(key)`: Remove a value from the cache
- `clear()`: Clear all values from the cache

### Adapters

- `MemoryAdapter`: In-memory storage (fastest, non-persistent)
- `FileSystemAdapter`: File-based storage (persistent)

## Used By

- [Bot Application](../../apps/bot/README.md) - For caching WhatsApp session data
- [Service Orders App](../../apps/service-orders/README.md) - For caching API responses

## Related Packages

- [@repo/utils](../utils/README.md) - Used for file system operations in the FileSystemAdapter

## Development

- Build the package:
  ```sh
  npm run build
  ```

- Run tests:
  ```sh
  npm test
  ```

- Lint:
  ```sh
  npm run lint
  ```

---

[← Back to Monorepo Index](../../README.md)
