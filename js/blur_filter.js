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
    binomial_kernels[i] = malloc (KernelTypedArray, i+1);
    binomial_kernels[i][0] = binomial_kernels[i][i] = binomial_kernels[i-1][0] / 2;
    for (let j=1; j < i; j++)
      binomial_kernels[i][j] = (binomial_kernels[i-1][j-1] + binomial_kernels[i-1][j]) / 2;
  }

  return binomial_kernels [window - 1];
}


/* 2D correlation (same as convolution but filter is not reversed,
   identical result as convolution if filter is symmetric).
   Downsamples by the STRIDE factor at the same time for efficiency. */
function corr2_down (input, intermediate, output)
{
  const stride = 2;

  let result_width = Math.floor((input.width-1)/stride);
  let result_height = Math.floor((input.height-1)/stride);
  console.assert (result_width <= intermediate.width, 'Intermediate width not large enough for row_corr_down()!');
  console.assert (input.height <= intermediate.height, 'Intermediate array height less than input height!');
  console.assert (result_width <= output.width, result_width, output.width, 'Output width less than width of row_corr_down() output!');
  console.assert (result_height <= output.height, result_height, output.height, 'Output height not large enough for row_corr_down()!');

  row_corr_down (
    input, input.width, input.height,
    intermediate, intermediate.width,
    stride
  );

  col_corr_down (
    intermediate, intermediate.width, intermediate.height,
    output, output.width,
    stride
  );

  // array_copy (intermediate, output, output.height, output.width);

  // row_corr_up (output, width, height, intermediate, stride);
  // for (let i=0; i<output.length; i++)
    // output[i] = intermediate[i];
}


/* 2D correlation (same as convolution but filter is not reversed,
   identical result as convolution if filter is symmetric).
   Upsamples by the STRIDE factor at the same time for efficiency. */
/*function corr2_up (input, width, height, output, intermediate)
{
  const stride = 2;

  row_corr_up (input, width, height, intermediate, stride);
  col_corr_up (intermediate, width, height, output, stride);
}*/


/* Candidate for C++ conversion. */
function row_corr_down (input, in_width, in_height, output, out_width, stride)
{
  if (use_wasm)
  {
    _row_corr_down (input.ptr, in_width, in_height, output.ptr, out_width, stride, kernel.ptr, kernel.length);
    return;
  }


  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);

  for (let y=0; y < in_height; y++)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * y * out_width;

    for (let x=0; x < in_width; x+=stride)
    {
      let col_idx = 4 * x;
      let output_col_idx = Math.floor (col_idx / stride);
      let output_idx = output_row_ofs + output_col_idx;
      let input_base_idx = row_ofs + col_idx;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (x < pre)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let input_idx = row_ofs + 4 * left_reflect (x + w, 0);
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let block_ofs = 4 * w;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (x >= in_width - post)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let block_ofs = 4 * w;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let input_idx = row_ofs + 4 * right_reflect (x + w, in_width);
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (let w=-pre; w <= post; w++)
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
function col_corr_down (input, in_width, in_height, output, out_width, stride)
{
  if (use_wasm)
  {
    _row_corr_down (input.ptr, in_width, in_height, output.ptr, out_width, stride, kernel.ptr, kernel.length);
    return;
  }

  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);

  for (let y=0; y < in_height; y+=stride)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * Math.floor (y / stride) * out_width;

    for (let x=0; x < in_width; x++)
    {
      let col_idx = 4 * x;
      let output_idx = output_row_ofs + col_idx;
      let input_base_idx = row_ofs + col_idx;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (y < pre)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let input_idx = 4 * left_reflect (y + w, 0) * in_width + col_idx;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let block_ofs = 4 * w * in_width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (y >= in_height - post)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let block_ofs = 4 * w * in_width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let input_idx = 4 * right_reflect (y + w, in_height) * in_width + col_idx;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (let w=-pre; w <= post; w++)
        {
          let block_ofs = 4 * w * in_width;
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
/*function col_corr_down (input, in_width, in_height, output, out_width, stride)
{
  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);
  var copy_only = pre == 0 && post == 0;

  for (let y=0; y < in_height; y+=stride)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * Math.floor (y / stride) * out_width;

    for (let x=0; x < in_width; x++)
    {
      let col_idx = 4 * x;
      let output_idx = output_row_ofs + col_idx;
      let input_base_idx = row_ofs + col_idx;

      // just copy the edges
      if (1 || y < pre || y >= in_height - post || copy_only)
      {
        output[output_idx + 0] = input[input_base_idx + 0];
        output[output_idx + 1] = input[input_base_idx + 1];
        output[output_idx + 2] = input[input_base_idx + 2];
        // Clear alpha channel right now because the edges will not
        // magnify correctly later, since they contain all frequencies.
        // output[output_idx + 3] = 0;
      }

      // filter the center
      else
      {
        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        for (let w=-pre; w < post; w++)
        {
          let block_ofs = 4 * w * in_width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}*/


/* Candidate for C++ conversion. */
function row_corr_up (input, width, height, output, stride)
{
  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);
  var copy_only = pre == 0 && post == 0;

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    let output_row_ofs = row_ofs * stride;

    for (let x=0; x < width; x++)
    {
      let col_idx = 4 * x;
      let input_base_idx = row_ofs + col_idx;

      for (let xx=x*stride; xx < (x+1)*stride; xx++)
      {
        let output_col_idx = 4 * xx;
        let output_idx = output_row_ofs + output_col_idx;

        // just copy the edges
        if (xx < pre || xx >= width - post || copy_only)
        {
          if (xx%stride == 0)
          {
            output[output_idx + 0] = input[input_base_idx + 0];
            output[output_idx + 1] = input[input_base_idx + 1];
            output[output_idx + 2] = input[input_base_idx + 2];
          }
          else
          {
            output[output_idx + 0] = 0;
            output[output_idx + 1] = 0;
            output[output_idx + 2] = 0;
          }
          // Clear alpha channel right now because the edges will not
          // magnify correctly later, since they contain all frequencies.
          // output[output_idx + 3] = 0;
        }

        // filter the center
        else
        {
          output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

          // Start off aligned with a nonzero element of upsampled input.
          // Then loop by stride, since other elements are zero.
          /*
              Illustration:

              input:
                1 3 5
              upsampled input (by factor of 2):
                1 0 3 0 5 0
              kernel:
                a b c

              Execution trace (for xx=0 to xx=5):
                xx = 0:
                  (edge) -> picks the if-branch in the code
                xx = 1:
                  output = a*1 + b*0 + c*3
                xx = 2:
                  output = a*0 + b*3 + c*0
                ...

              When xx = 1, we offset by 0 since the first input element is nonzero (upsampled_input[0+0]=1).
              When xx = 2, we offset by +1 to start on a nonzero element (upsampled_input[1+1]=3).
              We stride over kernel elements by the upsample factor, since the corresponding upsampled
              input elements in between strides are zero.
              We always use a non-negative offset so that the kernel array is not read out of bounds.
              The offset is calculated by the positive result of remainder(xx + pre, stride).
          */
          let kernel_ofs = ((xx + pre) % stride + stride) % stride;
          for (let w=-pre + kernel_ofs; w < post; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs)/stride; // guaranteed to be divisible
            let kernel_idx = w + pre;

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


/* Candidate for C++ conversion. */
function col_corr_up (input, width, height, output, stride)
{
  var pre = Math.ceil((kernel.length-1)/2);
  var post = Math.floor((kernel.length-1)/2);
  var copy_only = pre == 0 && post == 0;

  for (let y=0; y < height; y++)
  {
    let row_ofs = 4 * y * width;
    let output_row_ofs = row_ofs * stride;

    for (let x=0; x < width; x++)
    {
      let col_idx = 4 * x;
      let input_base_idx = row_ofs + col_idx;

      let output_row_ofs = row_ofs * stride;
      let output_idx = output_row_ofs + col_idx;

      // just copy the edges
      if (y < pre || y >= height - post || copy_only)
      {
        output[output_idx + 0] = input[input_base_idx + 0];
        output[output_idx + 1] = input[input_base_idx + 1];
        output[output_idx + 2] = input[input_base_idx + 2];
        // Clear alpha channel right now because the edges will not
        // magnify correctly later, since they contain all frequencies.
        output[output_idx + 3] = 0;
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
