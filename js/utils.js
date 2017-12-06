'use strict';


/* Candidate for js->C->WebAssembly conversion. */
function full_scale_contrast_stretch (input, min, max, _use_wasm=use_wasm)
{
  if (_use_wasm)
  {
    if (min == undefined || max == undefined)
      min = max = -1;
    _full_scale_contrast_stretch (input.ptr, length, min, max);
    return input;
  }

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

  // console.log ('fscs min:',min,'max:',max);
  if (min == max)
    return;

  var scale = 255 / (max - min);
  var offset = -min * scale;

  for (let i=0; i < input.length; i+=4)
    input[i + 0] = scale * input[i + 0] + offset;

  return input;
}


/* Candidate for js->C->WebAssembly conversion. */
function fill_alpha (input, value, _use_wasm=use_wasm)
{
  if (_use_wasm)
  {
    if (input instanceof Uint8ClampedArray || input instanceof Uint8Array)
      _fill_alpha_Uint8 (input.ptr, input.length, value);
    else if (input instanceof Float32Array || input instanceof Float64Array)
      _fill_alpha (input.ptr, input.length, value);
    return input;
  }

  for (let i=0; i < input.length; i+=4)
  {
    console.assert (i + 3 < input.length, "i: %d, input.length: %d", i, input.length);
    input[i + 3] = value;
  }

  return input;
}


/* Candidate for js->C->WebAssembly conversion. */
function img_copy (
  input,
  output,
  operate_width=input.width, operate_height=input.height,
  _use_wasm=use_wasm
  )
{
  console.assert (typeof input.width != 'undefined')
  console.assert (typeof output.width != 'undefined')

  if (_use_wasm)
  {
    if (output instanceof Uint8ClampedArray || output instanceof Uint8Array)
      _img_copy_to_Uint8 (
        input.ptr, input.width,
        output.ptr, output.width,
        operate_height, operate_width,
        input.length, output.length
      );
    else if (output instanceof Float32Array || output instanceof Float64Array)
      _img_copy (
        input.ptr, input.width,
        output.ptr, output.width,
        operate_height, operate_width,
        input.length, output.length
      );
    else
      throw 'invalid output array type!'

    validate_pyramid_memory ()


    return;
  }

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * input.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < operate_width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx + 3 < input.length);
      console.assert (output_idx + 3 < output.length);

      output[output_idx + 0] = input[input_idx + 0];
      output[output_idx + 1] = input[input_idx + 1];
      output[output_idx + 2] = input[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }

  validate_pyramid_memory ()
}


/* Candidate for js->C->WebAssembly conversion. */
function img_linear_combine (
  input_a, input_b,
  weight_a, weight_b,
  output,
  operate_width=input_a.width, operate_height=input_a.height,
  _use_wasm=use_wasm
  )
{
  console.assert (typeof input_a.width != 'undefined')
  console.assert (typeof output.width != 'undefined')
  console.assert (input_a.width == input_b.width);
  console.assert (input_a.height == input_b.height);
  console.assert (input_a.length == input_b.length);

  if (_use_wasm)
  {
    _img_linear_combine (
      input_a.ptr, input_b.ptr,
      weight_a, weight_b,
      output.ptr,
      operate_width, operate_height,
      input_a.width, output.width,
      input_a.length, output.length
    );
    validate_pyramid_memory ()

    return;
  }

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * input_a.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < operate_width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx + 3 < input_a.length);
      console.assert (input_idx + 3 < input_b.length);
      console.assert (output_idx + 3 < output.length);

      output[output_idx + 0] = weight_a * input_a[input_idx + 0] + weight_b * input_b[input_idx + 0];
      output[output_idx + 1] = weight_a * input_a[input_idx + 1] + weight_b * input_b[input_idx + 1];
      output[output_idx + 2] = weight_a * input_a[input_idx + 2] + weight_b * input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];

    }
  }

  validate_pyramid_memory ()
}


/* Candidate for js->C->WebAssembly conversion. */
function img_linear_combine_chroma_attenuate (
  input_a, input_b,
  weight_a, weight_b, chroma_attenuation,
  output,
  operate_width=input_a.width, operate_height=input_a.height,
  _use_wasm=use_wasm
  )
{
  console.assert (typeof input_a.width != 'undefined')
  console.assert (typeof output.width != 'undefined')
  console.assert (input_a.width == input_b.width);
  console.assert (input_a.height == input_b.height);
  console.assert (input_a.length == input_b.length);

  if (_use_wasm)
  {
    _img_linear_combine_chroma_attenuate (
      input_a.ptr, input_b.ptr,
      weight_a, weight_b, chroma_attenuation,
      output.ptr,
      operate_width, operate_height,
      input_a.width, output.width,
      input_a.length, output.length
    );
    validate_pyramid_memory ()

    return;
  }

  var weight_a_attenuate = weight_a * chroma_attenuation;
  var weight_b_attenuate = weight_b * chroma_attenuation;

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * input_a.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < operate_width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx + 3 < input_a.length);
      console.assert (input_idx + 3 < input_b.length);
      console.assert (output_idx + 3 < output.length);

      output[output_idx + 0] = weight_a * input_a[input_idx + 0] + weight_b * input_b[input_idx + 0];
      output[output_idx + 1] = weight_a_attenuate * input_a[input_idx + 1] + weight_b_attenuate * input_b[input_idx + 1];
      output[output_idx + 2] = weight_a_attenuate * input_a[input_idx + 2] + weight_b_attenuate * input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];

    }
  }

  validate_pyramid_memory ()
}


/* Candidate for js->C->WebAssembly conversion. */
function img_subtract (
  input_a, input_b,
  output,
  operate_width=input_a.width, operate_height=input_a.height,
  _use_wasm=use_wasm
  )
{
  console.assert (typeof input_a.width != 'undefined')
  console.assert (typeof output.width != 'undefined')
  console.assert (input_a.width == input_b.width);
  console.assert (input_a.height == input_b.height);
  console.assert (input_a.length == input_b.length);

  if (_use_wasm)
  {
    _img_subtract (
      input_a.ptr, input_b.ptr,
      output.ptr,
      operate_width, operate_height,
      input_a.width, output.width,
      input_a.length, output.length
    );
    validate_pyramid_memory ()

    return;
  }

  for (let y=0; y < operate_height; y++)
  {
    let row_ofs = 4 * y * input_a.width;
    let output_row_ofs = 4 * y * output.width;

    for (let x=0; x < operate_width; x++)
    {
      let input_idx = row_ofs + 4 * x;
      let output_idx = output_row_ofs + 4 * x;

      console.assert (input_idx + 3 < input_a.length);
      console.assert (input_idx + 3 < input_b.length);
      console.assert (output_idx + 3 < output.length);

      output[output_idx + 0] = input_a[input_idx + 0] - input_b[input_idx + 0];
      output[output_idx + 1] = input_a[input_idx + 1] - input_b[input_idx + 1];
      output[output_idx + 2] = input_a[input_idx + 2] - input_b[input_idx + 2];
      // output[output_idx + 3] = input[input_idx + 3];
    }
  }

  validate_pyramid_memory ()
}


function img_show (context, img, x=0, y=0)
{
  let data = new ImageData (
    img,
    img.width,
    img.height
  );

  context.putImageData (data, x, y);
}


/* Possible js->C->WebAssembly dependency. */
function next_multiple (x, m)
{
  return x + (m - x % m) % m;
}


/* Possible js->C->WebAssembly dependency. */
function positive_mod (x, m)
{
  return (x < 0) ? ((x % m + m) % m) : (x % m);
}


/* Possible js->C->WebAssembly dependency. */
function mod_complement (x, m)
{
  return positive_mod (-x, m);
}


/* Possible js->C->WebAssembly dependency. */
function left_reflect (i, min)
{
  // start + [ reflected distance ]
  // (min) + [ (min - 1) - i ]
  return (i < min) ? 2 * min - 1 - i : i;
}


/* Possible js->C->WebAssembly dependency. */
function right_reflect (i, max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return (i >= max) ? 2 * max - 1 - i : i;
}


/* Possible js->C->WebAssembly dependency. */
function both_reflect (i, min, max)
{
  // (last valid) - (reflected distance)
  // (max - 1) - (i - max)
  return left_reflect (right_reflect (i, max), min);
}


/* Possible js->C->WebAssembly dependency. */
function clamp (x, min, max)
{
  return Math.min (Math.max (x, min), max);
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


function add_div (width, height, parent, left=0, top=0)
{
  var a = document.createElement('div');
  a.style.width = width + 'px';
  a.style.height = height + 'px';
  a.style.position = 'absolute';
  a.classList.toggle('debug_border');

  if (parent)
  {
    parent.appendChild (a);
    a.style.left = left + 'px';
    a.style.top = top + 'px';
  }

  return a;
}


/* From here: http://javascript.info/coordinates */
function getCoords (elem)
{
  let box = elem.getBoundingClientRect();

  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  };
}


function within_bounds (mouse_event, element)
{
  var [x, y] = [mouse_event.clientX, mouse_event.clientY];
  var bounds = element.getBoundingClientRect();
  var [left, right, top, bottom] = [bounds.left, bounds.left + bounds.width,
                                    bounds.top, bounds.top + bounds.height];

  return (left <= x) && (x <= right) && (top <= y) && (y <= bottom);
}


/* From here: https://stackoverflow.com/a/11381730/3624264 */
function is_mobile_or_tablet () {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}


function detach (element)
{
  var coords = element.getBoundingClientRect ();

  element.save = {
    position: element.style.position ? element.style.position : 'unset',
    left: element.style.left ? element.style.left : 'unset',
    top: element.style.top ? element.style.top : 'unset',
    width: element.style.width ? element.style.width : 'unset',
    height: element.style.height ? element.style.height : 'unset',
    parentNode: element.parentNode,
    next: element.nextSibling
  };

  element.style.position = 'fixed';
  element.style.left = coords.left + pageXOffset + 'px';
  element.style.top = coords.top + pageYOffset + 'px';
  element.style.width = coords.width + 'px';
  element.style.height = coords.height + 'px';
  document.body.append (element);
}

function undo_detach (element)
{
  element.style.position = element.save.position;
  element.style.left = element.save.left;
  element.style.top = element.save.top;
  element.style.width = element.save.width;
  element.style.height = element.save.height;
  element.save.parentNode.insertBefore (
    element,
    element.save.next
  );
}


/*
Loop inspector
if (output[output_idx + 0] > 1000
  || output[output_idx + 1] > 1000
  || output[output_idx + 2] > 1000)
{
  window.data = [output[output_idx + 0], output[output_idx + 1], output[output_idx + 2], input_a[input_idx + 0], input_a[input_idx + 1], input_a[input_idx + 2], input_b[input_idx + 0], input_b[input_idx + 1], input_b[input_idx + 2], weight_a, weight_b];
  window.labels = ['output[output_idx + 0]', 'output[output_idx + 1]', 'output[output_idx + 2]', 'input_a[input_idx + 0]', 'input_a[input_idx + 1]', 'input_a[input_idx + 2]', 'input_b[input_idx + 0]', 'input_b[input_idx + 1]', 'input_b[input_idx + 2]', 'weight_a', 'weight_b'];
  console.table (zip (labels, data));
  throw 'up';
}
*/
