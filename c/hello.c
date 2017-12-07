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

#include <stdio.h>

DEMANGLE
EXPORT
int main (int argc, char** argv)
{
  printf("Hello world!\n");
}
END_DEMANGLE
