'use strict';


var counter = 0;

var pyramid = [];
var kernel = null;
var low1_pyramid = null;
var low2_pyramid = null;

var buf = Array (3);
var IntermediateTypedArray = Float32Array;
var blur_size_changed;
var filter_size_changed;
var MAX_PYRAMID_DEPTH;


function filter (input, width, height)
{
  if (blur_size_changed || filter_size_changed)
  {
    let w = width;
    let h = height;
    let depth = max_pyramid_depth(w, h, blur_size);
    for (let i=0; i < depth; i++)
    {
      pyramid[i] = get_resized_array (buffer_init.PYRAMID[i].buffer, w, h); // TODO try using pyramid[i].buffer instead

      w = Math.floor (w/2);
      h = Math.floor (h/2);
    }

    if (blur_size_changed)
      kernel = get_blur_kernel (blur_size);

    if (filter_size_changed)
    {
      for (let i=0; i < buf.length; i++)
        buf[i] = get_resized_array (buffer_init.BUF[i].buffer, width, height);
    }
  }

  buf[0] = rgb_to (buf0_color, input, width, height, buf[0], use_fscs, true);
  build_pyramid (buf[0], width, height, 0);

  if (buf0_color != buf1_color)
  {
    buf[0] = to_rgb (buf0_color, buf[0], width, height, buf[0], use_fscs);
    buf[0] = rgb_to (buf1_color, buf[0], width, height, buf[0], use_fscs);
  }

  amplify (buf[0], width, height, buf[1], 1);
  buf[1] = to_rgb (buf1_color, buf[1], width, height, buf[1], use_fscs);

  // if (++counter % 10 == 1)
  // {
    // console.log (buf[1].map((x,i)=> x-input[i]).reduce((v,x)=>Math.abs(x) > v ? Math.abs(x) : v, 0));
    // console.log (buf2.slice(800,812));
    // console.log (buf[1].slice(800,812));
    // console.log (input.slice(800,812));
    // buf[1].slice(800,812).forEach((val,i) => console.log(val,input[800+i], val-input[800+i]));
  // }

  // return new Uint8ClampedArray (buf[1].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? 255 : 0) : x));
  // return new Uint8ClampedArray (buf[1].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? x : 0) : x));
  // return new Uint8ClampedArray (buf[1].map((x,i)=> (i%4!=3) ? x-input[i] : x));
  return new Uint8ClampedArray (buf[1]);
}


function buffer_init ()
{
  buffer_init.BUF = [];
  buffer_init.PYRAMID = [];

  /*
  Each BUF[i] keeps a reference to memory so it isn't garbage collected on
  resizing buf[i] from updating the filter_size.
  */
  for (let i=0; i < buf.length; i++)
  {
    buf[i] = buffer_init.BUF[i] = fill_alpha (new IntermediateTypedArray (4 * FRAME_WIDTH * FRAME_HEIGHT), 255);
    buf[i].width = FRAME_WIDTH;
    buf[i].height = FRAME_HEIGHT;
  }

  /* Same comment as above. */
  var width = FRAME_WIDTH;
  var height = FRAME_HEIGHT;
  var depth = max_pyramid_depth(width, height, 1);
  for (let i=0; i < depth; i++)
  {
    pyramid[i] = buffer_init.PYRAMID[i] = fill_alpha (new IntermediateTypedArray (4 * width * height), 255);
    pyramid[i].width = width;
    pyramid[i].height = height;

    width = Math.floor (width/2);
    height = Math.floor (height/2);
  }
}


function get_resized_array (buffer, width, height)
{
  var array = new IntermediateTypedArray (buffer, 0, 4 * width * height);
  array.width = width;
  array.height = height;

  return array;
}


function update_filter_size (new_filter_size)
{
  filter_size = new_filter_size;
  filter_size_changed = true;
  MAX_PYRAMID_DEPTH = null;
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
  MAX_PYRAMID_DEPTH = null;
}


function amplify (input, width, height, output, alpha)
{
  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      output[index + 0] = alpha * input[index + 0];
      output[index + 1] = alpha * input[index + 1];
      output[index + 2] = alpha * input[index + 2];
    }
  }
}


