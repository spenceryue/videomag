#ifndef BLUR_FILTER_H
#define BLUR_FILTER_H


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


#include <stdint.h>
#include "float.h"


#define STRIDE 2


DEMANGLE
EXPORT
void row_corr_down (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
);


EXPORT
void col_corr_down (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
);


EXPORT
void row_corr_up (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  uint16_t clip_width,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
);


EXPORT
void col_corr_up_mult_add (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  const uint16_t clip_height,
  const FLOAT scale,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
);


EXPORT
void blur5_corr_up_mult_add (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  const uint16_t clip_height,
  const FLOAT scale,
  // const uint8_t stride,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
);
END_DEMANGLE


#endif /* BLUR_FILTER_H */
