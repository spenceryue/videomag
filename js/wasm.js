'use strict';

/*
  Compiled from c/ directory with:
  (1) emcc -O3 -Wall -c *.c
  (2) emcc *.o \
  -O3 \
  -s WASM=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s TOTAL_MEMORY=44236800 # = 640*480*4*4*(9)
*/

var Module =
{
  preRun: [],
  onRuntimeInitialized: init,
  postRun: [],
  wasmBinaryFile: 'c/a.out.wasm',
  print: (text) => console.log(text),
  printErr: (text) => console.warn(text)
};
