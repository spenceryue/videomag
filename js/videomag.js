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
    console.log ('0:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
    array_copy (input, pyramid[0]);
    console.log ('1:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
    pyramid[0] = rgb_to (buf0_color, pyramid[0], width, height, pyramid[0], use_fscs);
    console.log ('2:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
  }
  build_pyramid (width, height, 0);
  console.log ('3:\t', 'pyramid:[0]', pyramid[0].slice(0,12));

  if (buf0_color != buf1_color)
  {
    pyramid[0] = to_rgb (buf0_color, pyramid[0], width, height, pyramid[0], use_fscs);
    console.log ('4:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
    pyramid[0] = rgb_to (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);
    console.log ('5:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
  }

  if (buf1_color != 'rgb')
  {
    pyramid[0] = to_rgb (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);
    console.log ('6:\t', 'pyramid:[0]', pyramid[0].slice(0,12));
  }

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


