'use strict';


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


function get_canvas (width, height, x, y)
{
  var canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.left = parseInt(x) + 'px';
  canvas.style.top  = parseInt(y) + 'px';
  canvas.width = width;
  canvas.height = height;
  canvas.classList.toggle('pyramid');
  canvas.classList.toggle('debug_border');

  return canvas;
}


function remove_previous_pyramids ()
{
  document.querySelectorAll('.pyramid').forEach(e => e.parentNode.removeChild(e));
}


function display_pyramid ()
{
  var prev_width = FILTER_BOUNDS.width;
  var prev_height = FILTER_BOUNDS.height;
  var prev_x = FILTER_BOUNDS.x + FRAME_BOUNDS.x;
  var prev_y = FILTER_BOUNDS.y + FRAME_BOUNDS.y;
  var x, y;

  remove_previous_pyramids ();

  for (let level=1; level < 4; level++)
  {
    let width = Math.floor(prev_width/2);
    let height = Math.floor(prev_height/2);
    [x, y] = next_pyramid_position (prev_width, prev_height, prev_x, prev_y, level, width, height);
    let c = get_canvas (width, height, x, y);
    // c.getContext('2d').putImageData (new ImageData(new Uint8ClampedArray(pyramid[level].buffer, 0, 4*width*height), width, height), 0, 0);
    c.getContext('2d').fillRect(0,0,width,height);
    document.body.append (c);
    prev_width = width;
    prev_height = height;
    prev_x = x;
    prev_y = y;
  }
}