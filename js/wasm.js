'use strict';


var Module =
{
  preRun: [],
  onRuntimeInitialized: init,
  postRun: [],
  wasmBinaryFile: 'c/videomag.wasm',
  print: (text) => console.log(text),
  printErr: (text) => console.warn(text)
};
