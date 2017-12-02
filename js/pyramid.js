'use strict';

var PYRAMIDS = Array (4);
var PyramidTypedArray = Float32Array;

var pyramid_depths_map = new Map ();
var pyramid_prev_dimension_map = new Map ();
const PYRAMID_STRIDE = 2;

var PYRAMID;
var TEMP_PYRAMID;


function pyramids_init ()
{
  var depth = max_pyramid_depth(FRAME_WIDTH, FRAME_HEIGHT, 1);

  for (let i=0; i < PYRAMIDS.length; i++)
    PYRAMIDS[i] = make_pyramid (FRAME_WIDTH, FRAME_HEIGHT, depth);

  PYRAMID = PYRAMIDS[0];
  TEMP_PYRAMID = PYRAMIDS[1];

  iir_init(); // uses PYRAMIDS[2], PYRAMIDS[3];
}


function make_pyramid (width, height, depth, type=PyramidTypedArray)
{
  var pyramid = [];

  for (let j=0; j < depth; j++)
  {
    pyramid[j] = fill_alpha (malloc (type, 4 * width * height), 255);
    pyramid[j].width = width;
    pyramid[j].height = height;

    [width, height] = next_pyramid_dimensions (width, height);

    /* To check for memory corruption.
    (Assumes malloc() will hand out next piece of memory close to pyramid[j].) */
    make_pyramid.MAGIC.push (malloc (Uint32Array, 1));
    make_pyramid.MAGIC[make_pyramid.MAGIC.length-1][0] = 0xdeadbeef;
  }

  return pyramid;
}
make_pyramid.MAGIC = [];


function validate_pyramid_memory ()
{
  for (let i=0; i<make_pyramid.MAGIC.length; i++)
    if (make_pyramid.MAGIC[i][0] != 0xdeadbeef)
    {
      throw '\n(\u256F\u00B0\u25A1\u00B0)\u256F.-~ \u253B\u2501\u253B You ate my 0xdeadbeef !!!!\n'
      + '\\(\u00B4\u0414` )/==3 And you pooped it out as:'
      + '0x' + make_pyramid.MAGIC[i][0].toString(16);
    }
}


function build_pyramid (width, height, depth)
{
  for (let i=0; i < depth-1; i++)
  {
    corr2_down (PYRAMID[i], TEMP_PYRAMID[i], PYRAMID[i+1]);
    // full_scale_contrast_stretch (PYRAMID[i+1])
    corr2_up (PYRAMID[i+1], TEMP_PYRAMID[i], PYRAMID[i], -(PYRAMID_STRIDE**2));
    // last argument is to normalize kernel weights after upsampling.
    // negative sign is to subtract the result from PYRAMID[i]
  }
}


function reconstruct_pyramid (width, height, depth)
{
  for (let i=depth-1; i >= 1; i--)
  {
    corr2_up (PYRAMID[i], TEMP_PYRAMID[i-1], PYRAMID[i-1], +(PYRAMID_STRIDE**2));
    // last argument is to normalize kernel weights after upsampling.
    // positive sign is to add the result to PYRAMID[i-1]
  }
}


function resize_all (pyramids, width, height, depth)
{
  for (let i=0; i < pyramids.length; i++)
    resize_pyramid (pyramids[i], width, height, depth);

  validate_pyramid_memory ();
}


function resize_pyramid (pyramid, width, height, depth)
{
  for (let i=0; i < depth; i++)
  {
    pyramid[i] = get_resized_array (pyramid[i], width, height);

    [width, height] = next_pyramid_dimensions (width, height);
  }
}


function next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height)
{
  switch (level%4)
  {
    case 0:
      return [prev_x, prev_y - height];
    case 1:
      return [prev_x + prev_width, prev_y];
    case 2:
      return [prev_x + prev_width - width, prev_y + prev_height];
    case 3:
      return [prev_x - width, prev_y + prev_height - height];
  }
}


function next_pyramid_dimensions (width, height)
{
  const half = x => Math.floor ((x-1)/PYRAMID_STRIDE) + 1;

  var result = [half (width), half (height)];
  var key = result.join (' ')

  pyramid_prev_dimension_map.set (key, [width, height]);

  // console.log ('next_pyramid_dimensions:', '(', width, 'x', height, ')', '=>', '(', result[0], 'x', result[1], ')');

  return result;
}


function prev_pyramid_dimensions (width, height)
{
  var key = [width, height].join (' ');
  var result = pyramid_prev_dimension_map.get (key);

  // console.log ('prev_pyramid_dimensions:', '(', result[0], 'x', result[1], ')', '<=', '(', width, 'x', height, ')');
  return result;
}


function dump_prev_map (print=true, value=false)
{
  var a = Array.from(pyramid_prev_dimension_map.keys());
  var b = Array.from(pyramid_prev_dimension_map.values());
  var c = a.map((x,i)=>[x].concat(b[i]));

  if (print)
    console.table(c);

  if (value)
    return c;
}


function max_pyramid_depth (_filter_width=FILTER_BOUNDS.width, _filter_height=FILTER_BOUNDS.height, _blur_size=blur_size)
{
  var key = [_filter_width, _filter_height, _blur_size].join(' ');

  if (pyramid_depths_map.has(key))
  {
    // console.log ('max_pyramid_depth:', key, '=>', pyramid_depths_map.get(key));
    return pyramid_depths_map.get(key);
  }

  var min_dim = Math.min(_filter_width, _filter_height);
  var depth = 0;
  while (min_dim > _blur_size)
  {
    depth++;
    [min_dim, ] = next_pyramid_dimensions (min_dim);
  }

  // console.log ('max_pyramid_depth:', key, '=>', depth);
  pyramid_depths_map.set(key, depth);
  return depth;
}


function get_canvas (width, height, x, y, style_scale=1)
{
  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = parseFloat (x * style_scale) + 'px';
  canvas.style.top  = parseFloat (y * style_scale) + 'px';
  canvas.style.width = parseFloat (width * style_scale) + 'px';
  canvas.style.height = parseFloat (height * style_scale) + 'px';

  canvas.width = width;
  canvas.height = height;
  canvas.classList.toggle('pyramid');
  // canvas.classList.toggle('debug_border');

  return canvas;
}


function remove_previous_pyramids (base=SINK.canvas.parentNode)
{
  Array.from (base.children).forEach (e => e.classList.contains ('pyramid') ? e.remove () : undefined);
}


function display_pyramid (INPUT=PYRAMID, OUTPUT_=OUTPUT[0], base=SINK.canvas.parentNode, skip_first=true)
{
  var canvases = Array.from (base.children).filter (e => e.classList.contains ('pyramid'));

  if (blur_size_changed || filter_size_changed || !canvases.length)
  {
    if (canvases.length)
      canvases.forEach (e => e.remove());
    display_new_pyramid (base, skip_first);
  }
  else
    display_old_pyramid (canvases, INPUT, OUTPUT_, skip_first);
}


function display_old_pyramid (c, INPUT=PYRAMID, OUTPUT_=OUTPUT[0], skip_first=true)
{
  if (skip_first)
  {
    INPUT = INPUT.slice (1);
    OUTPUT_ = OUTPUT_.slice (1);
  }

  for (let i=0; i < c.length; i++)
  {
    let img = INPUT[i];
    to_rgb (color_space, img, img.width, img.height);

    adjust_gamma (img, img.width, img.height, OUTPUT_[i], 1/gamma_correction);

    img_show (c[i].getContext ('2d'), OUTPUT_[i]);
  }
}


function display_new_pyramid (base=SINK.canvas.parentNode, skip_first=true)
{
  var style_scale = SINK.canvas.getBoundingClientRect().width / FRAME_WIDTH;
  /*var [prev_width, prev_height] = [FILTER_BOUNDS.width, FILTER_BOUNDS.height];
  var [prev_x, prev_y] = [FILTER_BOUNDS.x, FILTER_BOUNDS.y];
  var x, y;
  var depth = max_pyramid_depth (prev_width, prev_height, blur_size);*/
  var [width, height] = [FILTER_BOUNDS.width, FILTER_BOUNDS.height];
  var [x, y] = [FILTER_BOUNDS.x, FILTER_BOUNDS.y];
  var depth = max_pyramid_depth (width, height, blur_size);

  for (let level=0; level < depth; level++)
  {
    if (!skip_first || level > 0)
    {
      let c = get_canvas (width, height, x, y, style_scale);
      c.getContext ('2d').fillStyle = 'hsla(' + (Math.random() * 360) + ', 100%, 90%, .5)';
      c.getContext ('2d').fillRect(0,0, width, height);
      base.append (c);
    }
    let [prev_width, prev_height] = [width, height];
    let [prev_x, prev_y] = [x, y];
    [width, height] = next_pyramid_dimensions (width, height);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level+1, width, height);

    /*let [width, height] = next_pyramid_dimensions (prev_width, prev_height);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height);
    let c = get_canvas (width, height, x, y, style_scale);
    c.getContext ('2d').fillStyle = 'hsla(' + (Math.random() * 360) + ', 100%, 90%, .5)';
    c.getContext ('2d').fillRect(0,0, width, height);
    base.append (c);
    [prev_width, prev_height] = [width, height];
    [prev_x, prev_y] = [x, y];*/
  }
}