'use strict';


var counter = 0;


function filter (input, width, height)
{
  fulfill_resize (width, height);

  input.width = width;
  input.height = height;
  img_copy (input, pyramid[0], height, width, false);

  adjust_gamma (pyramid[0], width, height, pyramid[0], gamma_correction);
  rgb_to (color_space, pyramid[0], width, height, pyramid[0], use_fscs);

  build_pyramid (width, height, 0);

  to_rgb (color_space, pyramid[0], width, height, pyramid[0], use_fscs);
  adjust_gamma (pyramid[0], width, height, pyramid[0], 1/gamma_correction);

  // return new Uint8ClampedArray (pyramid[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? 255 : 0) : x));
  // return new Uint8ClampedArray (pyramid[0].map((x,i)=> (i%4!=3) ? (Math.round(input[i]-x) ? x : 0) : x));
  // return new Uint8ClampedArray (pyramid[0].map((x,i)=> (i%4!=3) ? input[i]-x : x));
  return new Uint8ClampedArray (pyramid[0]);
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


