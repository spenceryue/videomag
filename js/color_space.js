'use strict';


function rgb_to (to, input, width, height, output, fscs, copy=false)
{
  switch (to)
  {
    case 'rgb':
      if (copy)
        for (let i=0; i<output.length; i++)
          output[i] = input[i];
      else
        output = input;
      break;
    case 'ntsc':
      if (fscs)
        rgb2ntsc_fscs (input, width, height, output);
      else
        rgb2ntsc (input, width, height, output);
      break;
    case 'ycbcr':
      if (fscs)
        rgb2ycbcr_fscs (input, width, height, output);
      else
        rgb2ycbcr (input, width, height, output);
      break;
  }
  validate_pyramid_memory ();

  return output;
}


function to_rgb (from, input, width, height, output, fscs, copy=false)
{
  switch (from)
  {
    case 'rgb':
      if (copy)
        for (let i=0; i<output.length; i++)
          output[i] = input[i];
      else
        output = input;
      break;
    case 'ntsc':
      if (fscs)
        ntsc2rgb_fscs (input, width, height, output);
      else
        ntsc2rgb (input, width, height, output);
      break;
    case 'ycbcr':
      if (fscs)
        ycbcr2rgb_fscs (input, width, height, output);
      else
        ycbcr2rgb (input, width, height, output);
      break;
  }
  validate_pyramid_memory ();

  return output;
}


/* Candidate for C->WebAssembly conversion. */
function rgb2ntsc (input, width, height, output)
{
  if (use_wasm)
  {
    _rgb2ntsc (input.ptr, width, height, output.ptr);
    // TODO: replace with "direct" call
    return;
  }

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let R = input[index + 0];
      let G = input[index + 1];
      let B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;
    }
  }
}


/* Candidate for C->WebAssembly conversion. */
function rgb2ntsc_fscs (input, width, height, output)
{
  if (use_wasm)
  {
    _rgb2ntsc_fscs (input.ptr, width, height, output.ptr);
    return;
  }

  var min = 255;
  var max = 0;

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let R = input[index + 0];
      let G = input[index + 1];
      let B = input[index + 2];

      output[index + 0] = 0.29900 * R +  0.58700 * G  +  0.11400 * B;
      output[index + 1] = 0.59600 * R + -0.27400 * G  + -0.32200 * B;
      output[index + 2] = 0.21100 * R + -0.52300 * G  +  0.31200 * B;

      let Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, min, max);
}


/* Candidate for C->WebAssembly conversion. */
function ntsc2rgb (input, width, height, output)
{
  if (use_wasm)
  {
    _ntsc2rgb (input.ptr, width, height, output.ptr);
    return;
  }

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let Y = input[index + 0];
      let I = input[index + 1];
      let Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


/* Candidate for C->WebAssembly conversion. */
function ntsc2rgb_fscs (input, width, height, output)
{
  if (use_wasm)
  {
    _ntsc2rgb_fscs (input.ptr, width, height, output.ptr);
    return;
  }

  full_scale_contrast_stretch (input);

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let Y = input[index + 0];
      let I = input[index + 1];
      let Q = input[index + 2];

      output[index + 0] = 1.000 * Y +  0.95617 * I  +  0.62143 * Q;
      output[index + 1] = 1.000 * Y + -0.27269 * I  + -0.64681 * Q;
      output[index + 2] = 1.000 * Y + -1.10374 * I  +  1.70062 * Q;
    }
  }
}


/* Candidate for C->WebAssembly conversion. */
/*
  JPEG variant: https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
  Original spec: http://www.itu.int/rec/T-REC-T.871-201105-I/en

  FSCS packed in as well (not much effect).
*/
function rgb2ycbcr (input, width, height, output)
{
  if (use_wasm)
  {
    _rgb2ycbcr (input.ptr, width, height, output.ptr);
    return;
  }

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let R = input[index + 0];
      let G = input[index + 1];
      let B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B + 128;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B + 128;
    }
  }
}


/* Candidate for C->WebAssembly conversion. */
function ycbcr2rgb (input, width, height, output)
{
  if (use_wasm)
  {
    _ycbcr2rgb (input.ptr, width, height, output.ptr);
    return;
  }

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let Y = input[index + 0];
      let Cb = input[index + 1];
      let Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +             +  1.402000 * (Cr - 128);
      output[index + 1] = 1.00000 * Y   + -0.344136 * (Cb - 128)  + -0.714136 * (Cr - 128);
      output[index + 2] = 1.00000 * Y   +  1.772000 * (Cb - 128);
    }
  }
}


/* Candidate for C->WebAssembly conversion. */
function rgb2ycbcr_fscs (input, width, height, output)
{
  if (use_wasm)
  {
    _rgb2ycbcr_fscs (input.ptr, width, height, output.ptr);
    return;
  }

  var min = 255;
  var max = 0;

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let R = input[index + 0];
      let G = input[index + 1];
      let B = input[index + 2];

      output[index + 0] =  0.299000 * R +  0.587000 * G +  0.114000 * B;
      output[index + 1] = -0.168736 * R + -0.331264 * G +  0.500000 * B + 128;
      output[index + 2] =  0.500000 * R + -0.418688 * G + -0.081312 * B + 128;

      let Y = output[index + 0];
      if (Y < min) min = Y;
      if (Y > max) max = Y;
    }
  }

  full_scale_contrast_stretch (output, min, max);
}


/* Candidate for C->WebAssembly conversion. */
function ycbcr2rgb_fscs (input, width, height, output)
{
  if (use_wasm)
  {
    _ycbcr2rgb_fscs (input.ptr, width, height, output.ptr);
    return;
  }

  full_scale_contrast_stretch (input);

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    for (let x=0; x < width; x++)
    {
      let index = row_ofs + 4 * x;
      console.assert (index + 2 < input.length)
      console.assert (index + 2 < output.length)

      let Y = input[index + 0];
      let Cb = input[index + 1];
      let Cr = input[index + 2];

      output[index + 0] = 1.00000 * Y   +             +  1.402000 * (Cr - 128);
      output[index + 1] = 1.00000 * Y   + -0.344136 * (Cb - 128)  + -0.714136 * (Cr - 128);
      output[index + 2] = 1.00000 * Y   +  1.772000 * (Cb - 128);
    }
  }
}
