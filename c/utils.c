#include "utils.h"

void full_scale_contrast_stretch (FLOAT* input, uint32_t length, FLOAT min, FLOAT max)
{
  if (min < 0 || max < 0)
  {
    min = 255;
    max = 0;
    for (int i=0; i < length; i+=4)
    {
      FLOAT value = input[i + 0];
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  if (min == max)
    return;

  FLOAT scale = 255 / (max - min);
  FLOAT offset = -min * scale;

  for (int i=0; i < length; i+=4)
    input[i + 0] = scale * input[i + 0] + offset;
}


void img_fill_alpha (FLOAT* input, uint32_t length, FLOAT value)
{
  for (int i=0; i < length; i+=4)
  {
    ASSERT (i + 3 < length, "i: %d, length: %d", i, length);
    input[i + 3] = value;
  }
}


void img_fill_alpha_Uint8 (uint8_t* input, uint32_t length, uint8_t value)
{
  for (int i=0; i < length; i+=4)
  {
    ASSERT (i + 3 < length, "i: %d, length: %d", i, length);
    input[i + 3] = value;
  }
}


void img_fill (FLOAT* input, uint32_t length, FLOAT value)
{
  for (int i=0; i < length; i+=4)
  {
    ASSERT (i + 3 < length, "i: %d, length: %d", i, length);
    input[i + 0] = value;
    input[i + 1] = value;
    input[i + 2] = value;
  }
}


void img_copy (
  FLOAT* input, uint16_t in_width,
  FLOAT* output, uint16_t out_width,
  uint16_t rows, uint16_t cols,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  for (int y=0; y < rows; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < cols; x++)
    {
      int input_idx = row_ofs + 4 * x;
      int output_idx = output_row_ofs + 4 * x;

      ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d", input_idx, IN_LENGTH);
      ASSERT (output_idx + 3 < OUT_LENGTH, "output_idx: %d, OUT_LENGTH: %d", output_idx, OUT_LENGTH);

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


void img_copy_to_Uint8 (
  FLOAT* input, uint16_t in_width,
  uint8_t* output, uint16_t out_width,
  uint16_t rows, uint16_t cols,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  for (int y=0; y < rows; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < cols; x++)
    {
      int input_idx = row_ofs + 4 * x;
      int output_idx = output_row_ofs + 4 * x;

      ASSERT (input_idx + 3 < IN_LENGTH, "input_idx: %d, IN_LENGTH: %d", input_idx, IN_LENGTH);
      ASSERT (output_idx + 3 < OUT_LENGTH, "output_idx: %d, OUT_LENGTH: %d", output_idx, OUT_LENGTH);

      output[output_idx + 0] = clamp (input[input_idx + 0], 0, 255);
      output[output_idx + 1] = clamp (input[input_idx + 1], 0, 255);
      output[output_idx + 2] = clamp (input[input_idx + 2], 0, 255);
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


void img_linear_combine (
  FLOAT* input_a, FLOAT* input_b,
  FLOAT weight_a, FLOAT weight_b,
  FLOAT* output,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t in_width, uint16_t out_width,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int input_idx = row_ofs + 4 * x;
      int output_idx = output_row_ofs + 4 * x;

      ASSERT (input_idx + 3 < IN_LENGTH, "");
      ASSERT (output_idx + 3 < OUT_LENGTH, "");

      output[output_idx + 0] = weight_a * input_a[input_idx + 0] + weight_b * input_b[input_idx + 0];
      output[output_idx + 1] = weight_a * input_a[input_idx + 1] + weight_b * input_b[input_idx + 1];
      output[output_idx + 2] = weight_a * input_a[input_idx + 2] + weight_b * input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


void img_linear_combine_chroma_attenuate (
  FLOAT* input_a, FLOAT* input_b,
  FLOAT weight_a, FLOAT weight_b, FLOAT chroma_attenuation,
  FLOAT* output,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t in_width, uint16_t out_width,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  FLOAT weight_a_attenuated = weight_a * chroma_attenuation;
  FLOAT weight_b_attenuated = weight_b * chroma_attenuation;

  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int input_idx = row_ofs + 4 * x;
      int output_idx = output_row_ofs + 4 * x;

      ASSERT (input_idx + 3 < IN_LENGTH, "");
      ASSERT (output_idx + 3 < OUT_LENGTH, "");

      output[output_idx + 0] = weight_a * input_a[input_idx + 0] + weight_b * input_b[input_idx + 0];
      output[output_idx + 1] = weight_a_attenuated * input_a[input_idx + 1] + weight_b_attenuated * input_b[input_idx + 1];
      output[output_idx + 2] = weight_a_attenuated * input_a[input_idx + 2] + weight_b_attenuated * input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}


void img_subtract (
  FLOAT* input_a, FLOAT* input_b,
  FLOAT* output,
  uint16_t operate_width, uint16_t operate_height,
  uint16_t in_width, uint16_t out_width,
  uint32_t IN_LENGTH, uint32_t OUT_LENGTH
  )
{
  for (int y=0; y < operate_height; y++)
  {
    int row_ofs = 4 * y * in_width;
    int output_row_ofs = 4 * y * out_width;

    for (int x=0; x < operate_width; x++)
    {
      int input_idx = row_ofs + 4 * x;
      int output_idx = output_row_ofs + 4 * x;

      ASSERT (input_idx + 3 < IN_LENGTH, "");
      ASSERT (output_idx + 3 < OUT_LENGTH, "");

      output[output_idx + 0] = input_a[input_idx + 0] - input_b[input_idx + 0];
      output[output_idx + 1] = input_a[input_idx + 1] - input_b[input_idx + 1];
      output[output_idx + 2] = input_a[input_idx + 2] - input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }
}
