'use strict';


var pyramid_depths_map = new Map ();
var pyramid_prev_dimension_map = new Map ();
const PYRAMID_STRIDE = 2;


function build_pyramid (width, height, level)
{
  var depth = max_pyramid_depth (width, height, blur_size);
  for (let i=0; i < depth-1; i++)
  {
    // console.log ('pyramid i: ', i);
    // var tmp = malloc (IntermediateTypedArray, pyramid[i].length);
    // tmp.width = pyramid[i].width;
    // tmp.height = pyramid[i].height;
    corr2_down (pyramid[i], buf[2], pyramid[i+1]);
    // array_copy (pyramid[i], pyramid[i+1], pyramid[i+1].height, pyramid[i+1].width);
    // array_copy (pyramid[i+1], tmp);
    corr2_up (pyramid[i+1], buf[2], pyramid[i], false);
    // full_scale_contrast_stretch (tmp);
    // full_scale_contrast_stretch (pyramid[i]);
/*    for (let j=0; j<tmp.length; j++)
    {
      if (j%4==3)
        continue;
      // pyramid[i][j] -= tmp[j];
      pyramid[i][j] = tmp[j];
    }*/
    // free (tmp);
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


function get_canvas (width, height, x, y)
{
  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = parseInt(x) + 'px';
  canvas.style.top  = parseInt(y) + 'px';
  canvas.width = width;
  canvas.height = height;
  canvas.classList.toggle('pyramid');
  // canvas.classList.toggle('debug_border');

  return canvas;
}


function remove_previous_pyramids ()
{
  document.querySelectorAll('.pyramid').forEach(e => e.remove());
}


function display_pyramid ()
{
  var canvases = document.querySelectorAll('.pyramid');

  if (blur_size_changed || filter_size_changed || !canvases.length)
  {
    if (canvases.length)
      canvases.forEach (e => e.remove());
    display_new_pyramid ();
  }
  else
    display_old_pyramid (canvases);
}


function display_old_pyramid (c)
{
  for (let i=0; i < c.length; i++)
    show_image (c[i].getContext ('2d'), pyramid[i+1], buf0_color);
}


function display_new_pyramid ()
{
  var [prev_width, prev_height] = [FILTER_BOUNDS.width, FILTER_BOUNDS.height];
  var [prev_x, prev_y] = [FILTER_BOUNDS.x, FILTER_BOUNDS.y];
  var x, y;
  var depth = max_pyramid_depth (prev_width, prev_height, blur_size);
  var parentNode = SINK.canvas.parentNode;

  for (let level=1; level < depth; level++)
  {
    let [width, height] = next_pyramid_dimensions (prev_width, prev_height);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height);
    let c = get_canvas (width, height, x, y);
    c.getContext ('2d').fillStyle = 'hsla(' + (Math.random() * 360) + ', 100%, 90%, .5)';
    c.getContext ('2d').fillRect(0,0, width, height);
    parentNode.append (c);
    [prev_width, prev_height] = [width, height];
    [prev_x, prev_y] = [x, y];
  }
}