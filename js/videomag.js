'use strict';


var counter = 0;


function filter (input, width, height)
{
  fulfill_resize (width, height);
  validate_pyramid_memory ();

  pyramid[0] = rgb_to (buf0_color, input, width, height, pyramid[0], use_fscs, true);
  validate_pyramid_memory ();
  build_pyramid (width, height, 0);

  if (buf0_color != buf1_color)
  {
    pyramid[0] = to_rgb (buf0_color, pyramid[0], width, height, pyramid[0], use_fscs);
    validate_pyramid_memory ();
    pyramid[0] = rgb_to (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);
    validate_pyramid_memory ();
  }

  // amplify (pyramid[0], width, height, pyramid[0], 1);
  if (buf1_color != 'rgb')
  {
    pyramid[0] = to_rgb (buf1_color, pyramid[0], width, height, pyramid[0], use_fscs);
    validate_pyramid_memory ();
  }

  // if (++counter % 10 == 1)
  // {
    // console.log (buf[1].map((x,i)=> x-input[i]).reduce((v,x)=>Math.abs(x) > v ? Math.abs(x) : v, 0));
    // console.log (buf2.slice(800,812));
    // console.log (buf[1].slice(800,812));
    // console.log (input.slice(800,812));
    // buf[1].slice(800,812).forEach((val,i) => console.log(val,input[800+i], val-input[800+i]));
  // }

  // return new Uint8ClampedArray (buf[1].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? 255 : 0) : x));
  // return new Uint8ClampedArray (buf[0].map((x,i)=> (i%4!=3) ? (Math.round(x-input[i]) ? x : 0) : x));
  // return new Uint8ClampedArray (buf[0].map((x,i)=> (i%4!=3) ? x-input[i] : x));
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


