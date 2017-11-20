'use strict';


var counter = 0;

var pyramid = [];
var kernel = null;
var low1_pyramid = null;
var low2_pyramid = null;

var buf0 = null;
var buf1 = null;
var buf2 = null;
var IntermediateTypedArray = Float32Array;
var blur_size_changed;
var filter_size_changed;


function buffer_init ()
{
  /*
  Capitalized variables (BUF0, BUF1, BUF2) keep references to memory so they aren't garbage collected on
  resizing lower-cased variables (buf0, buf1, buf2) from updating the filter_size.
  */
  buf0 = buffer_init.BUF0 = fill_alpha (new IntermediateTypedArray (4 * FRAME_WIDTH * FRAME_HEIGHT), 255);
  buf1 = buffer_init.BUF1 = fill_alpha (new IntermediateTypedArray (4 * FRAME_WIDTH * FRAME_HEIGHT), 255);
  buf2 = buffer_init.BUF2 = fill_alpha (new IntermediateTypedArray (4 * FRAME_WIDTH * FRAME_HEIGHT), 255);
  filter_size_changed = true;
}


function filter (input, width, height)
{
  if (blur_size_changed)
  {
    if (blur_size_changed)
      blur_size_changed = false;
    kernel = get_blur_kernel (blur_size);
  }

  if (filter_size_changed)
  {
    let length = 4 * width * height;

    buf0 = new IntermediateTypedArray (buffer_init.BUF0.buffer, 0, length);
    buf1 = new IntermediateTypedArray (buffer_init.BUF1.buffer, 0, length);
    buf2 = new IntermediateTypedArray (buffer_init.BUF2.buffer, 0, length);
    filter_size_changed = false;
  }

  buf0 = rgb_to (buf0_color, input, width, height, buf0, use_fscs, true);
  build_pyramid (buf0, width, height, 0);

  if (buf0_color != buf1_color)
  {
    buf0 = to_rgb (buf0_color, buf0, width, height, buf0, use_fscs);
    buf1 = rgb_to (buf1_color, buf0, width, height, buf0, use_fscs);
  }

  amplify (buf0, width, height, buf1, 1);
  buf1 = to_rgb (buf1_color, buf1, width, height, buf1, use_fscs);

  if (++counter % 10 == 1)
  {
    console.log (buf1.map((x,i)=> x-input[i]).reduce((v,x)=>Math.abs(x) > v ? Math.abs(x) : v, 0));
    // console.log (buf2.slice(800,812));
    // console.log (buf1.slice(800,812));
    // console.log (input.slice(800,812));
    // buf1.slice(800,812).forEach((val,i) => console.log(val,input[800+i], val-input[800+i]));
  }

  // return new Uint8ClampedArray (buf1.map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? 255 : 0) : x));
  // return new Uint8ClampedArray (buf1.map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? x : 0) : x));
  // return new Uint8ClampedArray (buf1.map((x,i)=> (i%4!=3) ? x-input[i] : x));
  return new Uint8ClampedArray (buf1);
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


function build_pyramid (input, width, height, level)
{
  if (width < blur_size || height < blur_size)
    return;

  if (level >= pyramid.length - 1)
  {
    pyramid.push(new IntermediateTypedArray (4 * width * height));
    var output = pyramid[level];
    fill_alpha (output, 255);
  }
  else
    var output = pyramid[level];

  output = input;
  conv2_down (input, width, height, output, buf2);
}


function next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height)
{
  switch (level%4)
  {
    case 0:
      return [prev_x, prev_y - prev_height];
    case 1:
      return [prev_x + prev_width, prev_y];
    case 2:
      return [prev_x + prev_width - width, prev_y + prev_height];
    case 3:
      return [prev_x - width, prev_y + prev_height - height];
  }
}


function display_pyramid ()
{
  var prev_width = FILTER_BOUNDS.width;
  var prev_height = FILTER_BOUNDS.height;
  var prev_x = FILTER_BOUNDS.x + FRAME_BOUNDS.x;
  var prev_y = FILTER_BOUNDS.y + FRAME_BOUNDS.y;
  var x, y;

  for (let level=1; level < pyramid.length; level++)
  {
    let width = Math.floor(prev_width/2);
    let height = Math.floor(prev_height/2);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height);
    let c = get_canvas (width, height, x, y);
    c.getContext('2d').putImageData (new ImageData(new Uint8ClampedArray(pyramid[level].buffer, 0, 4*width*height), width, height), 0, 0);
    document.body.append (c);
  }
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


