#ifndef COLOR_SPACE_H
#define COLOR_SPACE_H


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
void rgb2ntsc (float* input, int width, int height, float* output);


EXPORT
void rgb2ntsc_fscs (float* input, int width, int height, float* output);


EXPORT
void ntsc2rgb (float* input, int width, int height, float* output);


EXPORT
void ntsc2rgb_fscs (float* input, int width, int height, float* output);


/*
  JPEG variant: https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
  Original spec: http://www.itu.int/rec/T-REC-T.871-201105-I/en

  FSCS packed in as well (not much effect).
*/
EXPORT
void rgb2ycbcr (float* input, int width, int height, float* output);


EXPORT
void ycbcr2rgb (float* input, int width, int height, float* output);


EXPORT
void rgb2ycbcr_fscs (float* input, int width, int height, float* output);


EXPORT
void ycbcr2rgb_fscs (float* input, int width, int height, float* output);
END_DEMANGLE


#endif /* COLOR_SPACE_H */
