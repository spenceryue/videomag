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


DEMANGLE
EXPORT
void row_corr_down (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);


EXPORT
void col_corr_down (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);


EXPORT
void row_corr_up (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int clip_width, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);


EXPORT
void col_corr_up (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int clip_height, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);


EXPORT
void row_corr_up_sub (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int clip_width, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);


EXPORT
void col_corr_up_sub (float* input, int in_width, float* output, int out_width, int operate_width, int operate_height, int clip_height, int stride, float* kernel, int window, int IN_LENGTH, int OUT_LENGTH, void** MAGIC);
END_DEMANGLE


#endif /* BLUR_FILTER_H */
