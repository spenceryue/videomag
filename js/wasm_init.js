'use strict';


var Module =
{
  preRun: [],
  onRuntimeInitialized: init,
  postRun: [],
  wasmBinaryFile: 'c/wasm.wasm',
  print: (text) => console.log(text),
  printErr: (text) => console.warn(text)
};
