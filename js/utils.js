'use strict';


/* Candidate for C++ conversion. */
function fill_alpha (input, value)
{
  for (let i=0; i < input.length; i+=4)
    input[i + 3] = value;

  return input;
}


/* Possible C++ dependency. */
function next_multiple (x, m)
{
  return x + (m - x % m) % m;
}


/* Candidate for C++ conversion. */
function full_scale_contrast_stretch (input, min, max)
{
  if (min == undefined || max == undefined)
  {
    min = 255;
    max = 0;
    for (let i=0; i < input.length; i+=4)
    {
      let value = input[i + 0];
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  var scale = 255 / (max - min);
  var offset = -min * scale;

  for (let i=0; i < input.length; i+=4)
    input[i + 0] = scale * input[i + 0] + offset;

  return input;
}


/* Possible C++ dependency. */
function left_reflect (i, min)
{
  // start + [ reflected distance ]
  // (min) + [ (min - 1) - i ]
  return (i < min) ? 2 * min - 1 - i : i;
}


/* Possible C++ dependency. */
function right_reflect (i, max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return (i >= max) ? 2 * max - 1 - i : i;
}


function array_copy (input, output)
{
  console.assert (input.width <= output.width, input.width, output.width, 'array_copy: input.width > output.width');
  console.assert (input.height <= output.height, input.height, output.height, 'array_copy: input.height > output.height');

  for (let y=0; y < input.height; y++)
  {
    let row_ofs = 4 * y * input.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < input.width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
    }
  }
}


function array_copy_a (input, output)
{
  console.assert (input.width <= output.width, input.width, output.width, 'array_copy: input.width > output.width');
  console.assert (input.height <= output.height, input.height, output.height, 'array_copy: input.height > output.height');

  for (let y=0; y < input.height; y++)
  {
    let row_ofs = 4 * y * input.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < input.width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
      output[output_idx + 3] = input[input_idx + 3];
    }
  }
}
