#include "blur_filter.h"
#include "utils.h"


void row_corr_down (
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  int pre = (window-1 + 1) / 2;
  int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x+=STRIDE)
    {
      int col_idx = 4 * x;
      int output_col_idx = (col_idx / STRIDE);
      int output_idx = output_row_ofs + output_col_idx;
      int input_base_idx = row_ofs + col_idx;

      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);;

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // left edge
      if (x < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int input_idx = row_ofs + 4 * left_reflect (x + w, 0);
          int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

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
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int input_idx = row_ofs + 4 * right_reflect (x + w, operate_width);
          int kernel_idx = w + pre;

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
          int block_ofs = 4 * w;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

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
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  int pre = (window-1 + 1) / 2;
  int post = (window-1) / 2;

  for (int y=0; y < operate_height; y+=STRIDE)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * (y / STRIDE) * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int col_idx = 4 * x;
      int output_idx = output_row_ofs + col_idx;
      int input_base_idx = row_ofs + col_idx;

      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

      output[output_idx + 0] = output[output_idx + 1] = output[output_idx + 2] = 0;

      // top edge
      if (y < pre)
      {
        for (int w=-pre; w <= 0; w++)
        {
          int input_idx = 4 * left_reflect (y + w, 0) * in_width + col_idx;
          int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

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
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

          ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

          output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
          output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
          output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
        }
        for (int w=1; w <= post; w++)
        {
          int input_idx = 4 * right_reflect (y + w, operate_height) * in_width + col_idx;
          int kernel_idx = w + pre;

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
          int block_ofs = 4 * w * in_width;
          int input_idx = input_base_idx + block_ofs;
          int kernel_idx = w + pre;

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
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_width,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  int pre = (window-1 + 1) / 2;
  int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int stop = min ((x + 1) * STRIDE, clip_width);

      for (int xx=x*STRIDE; xx < stop; xx++)
      {
        int output_col_idx = 4 * xx;
        int output_idx = output_row_ofs + output_col_idx;

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
        int kernel_ofs = mod_complement (xx + -pre, STRIDE);
        int w = -pre + kernel_ofs;

        // left edge
        if (xx < pre)
        {
          for (; w <= 0; w+=STRIDE)
          {
            int input_idx = row_ofs + 4 *   left_reflect ((xx + w) / STRIDE, 0);
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            int block_ofs = 4 * w;
            int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
            int block_ofs = 4 * w;
            int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
            output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
            output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            int input_idx = row_ofs + 4 * right_reflect((xx + w) / STRIDE, operate_width);
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
            int block_ofs = 4 * w;
            int input_idx = row_ofs + (output_col_idx + block_ofs) / STRIDE;
            ASSERT ((xx + w)%STRIDE == 0, "xx+w: %d, (xx+w)%%STRIDE: %d\n", xx+w, (xx+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_height,
  float scale,
  // uint8_t stride,
  float* kernel, uint8_t window,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  int pre = (window-1 + 1) / 2;
  int post = (window-1) / 2;

  for (int y=0; y < operate_height; y++)
  {
    for (int x=0; x < operate_width; x++)
    {
      int col_idx = 4 * x;
      int stop = min ((y + 1) * STRIDE, clip_height);

      for (int yy=y*STRIDE; yy < stop; yy++)
      {
        int output_row_ofs = 4 * yy * out_width;
        int output_idx = output_row_ofs + col_idx;

        ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);;

        int kernel_ofs = mod_complement (yy + -pre, STRIDE);
        int w = -pre + kernel_ofs;

        float scratch_2, scratch_1, scratch_0 = scratch_1 = scratch_2 = 0;

        // top edge
        if (yy < pre)
        {
          for (; w <= 0; w+=STRIDE)
          {
            int input_idx = 4 * left_reflect ((yy + w) / STRIDE, 0) * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
            int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

            ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d\n", input_idx, IN_LENGTH);

            scratch_0 += input[input_idx + 0] * kernel[kernel_idx];
            scratch_1 += input[input_idx + 1] * kernel[kernel_idx];
            scratch_2 += input[input_idx + 2] * kernel[kernel_idx];
          }
          for (; w <= post; w+=STRIDE)
          {
            int input_idx = 4 * right_reflect((yy + w) / STRIDE, operate_height) * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
            int input_idx = 4 * (yy + w) / STRIDE * in_width + col_idx;
            ASSERT ((yy + w)%STRIDE == 0, "yy+w: %d, (yy+w)%%STRIDE: %d\n", yy+w, (yy+w)%STRIDE);  // guaranteed to be divisible
            int kernel_idx = w + pre;

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
  float* input, int in_width,
  float* output, int out_width,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t clip_height,
  float scale,
  // uint8_t stride,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  const float kernel[5] = {0.0625, 0.25, 0.375, 0.25, 0.0625};

  for (int y=0; y < operate_height; y++)
  {
    int input_row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * STRIDE * out_width;
    int next_output_row_ofs = 4 * (y+1) * STRIDE * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int col_idx = 4 * x;
      int input_idx[5];

      input_idx[1] = input_row_ofs + col_idx;
      ASSERT ((0 <= input_idx[0]) && (input_idx[0] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[0], IN_LENGTH);
      input_idx[0] = left_reflect(input_idx[1] - 2, 0);
      ASSERT ((0 <= input_idx[1]) && (input_idx[1] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[1], IN_LENGTH);
      input_idx[2] = right_reflect(input_idx[1] + 2, IN_LENGTH);
      ASSERT ((0 <= input_idx[2]) && (input_idx[2] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[2], IN_LENGTH);

      int output_idx = output_row_ofs + col_idx;
      ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

      output[output_idx + 0] += scale * (kernel[0] * input[input_idx[0] + 0] + kernel[2] * input[input_idx[1] + 0] + kernel[4] * input[input_idx[2] + 0]);
      output[output_idx + 1] += scale * (kernel[0] * input[input_idx[0] + 1] + kernel[2] * input[input_idx[1] + 1] + kernel[4] * input[input_idx[2] + 1]);
      output[output_idx + 2] += scale * (kernel[0] * input[input_idx[0] + 2] + kernel[2] * input[input_idx[1] + 2] + kernel[4] * input[input_idx[2] + 2]);

      if ((y+1)*STRIDE < clip_height)
      {
        input_idx[3] = left_reflect(input_idx[1] - 1, 0);
        ASSERT ((0 <= input_idx[3]) && (input_idx[3] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[3], IN_LENGTH);
        input_idx[4] = right_reflect(input_idx[1] + 1, IN_LENGTH);
        ASSERT ((0 <= input_idx[4]) && (input_idx[4] + 3 < IN_LENGTH), "input_idx: %d, IN_LENGTH: %d\n", input_idx[4], IN_LENGTH);

        output_idx = next_output_row_ofs + col_idx;
        ASSERT (output_idx + 3 < OUT_LENGTH, "y: %d, x: %d, output_idx: %d, OUT_LENGTH: %d\n", y, x, output_idx, OUT_LENGTH);

        output[output_idx + 0] += scale * (kernel[1] * input[input_idx[3] + 0] + kernel[3] * input[input_idx[4] + 0]);
        output[output_idx + 1] += scale * (kernel[1] * input[input_idx[3] + 1] + kernel[3] * input[input_idx[4] + 1]);
        output[output_idx + 2] += scale * (kernel[1] * input[input_idx[3] + 2] + kernel[3] * input[input_idx[4] + 2]);
      }
    }
  }
}
