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

#include "float.h"


DEMANGLE
EXPORT
void rgb2ntsc (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void rgb2ntsc_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void ntsc2rgb (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void ntsc2rgb_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


/*
  JPEG variant: https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
  Original spec: http://www.itu.int/rec/T-REC-T.871-201105-I/en

  FSCS packed in as well (not much effect).
*/
EXPORT
void rgb2ycbcr (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void ycbcr2rgb (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void rgb2ycbcr_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void ycbcr2rgb_fscs (FLOAT* input, int width, int height, FLOAT* output, int IN_LENGTH, int OUT_LENGTH);


EXPORT
void adjust_gamma (FLOAT* input, int width, int height, FLOAT* output, FLOAT gamma, int IN_LENGTH, int OUT_LENGTH);
END_DEMANGLE


#endif /* COLOR_SPACE_H */
