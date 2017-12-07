#include "blur_filter.h"
#include "utils.h"


void row_corr_down (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH, const uint32_t OUT_LENGTH
  )
{
  const int pre = (window-1 + 1) / 2;
  const int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    const int row_ofs = 4 * y * in_width;
    const int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x+=STRIDE)
    {
      const int col_idx = 4 * x;
      const int output_col_idx = (col_idx / STRIDE);
      const int output_idx = output_row_ofs + output_col_idx;
      const int input_base_idx = row_ofs + col_idx;

      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (x < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          const int input_idx = row_ofs + 4 * left_reflect (x + w, 0);
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          const int block_ofs = 4 * w;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // right edge
      else if (x >= operate_width - post)
      {
        for (int w=-pre; w <= 0; w++)
        {
          const int block_ofs = 4 * w;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          const int input_idx = row_ofs + 4 * right_reflect (x + w, operate_width);
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (int w=-pre; w <= post; w++)
        {
          const int block_ofs = 4 * w;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


void col_corr_down (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH, const uint32_t OUT_LENGTH
  )
{
  const int pre = (window-1 + 1) / 2;
  const int post = (window-1) / 2;

  for (int y=0; y < operate_height; y+=STRIDE)
  {
    const int row_ofs = 4 * y * in_width;
    const int output_row_ofs = 4 * (y / STRIDE) * out_width;

    for (int x=0; x < operate_width; x++)
    {
      const int col_idx = 4 * x;
      const int output_idx = output_row_ofs + col_idx;
      const int input_base_idx = row_ofs + col_idx;

      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // top edge
      if (y < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          const int input_idx = 4 * left_reflect (y + w, 0) * in_width + col_idx;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          const int block_ofs = 4 * w * in_width;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // bottom edge
      else if (y >= operate_height - post)
      {
        for (int w=-pre; w <= 0; w++)
        {
          const int block_ofs = 4 * w * in_width;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          const int input_idx = 4 * right_reflect (y + w, operate_height) * in_width + col_idx;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
      // center
      else
      {
        for (int w=-pre; w <= post; w++)
        {
          const int block_ofs = 4 * w * in_width;
          const int input_idx = input_base_idx + block_ofs;
          const int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
      }
    }
  }
}


void row_corr_up (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  const uint16_t clip_width,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH, const uint32_t OUT_LENGTH
  )
{
  const int pre = (window-1 + 1) / 2;
  const int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    const int row_ofs = 4 * y * in_width;
    const int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x++)
    {
      const int stop = min ((x + 1) * STRIDE, clip_width);

      for (int xx=x*STRIDE; xx < stop; xx++)
      {
        const int output_col_idx = 4 * xx;
        const int output_idx = output_row_ofs + output_col_idx;

        ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);;

        output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;
        // Start off aligned with a nonzero element of upsampled input.
        // Then loop by STRIDE, since other elements are zero.
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
            We STRIDE over kernel elements by the upsample factor, since the corresponding upsampled
            input elements in between STRIDES are zero.
            We always use a non-negative offset so that the kernel array is not read out of bounds.
            The offset is calculated by the positive result of remainder(xx + pre, STRIDE).
        */
        const int kernel_ofs = mod_complement (xx + -pre, STRIDE);
        int w = -pre + kernel_ofs;

        // left edge
        if (xx < pre)
        {
          for (; w <= 0; w+=STRIDE)
          {
            const int input_idx = row_ofs + 4 *   left_reflect ((xx + w) / STRIDE, 0);
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            const int block_ofs = 4 * w;
            const int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // right edge
        else if (xx >= clip_width - post)
        {
          for (; w <= 0; w+=STRIDE)
          {
            const int block_ofs = 4 * w;
            const int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            const int input_idx = row_ofs + 4 * right_reflect((xx + w) / STRIDE, operate_width);
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=STRIDE)
          {
            const int block_ofs = 4 * w;
            const int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
      }
    }
  }
}


void col_corr_up_mult_add (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  const uint16_t clip_height,
  const FLOAT scale,
  // const uint8_t stride,
  const FLOAT* kernel, const uint8_t window,
  const uint32_t IN_LENGTH, const uint32_t OUT_LENGTH
  )
{
  const int pre = (window-1 + 1) / 2;
  const int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    for (int x=0; x < operate_width; x++)
    {
      const int col_idx = 4 * x;
      const int stop = min ((y + 1) * STRIDE, clip_height);

      for (int yy=y*STRIDE; yy < stop; yy++)
      {
        const int output_row_ofs = 4 * yy * out_width;
        const int output_idx = output_row_ofs + col_idx;

        ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);;

        const int kernel_ofs = mod_complement (yy + -pre, STRIDE);
        int w = -pre + kernel_ofs;

        FLOAT scratch_2, scratch_1, scratch_0 = scratch_1 = scratch_2 = 0;

        // top edge
        if (yy < pre)
        {
          for (; w <= 0; w+=STRIDE)
          {
            const int input_idx = 4 * left_reflect ((yy + w) / STRIDE, 0) * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            const int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // bottom edge
        else if (yy >= clip_height - post)
        {
          for (; w <= 0; w+=STRIDE)
          {
            const int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            const int input_idx = 4 * right_reflect((yy + w) / STRIDE, operate_height) * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
        }
        // center
        else
        {
          for (; w <= post; w+=STRIDE)
          {
            const int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            const int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
        }

        output[output_idx + 0] += scale * scratch_0;
        output[output_idx + 1] += scale * scratch_1;
        output[output_idx + 2] += scale * scratch_2;
      }
    }
  }
}


void blur5_corr_up_mult_add (
  const FLOAT* input, const int in_width,
  FLOAT* output, const int out_width,
  const uint16_t operate_width, const uint16_t operate_height,
  const uint16_t clip_height,
  const FLOAT scale,
  // const uint8_t stride,
  const uint32_t IN_LENGTH,
  const uint32_t OUT_LENGTH
  )
{
  const FLOAT kernel[5] = {0.0625, 0.25, 0.375, 0.25, 0.0625};

  for (int y=0; y < operate_height; y++)
  {
    const int input_row_ofs = 4 * y * in_width;
    const int output_row_ofs = 4 * y * STRIDE * out_width;
    const int next_output_row_ofs = 4 * (y * STRIDE + 1) * out_width;

    for (int x=0; x < operate_width; x++)
    {
      const int col_idx = 4 * x;
      int input_idx[3];
      int output_idx = output_row_ofs + col_idx;
      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

      input_idx[0] = 4 * left_reflect (y - 1, 0) * in_width + col_idx;
      ASSERT ((0 <= input_idx[0]) && (input_idx[0] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[0], IN_LENGTH);

      input_idx[1] = input_row_ofs + col_idx;
      ASSERT ((0 <= input_idx[1]) && (input_idx[1] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[1], IN_LENGTH);

      input_idx[2] = 4 * right_reflect (y + 1, operate_height) * in_width + col_idx;
      ASSERT ((0 <= input_idx[2]) && (input_idx[2] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[2], IN_LENGTH);

      output[output_idx + 0] += scale * (kernel[0] * input[input_idx[0] + 0] + kernel[2] * input[input_idx[1] + 0] + kernel[4] * input[input_idx[2] + 0]);
      output[output_idx + 1] += scale * (kernel[0] * input[input_idx[0] + 1] + kernel[2] * input[input_idx[1] + 1] + kernel[4] * input[input_idx[2] + 1]);
      output[output_idx + 2] += scale * (kernel[0] * input[input_idx[0] + 2] + kernel[2] * input[input_idx[1] + 2] + kernel[4] * input[input_idx[2] + 2]);

      if (y * STRIDE + 1 < clip_height)
      {
        output_idx = next_output_row_ofs + col_idx;
        ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

        output[output_idx + 0] += scale * (kernel[1] * input[input_idx[1] + 0] + kernel[3] * input[input_idx[2] + 0]);
        output[output_idx + 1] += scale * (kernel[1] * input[input_idx[1] + 1] + kernel[3] * input[input_idx[2] + 1]);
        output[output_idx + 2] += scale * (kernel[1] * input[input_idx[1] + 2] + kernel[3] * input[input_idx[2] + 2]);
      }
    }
  }
}
