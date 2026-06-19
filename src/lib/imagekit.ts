import { ImageKit } from "@imagekit/nodejs";

/**
 * Returns a lazily-initialized ImageKit server client.
 * Call this inside route handlers so the env var is read at request time,
 * not at module evaluation (which breaks `next build` when .env.local is absent).
 */
export function getImageKit(): ImageKit {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "IMAGEKIT_PRIVATE_KEY environment variable is not set. " +
        "Copy .env.local.example to .env.local and fill in your credentials."
    );
  }
  return new ImageKit({ privateKey });
}
