'use strict';


function checkbox_ui_init (checkbox_element)
{
  var element = checkbox_element;
  var parent = element.parentNode;

  parent.onclick = function (event)
  {
    if (event.target == element)
      return;

    element.checked = !element.checked;
    element.onchange();
  };
}


function range_ui_init (range_element)
{
  var element = range_element;
  var parent = element.parentNode;
  var label = parent.querySelector('label');
  var save = label.innerHTML;
  var [min, step, max] = [Number (element.min), Number (element.step), Number (element.max)];
  var print = (element.print) ? element.print : (x => x);
  var left, right, start, width, scale, offset;

  function handler (event)
  {
    var x = event.clientX + pageXOffset;
    if (x < left || x > right)
    {
      detach ();
      return;
    }

    var new_input = clamp (scale * x + offset, min, max);
    element.value = Math.round ((new_input - min) / step) * step + min;

    label.innerHTML = print (element.value);

    element.oninput();
  }

  function detach ()
  {
    document.body.removeEventListener ('mousemove', handler);
    label.innerHTML = save;
    element.classList.toggle ('input_focus');
  }

  parent.addEventListener ('mousedown', function (event)
  {
    left = parent.getBoundingClientRect().left + pageXOffset;
    right = left + parent.getBoundingClientRect().width;
    start = event.clientX + pageXOffset;
    width = element.getBoundingClientRect().width;
    scale = (Number(element.max) - Number(element.min)) / width;
    offset = -start * scale + Number(element.value);

    document.body.addEventListener('mousemove', handler);
    element.classList.toggle ('input_focus');
  },{passive:true});

  parent.addEventListener('mouseup', detach, {passive:true});

  element.onmousedown = event => event.preventDefault();
}


function radio_ui_init (radio_elements)
{
  var elements = Array.from (radio_elements);
  var parent = elements[0].parentNode;
  var length = elements.length;
  var current, element;

  parent.onclick = function (event)
  {
    if (event.target.type == 'radio')
      return;

    current = (elements.findIndex (e => e.checked) + 1) % length;
    element = elements[current];
    element.checked = true;
    element.onchange();
    element.classList.toggle ('input_focus');
  };
}


function custom_ui_init (name)
{
  var elements = document.getElementsByName(name);
  switch (elements[0].type)
  {
    case 'checkbox':
    {
      checkbox_ui_init (elements[0]);
      break;
    }
    case 'range':
    {
      range_ui_init (elements[0]);
      break;
    }
    case 'radio':
    {
      radio_ui_init (elements);
      break;
    }
  }
}
