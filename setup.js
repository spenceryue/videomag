var input, output;
var width, height;
var filter_on;
var defaults =
{
	'reflect-x': false,
	'hide': false,
	'filter_on': true,
};

function gum_success(mediaStream)
{
	window.stream = mediaStream;
	input.srcObject = mediaStream;

	input.onloadedmetadata = function(e)
	{
		input.play();
		width = output.canvas.width = input.videoWidth;
		height = output.canvas.height = input.videoHeight;
		render();
	};
}

function gum_error(error)
{
	console.error('Couldn\'t get access to webcam.', error);
}

var constraints =
{
	audio: false,
	video:
	{
		facingMode: "user",
		frameRate: 30,
	}
}

function image_input_init()
{
	input.src = input.src;
	input.onload = function ()
	{
		width = output.canvas.width = input.width;
		height = output.canvas.height = input.height;
		render();
	}
}

function get_option (name)
{
	return document.getElementsByName(name)[0].checked;
}

function bind_option (name, updater)
{
	document.getElementsByName(name)[0].onchange = updater;
}

function init_options ()
{
	for (let key in defaults)
		document.getElementsByName(key)[0].checked |= defaults[key];

	input.classList.toggle('hide', get_option('hide'));
	bind_option ('hide', event => input.classList.toggle ('hide', event.srcElement.checked));

	output.canvas.classList.toggle('reflect-x', get_option('reflect-x'));
	bind_option ('reflect-x', event => output.canvas.classList.toggle ('reflect-x', event.srcElement.checked));

	filter_on = get_option('filter_on');
	bind_option ('filter_on', event => filter_on = event.srcElement.checked);
}

function init ()
{
	input = document.querySelector('.input');
	output = document.querySelector('.output').getContext('2d');

	input.classList.toggle ('debug-border');
	output.canvas.classList.toggle ('debug-border');

	init_options();

	switch (input.tagName)
	{
		case 'VIDEO':
			if (input.src === '')
				navigator.mediaDevices.getUserMedia(constraints).
				then(gum_success).catch(gum_error);
		case 'IMG':
			image_input_init();
	}

}

window.addEventListener ('load', init);

function render (timestamp)
{
	output.drawImage (input, 0, 0);
	var frame = output.getImageData(0, 0, width, height);

	if (filter_on)
		filtered = filter (frame.data, width, height);

	output.putImageData (new ImageData(filtered, width, height), 0, 0);
	requestAnimationFrame (render)
}

