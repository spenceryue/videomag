'use strict';


var heap_map = new Set();
var bytesPerElement_map = new Map
([
  [Int8Array, 1],
  [Int16Array, 2],
  [Int32Array, 4],
  [Uint8Array, 1],
  [Uint8ClampedArray, 1],
  [Uint16Array, 2],
  [Uint32Array, 4],
  [Float32Array, 4],
  [Float64Array, 8],
]);
var heapView_map;


function heap_init ()
{
  heapView_map = new Map
  ([
    [Int8Array, Module.HEAP8],
    [Int16Array, Module.HEAP16],
    [Int32Array, Module.HEAP32],
    [Uint8Array, Module.HEAPU8],
    [Uint8ClampedArray, Module.HEAPU8],
    [Uint16Array, Module.HEAPU16],
    [Uint32Array, Module.HEAPU32],
    [Float32Array, Module.HEAPF32],
    [Float64Array, Module.HEAPF64],
  ]);
}


function free (array)
{
  Module._free (array.ptr);
  heap_map.delete (array.ptr);
}

function malloc (ArrayType, length)
{
  var bytes_needed = bytesPerElement_map.get(ArrayType) * length;
  malloc.total += bytes_needed;
  // console.log ('malloc:\t%s bytes', bytes_needed.toLocaleString())
  // console.log ('\t   [%s total]', malloc.total.toLocaleString());

  var ptr = Module._malloc (bytes_needed);
  console.assert (!heap_map.has (ptr));
  heap_map.add (ptr);

  var heapView = heapView_map.get(ArrayType);
  var resultArray = new ArrayType (heapView.buffer, ptr, length);
  resultArray.ptr = ptr; // same as resultArray.byteOffset
  resultArray.heapView = heapView;

  return resultArray;
}
malloc.total = 0;


function get_resized_array (array, width, height)
{
  /*console.log ('resizing... old:\t', array.width, 'x', array.height);
  console.log ('new:\t\t\t\t', width, 'x', height);*/

  var resultArray = new array.__proto__.constructor (array.buffer, array.ptr, 4 * width * height);
  resultArray.width = width;
  resultArray.height = height;
  resultArray.ptr = array.ptr;
  resultArray.heapView = array.heapView;

  return resultArray;
}
