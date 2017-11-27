'use strict';


var counter = 0;


function filter (input, width, height)
{
  fulfill_resize (width, height);

  input.width = width;
  img_copy (input, pyramids[0][0], width, height, false);

  adjust_gamma (pyramids[0][0], width, height, pyramids[0][0], gamma_correction);
  rgb_to (color_space, pyramids[0][0], width, height, pyramids[0][0], use_fscs);

  build_pyramid (width, height);

  reconstruct_pyramid (width, height);

  to_rgb (color_space, pyramids[0][0], width, height, pyramids[0][0], use_fscs);
  adjust_gamma (pyramids[0][0], width, height, pyramids[0][0], 1/gamma_correction);

  // return new Uint8ClampedArray (pyramids[0][0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (pyramids[0][0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (pyramids[0][0].map((x,i)=> (i%4!=3) ? input[i]-x : x));
  return new Uint8ClampedArray (pyramids[0][0]);
}


/*function bandpass_exp_filter_pyramids (width, height)
{
  var depth = max_pyramid_depth (width, height);
  for (let i=depth-1; i >= 1; i--)
  {
    img_linear_combine (pyramids[0][i], pyramids[1][i], )
  }
}

period = 1/(1-r1) * 1/fps
freq = fps * (1 - r1)
30 * (1 - .4) = 18
30 * (1 - .05) = 28.5*/
