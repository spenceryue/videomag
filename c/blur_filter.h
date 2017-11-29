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


#define STRIDE 2


DEMANGLE
EXPORT
void row_corr_down (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH,
  uint32_t OUT_LENGTH
);


EXPORT
void col_corr_down (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH,
  uint32_t OUT_LENGTH
);


EXPORT
void row_corr_up (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_width,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH,
  uint32_t OUT_LENGTH
);


EXPORT
void col_corr_up_mult_add (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_height,
  float scale,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH,
  uint32_t OUT_LENGTH
);


EXPORT
void blur5_corr_up_mult_add (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_height,
  float scale,
  // uint8_t stride,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
);
END_DEMANGLE


#endif /* BLUR_FILTER_H */
