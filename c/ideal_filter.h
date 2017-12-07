#ifndef IDEAL_FILTER_H
#define IDEAL_FILTER_H


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


DEMANGLE
EXPORT
void update_dct_buffer_and_coefficients (FLOAT* newest_frame, FLOAT* oldest_frame, FLOAT** DCT_BUFFER_list, FLOAT** DCT_COEFS_list, uint16_t width, uint16_t height, uint16_t N);
END_DEMANGLE


#endif /* IDEAL_FILTER_H */
