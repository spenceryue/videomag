'use strict';

/*
  Compiled from c/ directory with:
  (1) emcc -O3 -Wall -c *.c
  (2) emcc *.o \
  -O3 \
  -s WASM=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s TOTAL_MEMORY=44236800 # 24576000 # = 640*480*4*4*(2 + 3)
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

var use_wasm = true;
