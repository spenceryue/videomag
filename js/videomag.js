'use strict';


var counter = 0;


function filter (input, width, height)
{
  fulfill_resize (width, height);

  input.width = width;
  input.height = height;

  if (buf0_color == 'rgb')
    pyramid[0] = rgb_to (buf0_color, input, width, height, pyramid[0], use_fscs, true);
  else
  {
    array_copy (input, pyramid[0]);
    pyramid[0] = rgb_to (buf0_color, pyramid[0], width, height, pyramid[0], use_fscs);
  }
  build_pyramid (width, height, 0);

  if (buf0_color != buf1_color)
  {
    pyramid[0] = to_rgb (buf0_color, pyramid[0], width, height, pyramid[0], use_fscs);
    pyramid[0] = rgb_to (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);
  }

  // amplify (pyramid[0], width, height, pyramid[0], 1);
  if (buf1_color != 'rgb')
    pyramid[0] = to_rgb (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);

  // return new Uint8ClampedArray (buf[1].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? 255 : 0) : x));
  // return new Uint8ClampedArray (buf[0].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? x : 0) : x));
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


