#ifndef UTILS_H
#define UTILS_H


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


static inline int next_multiple (int x, int m)
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


static inline int min (int a, int b)
{
  return (a<b) ? a : b;
}


#ifdef NDEBUG
#define ASSERT (void) 0
#else
#include <assert.h>
#define ASSERT(pred, msg...) do {if (!(pred)) {fprintf (stderr, msg); assert ((pred));}} while(0)
#endif



#endif /* UTILS_H */


#if defined(__INCLUDE_LEVEL__)
#if __INCLUDE_LEVEL__ == 0
#include <stdlib.h>
#include <stdio.h>
int main (int argc, char** argv)
{
  if (argc == 1)
  {
    fprintf (stderr, "Usage:\n"
      "%s [arg1] [arg2]\n"
      "%s [arg1] [arg2]\n"
      "%s [arg1] [arg2] [arg3]\n"
      ,argv[0]
      ,argv[0]
      ,argv[0]
    );
    exit (1);
  }

  if (argv[2][0] != '0')
    printf ("next_multiple (x=%d, m=%d) = %d\n", atoi ( argv[1] ), atoi ( argv[2] ), next_multiple ( atoi ( argv[1] ), atoi ( argv[2] ) ) );
  printf ("left_reflect (i=%d, min=%d) = %d\n", atoi ( argv[1] ), atoi ( argv[2] ), left_reflect ( atoi ( argv[1] ), atoi ( argv[2] ) ) );
  printf ("right_reflect (i=%d, max=%d) = %d\n", atoi ( argv[1] ), atoi ( argv[2] ), right_reflect ( atoi ( argv[1] ), atoi ( argv[2] ) ) );
  printf ("min (a=%d, a=%d) = %d\n", atoi ( argv[1] ), atoi ( argv[2] ), min ( atoi ( argv[1] ), atoi ( argv[2] ) ) );

  if (argc > 3)
    printf ("both_reflect (i=%d, min=%d, max=%d) = %d\n", atoi ( argv[1] ), atoi ( argv[2] ), atoi ( argv[3] ), both_reflect ( atoi ( argv[1] ), atoi ( argv[2] ), atoi ( argv[3] ) ) );

}
#endif
#endif

