'use strict';


var pyramid = [];
var kernel = null;
var low1_pyramid = null;
var low2_pyramid = null;


var buf = Array (3);
var IntermediateTypedArray = Float32Array;


var blur_size_changed;
var filter_size_changed;


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


function buffer_init ()
{
  /* General purpose buffers. */
  for (let i=0; i < buf.length; i++)
  {
    buf[i] = fill_alpha (malloc (IntermediateTypedArray, 4 * FRAME_WIDTH * FRAME_HEIGHT), 255);
    buf[i].width = FRAME_WIDTH;
    buf[i].height = FRAME_HEIGHT;
  }

  /* Pyramid buffers. */
  var width = FRAME_WIDTH;
  var height = FRAME_HEIGHT;
  var depth = max_pyramid_depth(width, height, 1);
  for (let i=0; i < depth; i++)
  {
    pyramid[i] = fill_alpha (malloc (IntermediateTypedArray, 4 * width * height), 255);
    pyramid[i].width = width;
    pyramid[i].height = height;

    [width, height] = next_pyramid_dimensions (width, height);
  }

  /* To check for memory corruption.
  (Assumes malloc() will hand out next piece of memory close to pyramid.) */
  buffer_init.MAGIC = malloc (Uint32Array, 1);
  buffer_init.MAGIC[0] = 0xdeadbeef;
}


function validate_pyramid_memory ()
{
  if (buffer_init.MAGIC[0] != 0xdeadbeef)
  {
    throw '\n(\u256F\u00B0\u25A1\u00B0)\u256F.-~ \u253B\u2501\u253B You ate my 0xdeadbeef !!!!\n'
    + '\\(\u00B4\u0414` )/==3 And you pooped it out as:'
    + '0x' + buffer_init.MAGIC[0].toString(16);
  }
}


function free (array)
{
  Module._free (array.ptr);
  heap_map.delete (array.ptr);
}

function malloc (ArrayType, length)
{
  var bytes_needed = bytesPerElement_map.get(ArrayType) * length;
  console.log (bytes_needed);

  var ptr = Module._malloc (bytes_needed);
  console.assert (!heap_map.has (ptr));
  heap_map.add (ptr);

  var heapView = heapView_map.get(ArrayType);
  var resultArray = new ArrayType (heapView.buffer, ptr, length);
  resultArray.ptr = ptr; // same as resultArray.byteOffset
  resultArray.heapView = heapView;


  return resultArray;
}


function get_resized_array (array, width, height)
{
  console.log ('resizing... old:\t', array.width, 'x', array.height);
  console.log ('new:\t\t\t\t', width, 'x', height);

  var resultArray = new IntermediateTypedArray (array.buffer, array.ptr, 4 * width * height);
  resultArray.width = width;
  resultArray.height = height;
  resultArray.ptr = array.ptr;
  resultArray.heapView = array.heapView;

  return resultArray;
}


function update_filter_size (new_filter_size)
{
  filter_size = new_filter_size;
  filter_size_changed = true;
}


function set_filter_dims ()
{
  FILTER_BOUNDS.width = Math.floor (FRAME_WIDTH * filter_size / 100);
  FILTER_BOUNDS.height = Math.floor (FRAME_HEIGHT * filter_size / 100);
  FILTER_BOUNDS.x = Math.floor ((FRAME_WIDTH - FILTER_BOUNDS.width) / 2);
  FILTER_BOUNDS.y = Math.floor ((FRAME_HEIGHT - FILTER_BOUNDS.height) / 2);
}


function update_blur_size (new_blur_size)
{
  blur_size = new_blur_size;
  blur_size_changed = true;
}


function fulfill_resize (width, height)
{
  if (blur_size_changed || filter_size_changed)
  {
    let w = width;
    let h = height;
    let depth = max_pyramid_depth(w, h, blur_size);
    for (let i=0; i < depth; i++)
    {
      pyramid[i] = get_resized_array (pyramid[i], w, h);

      [w, h] = next_pyramid_dimensions (w, h);
    }

    if (blur_size_changed)
      kernel = get_blur_kernel (blur_size);

    if (filter_size_changed)
    {
      for (let i=0; i < buf.length; i++)
        buf[i] = get_resized_array (buf[i], width, height);
    }

    validate_pyramid_memory ();
  }
}
