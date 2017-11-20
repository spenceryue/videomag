'use strict';


function build_pyramid (input, width, height, level)
{
  var save = input;

  var depth = max_pyramid_depth();
  for (let i=1; i < depth; i++)
  {
    corr2_down (input, buf[2], pyramid[i]);
    input = pyramid[i];
  }

  array_copy (pyramid[1], save);

  // corr2_down (input, buf[2], input);
  // array_copy (pyramid[1], save);
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


function max_pyramid_depth (_filter_width, _filter_height, _blur_size)
{
  if (MAX_PYRAMID_DEPTH)
    return MAX_PYRAMID_DEPTH;

  var min_dim = Math.min(_filter_width, _filter_height);
  var depth = 0;
  while (min_dim > _blur_size)
  {
    depth++;
    min_dim = Math.floor (min_dim/2);
  }

  return MAX_PYRAMID_DEPTH = depth;
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
  {
    // c[i].getContext('2d').fillStyle = 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)';
    // c[i].getContext ('2d').fillRect (0, 0, pyramid[i].width, pyramid[i].height);
    let data = new ImageData (new Uint8ClampedArray (pyramid[i+1]), pyramid[i+1].width, pyramid[i+1].height);
    c[i].getContext ('2d').putImageData (data, 0, 0);
  }
}


function display_new_pyramid ()
{
  var prev_width = FILTER_BOUNDS.width;
  var prev_height = FILTER_BOUNDS.height;
  var prev_x = FILTER_BOUNDS.x;
  var prev_y = FILTER_BOUNDS.y;
  var x, y;
  var depth = max_pyramid_depth(prev_width, prev_height, blur_size);

  for (let level=1; level < depth; level++)
  {
    let width = Math.floor(prev_width/2);
    let height = Math.floor(prev_height/2);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height);
    let c = get_canvas (width, height, x, y);
    c.getContext('2d').fillStyle = 'hsla(' + (Math.random() * 360) + ', 100%, 50%, 1)';
    // c.getContext('2d').putImageData (new ImageData(new Uint8ClampedArray(pyramid[level].buffer, 0, 4*width*height), width, height), 0, 0);
    c.getContext('2d').fillRect(0,0,width,height);
    SINK.canvas.parentNode.append (c);
    prev_width = width;
    prev_height = height;
    prev_x = x;
    prev_y = y;
  }
}