let seed = 123456789;

export function setSeed(nextSeed) {
  seed = nextSeed >>> 0;
}

export function rand() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
