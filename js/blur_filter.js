'use strict';


var KernelTypedArray = Float32Array;

var binomial_kernels =
[
  new KernelTypedArray([1]),
  new KernelTypedArray([.5, .5]),
  new KernelTypedArray([.25, .5, .25]),
  new KernelTypedArray([.125, .375, .375, .125]),
  new KernelTypedArray([.0625, .25, .375, .25, .0625]),
];


function get_blur_kernel (window)
{
  return get_binomial_kernel (window);
}


function get_binomial_kernel (window)
{
  if (binomial_kernels.length >= window)
    return binomial_kernels [window - 1];

  for (let i=binomial_kernels.length; i < window; i++)
  {
    binomial_kernels[i] = new KernelTypedArray(i+1);
    binomial_kernels[i][0] = binomial_kernels[i][i] = binomial_kernels[i-1][0] / 2;
    for (let j=1; j < i; j++)
      binomial_kernels[i][j] = (binomial_kernels[i-1][j-1] + binomial_kernels[i-1][j]) / 2;
  }

  return binomial_kernels [window - 1];
}


function conv2_down (input, width, height, output, intermediate)
{
  const stride = 2;

  row_conv_down (input, width, height, intermediate, stride);
  col_conv_down (intermediate, width, height, output, stride);
}


/* Candidate for C++ conversion. */
function row_conv_down (input, width, height, output, stride)
{
  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);
  var copy_only = pre == 0 && post == 0;

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;

    for (let x=0; x < width; x+=stride)
    {
      let col_idx = 4 * x;
      let output_col_idx = Math.floor (col_idx / stride);
      let output_idx = row_ofs + output_col_idx;
      let input_base_idx = row_ofs + col_idx;

      // just copy the edges
      if (x < pre || x >= width - post || copy_only)
      {
        output[output_idx + 0] = input[input_base_idx + 0];
        output[output_idx + 1] = input[input_base_idx + 1];
        output[output_idx + 2] = input[input_base_idx + 2];
      }

      // filter the center
      else
      {
        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        for (let w=-pre; w < post; w++)
        {
          let block_ofs = 4 * w;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


/* Candidate for C++ conversion. */
function col_conv_down (input, width, height, output, stride)
{
  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);
  var copy_only = pre == 0 && post == 0;

  for (let y=0; y < height; y+=stride)
  {
    let row_ofs = 4 * y * width;

    for (let x=0; x < width; x++)
    {
      let col_idx = 4 * x;
      let output_row_ofs = Math.floor (row_ofs / stride);
      let output_idx = output_row_ofs + col_idx;
      let input_base_idx = row_ofs + col_idx;

      // just copy the edges
      if (y < pre || y >= height - post || copy_only)
      {
        output[output_idx + 0] = input[input_base_idx + 0];
        output[output_idx + 1] = input[input_base_idx + 1];
        output[output_idx + 2] = input[input_base_idx + 2];
      }

      // filter the center
      else
      {
        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        for (let w=-pre; w < post; w++)
        {
          let block_ofs = 4 * w * width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


/* Not used. */
/*
var gauss_kernels = [];
var gaussian = (x, mu, sigma) => Math.exp (-Math.pow((x-mu)/sigma,2)/2);
function get_gauss_kernel (window)
{
  if (gauss_kernels[window - 1])
    return gauss_kernels [window - 1];

  let gauss_kernel = new KernelTypedArray(window);
  let mu = (window - 1) / 2;
  let sigma = (window - 1)/6;

  let sum = 0;
  for (let i=0; i < window; i++)
    sum += gauss_kernel[i] = gaussian (i, mu, sigma);

  return gauss_kernels[window - 1] = gauss_kernel.map(x => x / sum);
}
*/
