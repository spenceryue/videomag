#ifndef UTILS_H
#define UTILS_H


#include <stdbool.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

#ifdef __cplusplus
#define DEMANGLE extern "C" {
#define END_DEMANGLE }
#else
#define DEMANGLE
#define END_DEMANGLE
#endif


DEMANGLE
EXPORT
void fill_alpha (float* input, int length, float value);


EXPORT
void full_scale_contrast_stretch (float* input, int length, float min, float max);
END_DEMANGLE


static inline bool next_multiple (int x, int m)
{
  return x + (m - x % m) % m;
}


static inline int left_reflect (int i, int min)
{
  // start + [ reflected distance ]
  // (min) + [ (min - 1) - i ]
  return (i < min) ? 2 * min - 1 - i : i;
}


static inline int right_reflect (int i, int max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return (i >= max) ? 2 * max - 1 - i : i;
}


static inline int both_reflect (int i, int min, int max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return left_reflect (right_reflect (i, max), min);
}


#endif /* UTILS_H */
