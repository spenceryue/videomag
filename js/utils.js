'use strict';


/* Candidate for C->WebAssembly conversion. */
function fill_alpha (input, value)
{
  for (let i=0; i < input.length; i+=4)
    input[i + 3] = value;

  return input;
}


/* Possible C->WebAssembly dependency. */
function next_multiple (x, m)
{
  return x + (m - x % m) % m;
}


/* Candidate for C->WebAssembly conversion. */
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


/* Possible C->WebAssembly dependency. */
function left_reflect (i, min)
{
  // start + [ reflected distance ]
  // (min) + [ (min - 1) - i ]
  return (i < min) ? 2 * min - 1 - i : i;
}


/* Possible C->WebAssembly dependency. */
function right_reflect (i, max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return (i >= max) ? 2 * max - 1 - i : i;
}


/* Possible C->WebAssembly dependency. */
function both_reflect (i, min, max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return left_reflect (right_reflect (i, max), min);
}


function array_copy (input, output, rows = input.height, cols = input.width)
{
  console.assert (typeof input.width != 'undefined')
  console.assert (typeof input.height != 'undefined')
  console.assert (typeof output.width != 'undefined')
  console.assert (typeof output.height != 'undefined')

  for (let y=0; y < rows; y++)
  {
    let row_ofs = 4 * y * input.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < cols; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx < input.length);
      console.assert (output_idx < output.length);

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


function array_copy_a (input, output, rows = input.height, cols = input.width)
{
  console.assert (typeof input.width != 'undefined')
  console.assert (typeof input.height != 'undefined')
  console.assert (typeof output.width != 'undefined')
  console.assert (typeof output.height != 'undefined')

  for (let y=0; y < rows; y++)
  {
    let row_ofs = 4 * y * input.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < cols; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx < input.length);
      console.assert (output_idx < output.length);

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
      output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


/* From here: https://stackoverflow.com/a/10284006/3624264 */
function zip (...arrays)
{
  return arrays[0].map ((x,i) => arrays.map (array => array[i]));
}


/* From here: https://stackoverflow.com/a/31194949/3624264 */
function $args(func) {
    return (func + '')
      .replace(/[/][/].*$/mg,'') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
      .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(',').filter(Boolean); // split & filter [""]
}

