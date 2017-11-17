var counter = 0;

var default_window = 50;
var working_pyramid = null;
var low1_pyramid = null;
var low2_pyramid = null;

var binomial_coefs =
[
	[1],
	[.5, .5],
	[.25, .5, .25],
	[.125, .375, .375, .125],
	[.0625, .25, .375, .25, .0625],
];


function filter (input, width, height)
{
	/*for (let y=0; y < height; y++)
	{
		for (let x=0; x < width; x++)
		{
			input[4 * (y * width + x) + 0] = ((y + x + counter) % (width + height - 1)) / (width + height - 1) * 255;
			input[4 * (y * width + x) + 1] = ((y + x + counter) % (width + height - 1)) / (width + height - 1) * 255;
			input[4 * (y * width + x) + 2] = ((y + x + counter) % (width + height - 1)) / (width + height - 1) * 255;
		}
	}
	counter++;
	*/
	if (!working_pyramid)
	{
		working_pyramid = new Uint8ClampedArray (input.length);
		// working_pyramid = new Float32Array (input.length);
		for (let i=0; i < 4*width*height; i+=4)
			working_pyramid[i + 3] = 255;
	}

	row_binomial_down (input, width, height, working_pyramid, null, true);

	// return Uint8ClampedArray.from (working_pyramid.map ((value, index) => {if (index%4!=3) return 255 - value; else return value;}));
	// return Uint8ClampedArray.from (working_pyramid.map ((value, index) => {if (index%4!=3) return Math.abs(input[index] - value); else return value;}));
	// return Uint8ClampedArray.from (working_pyramid);
	return working_pyramid;
}


function get_binomial_coefs (window)
{
	if (binomial_coefs.length >= window)
		return binomial_coefs [window - 1];

	for (let i=binomial_coefs.length; i < window; i++)
	{
		binomial_coefs.push (Array(i+1));
		binomial_coefs[i][0] = binomial_coefs[i][i] = binomial_coefs[i-1][0] / 2;
		for (let j=1; j < i; j++)
			binomial_coefs[i][j] = (binomial_coefs[i-1][j-1] + binomial_coefs[i-1][j]) / 2;
	}

	return binomial_coefs [window - 1];
}


function row_binomial_down (input, width, height, output, window, to_ntsc)
{
	if (window == null)
		window = default_window;

	kernel = get_binomial_coefs(window);

	if (to_ntsc)
		r_b_d_ntsc (input, width, height, output, kernel);
	else
		r_b_d (input, width, height, output, kernel);
}


function next_multiple (x, m)
{
	return x + (m - x % m) % m;
}


function r_b_d (input, width, height, output, kernel)
{
	const stride = 2;
	var pre = Math.ceil((kernel.length-1)/2);
	var post = Math.floor((kernel.length-1)/2);
	var pre_adjusted = next_multiple (pre, stride);
	var post_adjusted = next_multiple (width - post, stride);

	for (let y=0; y < height; y++)
	{
		let row_ofs = 4 * y * width;

		// left edge (reflect)
		for (let x=0; x < pre; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;

			// reflect...
			for (let w=-pre; w < -x; w++)
			{
				let reflect_ofs = 4 * -(x + w + 1);
				let input_idx = row_ofs + reflect_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
				output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
				output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
			}

			for (let w=-x; w < post; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
				output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
				output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
			}
		}
		// center
		for (let x=pre_adjusted; x < width - post; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;
			for (let w=-pre; w < post; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
				output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
				output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
			}
		}
		// right edge (reflect)
		for (let x=post_adjusted; x < width; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;

			for (let w=-pre; w < width-x; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
				output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
				output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
			}

			// reflect...
			for (let w=width-x; w < post; w++)
			{
				let reflect_ofs = 4 * (width - (w + x - width + 1));
				let input_idx = row_ofs + reflect_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += input[input_idx + 0] * kernel[kernel_idx];
				output[output_idx + 1] += input[input_idx + 1] * kernel[kernel_idx];
				output[output_idx + 2] += input[input_idx + 2] * kernel[kernel_idx];
			}
		}
	}
}


/* Identical to r_b_d() except for innermost loops.
   Performs rgb to ntsc conversion at the same time as convolution.

	Y   0.299	 0.587	 0.114	R
	I = 0.596	-0.274	-0.322	G
	Q   0.211	-0.523	 0.312	B
*/
function r_b_d_ntsc (input, width, height, output, kernel)
{
	const stride = 2;
	var pre = Math.floor((kernel.length-1)/2);
	var post = Math.ceil((kernel.length-1)/2);
	var pre_adjusted = next_multiple (pre, stride);
	var post_adjusted = next_multiple (width - post, stride);

	for (let y=0; y < height; y++)
	{
		let row_ofs = 4 * y * width;

		// left edge (policy: reflect)
		for (let x=0; x < pre; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;

			// reflect...
			for (let w=-pre; w < -x; w++)
			{
				let reflect_ofs = 4 * -(x + w + 1);
				let input_idx = row_ofs + reflect_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += (0.299 * input[input_idx + 0] + 0.587 * input[input_idx + 1] + 0.114 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 1] += (0.596 * input[input_idx + 0] + -0.274 * input[input_idx + 1] + -0.322 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 2] += (0.211 * input[input_idx + 0] + -0.523 * input[input_idx + 1] + 0.312 * input[input_idx + 2]) * kernel[kernel_idx];
			}

			for (let w=-x; w < post; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += (0.299 * input[input_idx + 0] + 0.587 * input[input_idx + 1] + 0.114 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 1] += (0.596 * input[input_idx + 0] + -0.274 * input[input_idx + 1] + -0.322 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 2] += (0.211 * input[input_idx + 0] + -0.523 * input[input_idx + 1] + 0.312 * input[input_idx + 2]) * kernel[kernel_idx];
			}
		}
		// center
		for (let x=pre_adjusted; x < width - post; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;

			for (let w=-pre; w < post; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += (0.299 * input[input_idx + 0] + 0.587 * input[input_idx + 1] + 0.114 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 1] += (0.596 * input[input_idx + 0] + -0.274 * input[input_idx + 1] + -0.322 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 2] += (0.211 * input[input_idx + 0] + -0.523 * input[input_idx + 1] + 0.312 * input[input_idx + 2]) * kernel[kernel_idx];
			}
		}
		// right edge (policy: reflect)
		for (let x=post_adjusted; x < width; x+=stride)
		{
			let col_idx = 4 * x;
			let out_col_idx = Math.floor (col_idx / stride);
			let output_idx = row_ofs + out_col_idx;

			output[output_idx + 0] = 0;
			output[output_idx + 1] = 0;
			output[output_idx + 2] = 0;

			for (let w=-pre; w < width-x; w++)
			{
				let block_ofs = 4 * w;
				let input_idx = row_ofs + col_idx + block_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += (0.299 * input[input_idx + 0] + 0.587 * input[input_idx + 1] + 0.114 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 1] += (0.596 * input[input_idx + 0] + -0.274 * input[input_idx + 1] + -0.322 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 2] += (0.211 * input[input_idx + 0] + -0.523 * input[input_idx + 1] + 0.312 * input[input_idx + 2]) * kernel[kernel_idx];
			}

			// reflect...
			for (let w=width-x; w < post; w++)
			{
				let reflect_ofs = 4 * (width - (w + x - width + 1));
				let input_idx = row_ofs + reflect_ofs;
				let kernel_idx = w + pre;

				output[output_idx + 0] += (0.299 * input[input_idx + 0] + 0.587 * input[input_idx + 1] + 0.114 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 1] += (0.596 * input[input_idx + 0] + -0.274 * input[input_idx + 1] + -0.322 * input[input_idx + 2]) * kernel[kernel_idx];
				output[output_idx + 2] += (0.211 * input[input_idx + 0] + -0.523 * input[input_idx + 1] + 0.312 * input[input_idx + 2]) * kernel[kernel_idx];
			}
		}
	}
}

	// ntsc to rgb
	/*1.000
	1.000
	1.000

    0.956
	-0.272
	-1.106

    0.621
	-0.647
    1.703*/

