'use strict';


var KernelTypedArray = Float32Array;
var binomial_kernels =
[
  [1],
  [.5, .5],
  [.25, .5, .25],
  [.125, .375, .375, .125],
  [.0625, .25, .375, .25, .0625],
];


function blur_init ()
{
  for (let i=0; i<binomial_kernels.length; i++)
  {
    let tmp = malloc (KernelTypedArray, i+1);

    for (let j=0; j < i+1; j++)
      tmp[j] = binomial_kernels[i][j];

    binomial_kernels[i] = tmp;
  }
}


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
  let [result_width, result_height] = next_pyramid_dimensions (input.width, input.height);

  console.assert (result_width <= intermediate.width, 'Intermediate width not large enough for row_corr_down()!');
  console.assert (input.height <= intermediate.height, 'Intermediate array height less than input height!');
  console.assert (result_width <= output.width, result_width, output.width, 'Output width less than width of row_corr_down() output!');
  console.assert (result_height <= output.height, result_height, output.height, 'Output height not large enough for row_corr_down()!');

  row_corr_down (
    input, input.width,
    intermediate, intermediate.width,
    input.width, input.height,
    PYRAMID_STRIDE
  );
  validate_pyramid_memory ();

  col_corr_down (
    intermediate, intermediate.width,
    output, output.width,
    result_width, input.height,
    PYRAMID_STRIDE
  );
  validate_pyramid_memory ();
}


function corr2_up (input, intermediate, output, scale=1)
{
  let [result_width, result_height] = prev_pyramid_dimensions (input.width, input.height);

  console.assert (result_width <= intermediate.width, 'Intermediate width not large enough for row_corr_up()!');
  console.assert (input.height <= intermediate.height, 'Intermediate array height less than input height!');
  console.assert (result_width <= output.width, result_width, output.width, 'Output width less than width of row_corr_up() output!');
  console.assert (result_height <= output.height, result_height, output.height, 'Output height not large enough for row_corr_up()!');

  row_corr_up (
    input, input.width,
    intermediate, intermediate.width,
    input.width, input.height,
    output.width,
    PYRAMID_STRIDE
  );
  validate_pyramid_memory ();

  if (scale != 1)
    col_corr_up_mult_add (
      intermediate, intermediate.width,
      output, output.width,
      result_width, input.height,
      output.height,
      scale,
      PYRAMID_STRIDE
    );
  else
    col_corr_up (
      intermediate, intermediate.width,
      output, output.width,
      result_width, input.height,
      output.height,
      PYRAMID_STRIDE
    );
  validate_pyramid_memory ();
}


/* Candidate for js->C->WebAssembly conversion. */
function row_corr_down (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  stride
  )
{
  if (use_wasm)
  {
    _row_corr_down (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * y * out_width;

    for (let x=0; x < operate_width; x+=stride)
    {
      let col_idx = 4 * x;
      let output_col_idx = Math.floor (col_idx / stride);
      let output_idx = output_row_ofs + output_col_idx;
      let input_base_idx = row_ofs + col_idx;

      console.assert (output_idx + 3 < output.length);

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (x < pre)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let input_idx = row_ofs + 4 * left_reflect (x + w, 0);
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let block_ofs = 4 * w;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (x >= operate_width - post)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let block_ofs = 4 * w;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let input_idx = row_ofs + 4 * right_reflect (x + w, operate_width);
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

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

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function col_corr_down (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  stride
  )
{
  if (use_wasm)
  {
    _col_corr_down (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y+=stride)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * Math.floor (y / stride) * out_width;

    for (let x=0; x < operate_width; x++)
    {
      let col_idx = 4 * x;
      let output_idx = output_row_ofs + col_idx;
      let input_base_idx = row_ofs + col_idx;

      console.assert (output_idx + 3 < output.length)

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // top edge
      if (y < pre)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let input_idx = 4 * left_reflect (y + w, 0) * in_width + col_idx;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let block_ofs = 4 * w * in_width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // bottom edge
      else if (y >= operate_height - post)
      {
        for (let w=-pre; w <= 0; w++)
        {
          let block_ofs = 4 * w * in_width;
          let input_idx = input_base_idx + block_ofs;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (let w=1; w <= post; w++)
        {
          let input_idx = 4 * right_reflect (y + w, operate_height) * in_width + col_idx;
          let kernel_idx = w + pre;

          console.assert (input_idx + 3 < input.length);

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

          console.assert (input_idx + 3 < input.length);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function row_corr_up (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  clip_width,
  stride
  )
{
  if (use_wasm)
  {
    _row_corr_up (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      clip_width,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * y * out_width;

    for (let x=0; x < operate_width; x++)
    {
      let stop = Math.min ((x+1) * stride, clip_width);

      for (let xx=x*stride; xx < stop; xx++)
      {
        let output_col_idx = 4 * xx;
        let output_idx = output_row_ofs + output_col_idx;

        console.assert (output_idx + 3 < output.length);

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
        let kernel_ofs = mod_complement (xx + -pre, stride);
        let w = -pre + kernel_ofs;

        // left edge
        if (xx < pre)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = row_ofs + 4 *   left_reflect ((xx + w) / stride, 0);
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // right edge
        else if (xx >= clip_width - post)
        {
          for (; w <= 0; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = row_ofs + 4 * right_reflect((xx + w) / stride, operate_width);
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function col_corr_up (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  clip_height,
  stride
  )
{
  if (use_wasm)
  {
    _col_corr_up (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      clip_height,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y++)
  {
    for (let x=0; x < operate_width; x++)
    {
      let col_idx = 4 * x;
      let stop = Math.min ((y+1) * stride, clip_height);

      for (let yy=y*stride; yy < stop; yy++)
      {
        let output_row_ofs = 4 * yy * out_width;
        let output_idx = output_row_ofs + col_idx;

        console.assert (output_idx + 3 < output.length);

        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        let kernel_ofs = mod_complement (yy + -pre, stride);
        let w = -pre + kernel_ofs;

        // top edge
        if (yy < pre)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = 4 * left_reflect ((yy + w) / stride, 0) * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // bottom edge
        else if (yy >= clip_height - post)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * right_reflect((yy + w) / stride, operate_height) * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function row_corr_up_mult_add (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  clip_width,
  scale,
  stride
  )
{
  if (use_wasm)
  {
    _row_corr_up_mult_add (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      clip_width,
      scale,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * in_width;
    let output_row_ofs = 4 * y * out_width;

    for (let x=0; x < operate_width; x++)
    {
      let stop = Math.min ((x+1) * stride, clip_width);

      for (let xx=x*stride; xx < stop; xx++)
      {
        let output_col_idx = 4 * xx;
        let output_idx = output_row_ofs + output_col_idx;

        console.assert (output_idx + 3 < output.length);

        let kernel_ofs = mod_complement (xx + -pre, stride);
        let w = -pre + kernel_ofs;

        // left edge
        if (xx < pre)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = row_ofs + 4 *   left_reflect ((xx + w) / stride, 0);
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // right edge
        else if (xx >= clip_width - post)
        {
          for (; w <= 0; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = row_ofs + 4 * right_reflect((xx + w) / stride, operate_width);
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=stride)
          {
            let block_ofs = 4 * w;
            let input_idx = row_ofs + (output_col_idx + block_ofs) / stride;
            console.assert ((xx + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


/* Candidate for js->C->WebAssembly conversion. */
function col_corr_up_mult_add (
  input, in_width,
  output, out_width,
  operate_width, operate_height,
  clip_height,
  scale,
  stride
  )
{
  if (use_wasm)
  {
    _col_corr_up_mult_add (
      input.ptr, in_width,
      output.ptr, out_width,
      operate_width, operate_height,
      clip_height,
      scale,
      // stride,
      kernel.ptr, kernel.length,
      input.length, output.length
    );
    return;
  }

  var pre = Math.ceil ((kernel.length-1) / 2);
  var post = Math.floor ((kernel.length-1) / 2);

  for (let y=0; y < operate_height; y++)
  {
    for (let x=0; x < operate_width; x++)
    {
      let col_idx = 4 * x;
      let stop = Math.min ((y+1) * stride, clip_height);

      for (let yy=y*stride; yy < stop; yy++)
      {
        let output_row_ofs = 4 * yy * out_width;
        let output_idx = output_row_ofs + col_idx;

        console.assert (output_idx + 3 < output.length);

        let kernel_ofs = mod_complement (yy + -pre, stride);
        let w = -pre + kernel_ofs;

        // top edge
        if (yy < pre)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = 4 * left_reflect ((yy + w) / stride, 0) * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // bottom edge
        else if (yy >= clip_height - post)
        {
          for (; w <= 0; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * right_reflect((yy + w) / stride, operate_height) * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=stride)
          {
            let input_idx = 4 * (yy + w) / stride * in_width + col_idx;
            console.assert ((yy + w) % stride == 0); // guaranteed to be divisible
            let kernel_idx = w + pre;

            console.assert (input_idx + 3 < input.length);

            output[output_idx + 0] += scale * input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += scale * input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += scale * input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


/*
For loop inspector:

if (!(output_idx + 3 < output.length))
{
  window.dump = zip ($args(arguments.callee), Array.from (arguments));
  window.extra = ['x','y','yy','pre','post','output_idx','output.length','output.height','input.height'];
  window.extra_v = [x,y,yy,pre,post,output_idx,output.length,output.height,input.height];
  zip(extra,extra_v).forEach(row => dump.push(row))
  console.table(dump)
}
*/


/* Not used. */
/*
var gauss_kernels = [];
var gaussian = (x, mu, sigma) => Math.exp (-Math.pow((x-mu) / sigma,2) / 2);
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
